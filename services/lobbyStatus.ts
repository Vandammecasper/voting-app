import { formatRestFailure, restPatchDetailed } from '@/services/firebaseRest';

export type LobbyFlowStatus =
  | 'waiting'
  | 'voting'
  | 'results'
  | 'ranking'
  | 'completed';

export async function persistLobbyStatus(
  voteId: string,
  status: LobbyFlowStatus,
  code?: string | null,
  extra?: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const lobbyResult = await restPatchDetailed(`lobbies/${voteId}`, { status });
  if (!lobbyResult.ok) {
    return { ok: false, error: formatRestFailure(lobbyResult) };
  }

  if (code) {
    const codeResult = await restPatchDetailed(`lobbyCodes/${code}`, { status });
    if (!codeResult.ok) {
      console.warn('Failed to update lobby code status', formatRestFailure(codeResult));
    }
  }

  if (extra && Object.keys(extra).length > 0) {
    const extraResult = await restPatchDetailed(`lobbies/${voteId}`, extra);
    if (!extraResult.ok) {
      console.warn('Failed to publish lobby extras', formatRestFailure(extraResult));
    }
  }

  return { ok: true };
}

/** Publish the ranking everyone can open. Prefers `completed`, then `ranking`. */
export async function persistPublishedRanking(
  voteId: string,
  code?: string | null,
  extra?: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const completed = await persistLobbyStatus(voteId, 'completed', code, extra);
  if (completed.ok) {
    return completed;
  }
  return persistLobbyStatus(voteId, 'ranking', code, extra);
}

