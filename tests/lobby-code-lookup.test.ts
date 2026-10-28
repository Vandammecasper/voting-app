const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: (...args: unknown[]) => mockSetItem(...args),
  removeItem: (...args: unknown[]) => mockRemoveItem(...args),
}));

jest.mock('@/services/firebaseRest', () => ({
  restGetDetailed: jest.fn(),
}));

import { restGetDetailed } from '@/services/firebaseRest';
import {
  checkLobbyCodeAvailable,
  consumeLobbyCodeLookup,
  isRateLimitedLookupError,
  LOBBY_CODE_LOOKUP_MAX_ATTEMPTS,
  LobbyCodeLookupError,
  lookupLobbyCode,
  resetLobbyCodeLookupRateLimitForTests,
} from '@/services/lobbyCodeLookup';

describe('lobby code client rate limit', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockImplementation(async (_key: string, value: string) => {
      mockGetItem.mockResolvedValue(value);
    });
    mockRemoveItem.mockImplementation(async () => {
      mockGetItem.mockResolvedValue(null);
    });
    (restGetDetailed as jest.Mock).mockResolvedValue({ ok: true, data: null });
    await resetLobbyCodeLookupRateLimitForTests();
  });

  it('allows the first lookups and blocks after the max', async () => {
    for (let i = 0; i < LOBBY_CODE_LOOKUP_MAX_ATTEMPTS; i += 1) {
      await expect(consumeLobbyCodeLookup()).resolves.toEqual({ ok: true });
    }
    const blocked = await consumeLobbyCodeLookup();
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('charges a join preview code only once per window', async () => {
    (restGetDetailed as jest.Mock).mockResolvedValue({
      ok: true,
      data: { lobbyId: 'L1', status: 'waiting' },
    });

    await expect(lookupLobbyCode('ABCD2345')).resolves.toEqual({
      found: true,
      mapping: { lobbyId: 'L1', status: 'waiting' },
    });
    await expect(lookupLobbyCode('ABCD2345')).resolves.toEqual({
      found: true,
      mapping: { lobbyId: 'L1', status: 'waiting' },
    });

    expect(restGetDetailed).toHaveBeenCalledTimes(2);
    // Only one credit consumed for the repeated code.
    for (let i = 0; i < LOBBY_CODE_LOOKUP_MAX_ATTEMPTS - 1; i += 1) {
      await expect(consumeLobbyCodeLookup()).resolves.toEqual({ ok: true });
    }
    await expect(consumeLobbyCodeLookup()).resolves.toMatchObject({ ok: false });
  });

  it('always charges create collision checks', async () => {
    await expect(checkLobbyCodeAvailable('ABCD2345')).resolves.toEqual({
      available: true,
    });
    await expect(checkLobbyCodeAvailable('ABCD2345')).resolves.toEqual({
      available: true,
    });
    expect(restGetDetailed).toHaveBeenCalledTimes(2);
  });

  it('detects resource-exhausted rate limit errors', () => {
    expect(
      isRateLimitedLookupError(
        new LobbyCodeLookupError(
          'resource-exhausted',
          'Too many lobby code lookups. Try again in about 10 min.'
        )
      )
    ).toBe(true);
    expect(
      isRateLimitedLookupError(new LobbyCodeLookupError('not-found', 'Missing'))
    ).toBe(false);
  });
});
