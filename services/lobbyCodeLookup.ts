import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LobbyCodeMapping } from '@/services/database';
import { LOBBY_CODE_LENGTH } from '@/services/lobbyCode';
import { restGetDetailed, type RestFailure } from '@/services/firebaseRest';

const STORAGE_KEY = 'lobbyCodeLookupRateLimit.v1';
export const LOBBY_CODE_LOOKUP_WINDOW_MS = 10 * 60 * 1000;
export const LOBBY_CODE_LOOKUP_MAX_ATTEMPTS = 20;

type RateLimitState = {
  windowStart: number;
  count: number;
  /** Distinct codes already charged in this window (join preview reuse). */
  seenCodes: string[];
};

export type LobbyCodeLookupResult =
  | { found: true; mapping: LobbyCodeMapping | string }
  | { found: false; mapping: null };

export class LobbyCodeLookupError extends Error {
  readonly code: string;
  readonly retryAfterMs?: number;

  constructor(code: string, message: string, retryAfterMs?: number) {
    super(message);
    this.name = 'LobbyCodeLookupError';
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

function emptyState(now: number): RateLimitState {
  return { windowStart: now, count: 0, seenCodes: [] };
}

async function readState(now: number): Promise<RateLimitState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState(now);
    }
    const parsed = JSON.parse(raw) as Partial<RateLimitState>;
    if (
      typeof parsed.windowStart !== 'number' ||
      typeof parsed.count !== 'number' ||
      !Array.isArray(parsed.seenCodes)
    ) {
      return emptyState(now);
    }
    if (now - parsed.windowStart > LOBBY_CODE_LOOKUP_WINDOW_MS) {
      return emptyState(now);
    }
    return {
      windowStart: parsed.windowStart,
      count: parsed.count,
      seenCodes: parsed.seenCodes.filter((code) => typeof code === 'string'),
    };
  } catch {
    return emptyState(now);
  }
}

async function writeState(state: RateLimitState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function assertValidLobbyCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== LOBBY_CODE_LENGTH) {
    throw new LobbyCodeLookupError(
      'invalid-argument',
      `Lobby code must be ${LOBBY_CODE_LENGTH} characters.`
    );
  }
  return normalized;
}

/**
 * Consume one lookup credit. Pass a code to charge unique codes only once
 * per window (safe for join-preview polling). Omit code for collision checks.
 */
export async function consumeLobbyCodeLookup(
  code?: string
): Promise<{ ok: true } | { ok: false; retryAfterMs: number }> {
  const now = Date.now();
  const normalized =
    code != null && code.trim() ? assertValidLobbyCode(code) : null;
  const state = await readState(now);

  if (normalized && state.seenCodes.includes(normalized)) {
    return { ok: true };
  }

  if (state.count >= LOBBY_CODE_LOOKUP_MAX_ATTEMPTS) {
    const retryAfterMs = Math.max(
      0,
      state.windowStart + LOBBY_CODE_LOOKUP_WINDOW_MS - now
    );
    return { ok: false, retryAfterMs };
  }

  const next: RateLimitState = {
    windowStart: state.windowStart,
    count: state.count + 1,
    seenCodes: normalized
      ? [...state.seenCodes, normalized].slice(-LOBBY_CODE_LOOKUP_MAX_ATTEMPTS)
      : state.seenCodes,
  };
  await writeState(next);
  return { ok: true };
}

export function isRateLimitedLookupError(error: unknown): boolean {
  if (error instanceof LobbyCodeLookupError) {
    return error.code === 'resource-exhausted';
  }
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('too many lobby code');
}

export function formatLobbyCodeLookupError(error: unknown): string {
  if (error instanceof LobbyCodeLookupError) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'error' in error) {
    return String((error as RestFailure).error);
  }
  return error instanceof Error ? error.message : String(error);
}

async function gatedGet(
  code: string,
  options?: { chargeUniqueCode?: boolean }
): Promise<LobbyCodeLookupResult> {
  const normalized = assertValidLobbyCode(code);
  const gate = await consumeLobbyCodeLookup(
    options?.chargeUniqueCode === false ? undefined : normalized
  );
  if (!gate.ok) {
    const minutes = Math.max(1, Math.ceil(gate.retryAfterMs / 60000));
    throw new LobbyCodeLookupError(
      'resource-exhausted',
      `Too many lobby code lookups. Try again in about ${minutes} min.`,
      gate.retryAfterMs
    );
  }

  const result = await restGetDetailed<LobbyCodeMapping | string>(
    `lobbyCodes/${normalized}`
  );
  if (!result.ok) {
    throw new LobbyCodeLookupError('unavailable', result.error);
  }
  if (result.data == null) {
    return { found: false, mapping: null };
  }
  return { found: true, mapping: result.data };
}

/** Join / preview lookup. Same code only costs one credit per window. */
export async function lookupLobbyCode(
  code: string
): Promise<LobbyCodeLookupResult> {
  return gatedGet(code, { chargeUniqueCode: true });
}

/** Create-time collision check. Each candidate always costs one credit. */
export async function checkLobbyCodeAvailable(
  code: string
): Promise<{ available: boolean }> {
  const result = await gatedGet(code, { chargeUniqueCode: false });
  return { available: !result.found };
}

/** Test helper: clear the persisted bucket. */
export async function resetLobbyCodeLookupRateLimitForTests(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
