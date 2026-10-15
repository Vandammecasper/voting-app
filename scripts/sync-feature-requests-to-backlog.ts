/**
 * Links Firebase feature requests to Backlog.md drafts/tasks and mirrors status.
 *
 * - Pending / unlinked requests → create a Backlog draft (off board), then set
 *   boardStatus to "Request received" with backlogId via Admin SDK.
 * - Linked drafts/tasks → mirror Backlog board status after promote/progress.
 *
 * Requires a Firebase service account (Admin) and the backlog CLI on PATH.
 *
 *   npm run sync:feature-requests
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  FEATURE_REQUEST_BOARD_COLUMNS,
  FEATURE_REQUEST_STATUS,
  featureRequestMarker,
  parseFeatureRequestIdFromDescription,
} from '../services/feature-request-status-core';

function loadDotEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = value;
    }
  } catch {
    // .env optional when variables are already set.
  }
}

loadDotEnv();

type RawRequest = {
  title?: string;
  description?: string;
  userName?: string;
  backlogId?: string;
  backlogPhase?: 'draft' | 'task';
  boardStatus?: string;
};

type BacklogItem = {
  id: string;
  description: string;
  status?: string;
  kind: 'draft' | 'task';
};

function backlogCliPath(): string {
  // Invoke the Node entrypoint directly so multi-word titles/descriptions
  // stay as single argv entries (Windows shell splitting breaks `backlog.cmd`).
  const fromRoaming = join(
    process.env.APPDATA ?? '',
    'npm',
    'node_modules',
    'backlog.md',
    'cli.js',
  );
  if (existsSync(fromRoaming)) return fromRoaming;
  const fromLocal = resolve(
    process.cwd(),
    'node_modules',
    'backlog.md',
    'cli.js',
  );
  if (existsSync(fromLocal)) return fromLocal;
  throw new Error('Could not find backlog.md/cli.js. Is backlog.md installed globally or locally?');
}

function runBacklog(args: string[]): string {
  return execFileSync(process.execPath, [backlogCliPath(), ...args], {
    encoding: 'utf8',
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function parseCreatedDraftId(output: string): string | null {
  const match = output.match(/Created draft\s+(DRAFT-\d+)/i);
  return match?.[1] ?? null;
}

function readSection(markdown: string, heading: string): string {
  const pattern = new RegExp(
    `## ${heading}\\s*\\r?\\n+<!-- SECTION:[A-Z_]+:BEGIN -->\\r?\\n([\\s\\S]*?)\\r?\\n<!-- SECTION:[A-Z_]+:END -->`,
    'i',
  );
  const match = markdown.match(pattern);
  return match?.[1]?.trim() ?? '';
}

function readFrontMatterField(markdown: string, field: string): string | null {
  const match = markdown.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function loadBacklogItemsFromDir(dir: string, kind: 'draft' | 'task'): BacklogItem[] {
  if (!existsSync(dir)) return [];
  const items: BacklogItem[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const markdown = readFileSync(join(dir, name), 'utf8');
    const id = readFrontMatterField(markdown, 'id');
    if (!id) continue;
    items.push({
      id,
      description: readSection(markdown, 'Description'),
      status: kind === 'task' ? readFrontMatterField(markdown, 'status') ?? undefined : undefined,
      kind,
    });
  }
  return items;
}

function loadAllBacklogItems(): BacklogItem[] {
  const root = resolve(process.cwd(), 'backlog');
  return [
    ...loadBacklogItemsFromDir(join(root, 'drafts'), 'draft'),
    ...loadBacklogItemsFromDir(join(root, 'tasks'), 'task'),
    ...loadBacklogItemsFromDir(join(root, 'completed'), 'task'),
  ];
}

function findLinkedItem(
  items: BacklogItem[],
  firebaseId: string,
  knownBacklogId?: string,
): BacklogItem | undefined {
  if (knownBacklogId) {
    const exact = items.find((item) => item.id.toLowerCase() === knownBacklogId.toLowerCase());
    if (exact) return exact;
  }
  return items.find((item) => parseFeatureRequestIdFromDescription(item.description) === firebaseId);
}

function loadServiceAccount(): object {
  const jsonInline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonInline) {
    return JSON.parse(jsonInline) as object;
  }
  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? resolve(process.cwd(), 'service-account.json');
  if (!existsSync(path)) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON (see .env.example).',
    );
  }
  return JSON.parse(readFileSync(path, 'utf8')) as object;
}

function mirrorStatus(item: BacklogItem): string {
  if (item.kind === 'draft') return FEATURE_REQUEST_STATUS.received;
  if (
    item.status &&
    (FEATURE_REQUEST_BOARD_COLUMNS as readonly string[]).includes(item.status)
  ) {
    return item.status;
  }
  return FEATURE_REQUEST_STATUS.accepted;
}

async function main() {
  const databaseURL = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
  if (!databaseURL) {
    throw new Error('EXPO_PUBLIC_FIREBASE_DATABASE_URL is required.');
  }

  const { cert, getApps, initializeApp } = await import('firebase-admin/app');
  const { getDatabase } = await import('firebase-admin/database');
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(loadServiceAccount() as Parameters<typeof cert>[0]),
      databaseURL,
    });
  }

  const db = getDatabase();
  const snapshot = await db.ref('featureRequests').get();
  const value = (snapshot.val() as Record<string, RawRequest> | null) ?? {};
  let backlogItems = loadAllBacklogItems();

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const [requestId, raw] of Object.entries(value)) {
    const title = (raw.title ?? '').trim() || 'Untitled request';
    const description = (raw.description ?? '').trim();
    let linked = findLinkedItem(backlogItems, requestId, raw.backlogId);

    if (!linked) {
      // Prefer marker match after promote (draft id becomes a task id).
      linked = findLinkedItem(backlogItems, requestId);
    }

    if (!linked) {
      if (raw.backlogId) {
        console.warn(
          `[sync] Request ${requestId} references ${raw.backlogId}, but no draft/task with that id or featureRequestId marker was found.`,
        );
        unchanged += 1;
        continue;
      }

      const body = [
        description,
        '',
        featureRequestMarker(requestId),
        raw.userName ? `Submitted by: ${raw.userName}` : null,
      ]
        .filter((line) => line != null && line !== '')
        .join('\n');

      const output = runBacklog(['draft', 'create', title, '--description', body, '--plain']);
      const draftId = parseCreatedDraftId(output);
      if (!draftId) {
        console.warn(`[sync] Draft create did not return an id for ${requestId}:\n${output}`);
        unchanged += 1;
        continue;
      }

      await db.ref(`featureRequests/${requestId}`).update({
        backlogId: draftId,
        backlogPhase: 'draft',
        boardStatus: FEATURE_REQUEST_STATUS.received,
      });
      console.log(`[sync] Created ${draftId} for feature request ${requestId}`);
      created += 1;
      backlogItems = loadAllBacklogItems();
      continue;
    }

    const nextPhase = linked.kind;
    const nextStatus = mirrorStatus(linked);
    const needsUpdate =
      raw.backlogId !== linked.id ||
      raw.backlogPhase !== nextPhase ||
      raw.boardStatus !== nextStatus;

    if (!needsUpdate) {
      unchanged += 1;
      continue;
    }

    await db.ref(`featureRequests/${requestId}`).update({
      backlogId: linked.id,
      backlogPhase: nextPhase,
      boardStatus: nextStatus,
    });
    console.log(
      `[sync] Updated ${requestId} → ${linked.id} (${nextPhase}) status="${nextStatus}"`,
    );
    updated += 1;
  }

  console.log(`[sync] Done. created=${created} updated=${updated} unchanged=${unchanged}`);
}

main().catch((error) => {
  console.error('[sync] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
