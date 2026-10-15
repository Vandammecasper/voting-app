/** Status labels and sync helpers — safe for Node scripts (no React/CSS imports). */

export const FEATURE_REQUEST_STATUS = {
  pending: 'Request pending',
  received: 'Request received',
  accepted: 'Request Accepted',
  inProgress: 'In Progress',
  readyForDeployment: 'Ready for deployment',
  done: 'Done',
} as const;

export type FeatureRequestBoardStatus =
  (typeof FEATURE_REQUEST_STATUS)[keyof typeof FEATURE_REQUEST_STATUS];

export type FeatureRequestBacklogPhase = 'draft' | 'task';

/** Marker embedded in Backlog draft/task descriptions so sync can re-link after promote. */
export const FEATURE_REQUEST_ID_MARKER = 'featureRequestId:';

export function featureRequestMarker(firebaseRequestId: string): string {
  return `${FEATURE_REQUEST_ID_MARKER} ${firebaseRequestId}`;
}

export function parseFeatureRequestIdFromDescription(description: string): string | null {
  const match = description.match(/featureRequestId:\s*(\S+)/);
  return match?.[1] ?? null;
}

const KNOWN_STATUSES = new Set<string>(Object.values(FEATURE_REQUEST_STATUS));

export function displayBoardStatus(
  boardStatus: string | undefined | null,
): FeatureRequestBoardStatus {
  if (boardStatus && KNOWN_STATUSES.has(boardStatus)) {
    return boardStatus as FeatureRequestBoardStatus;
  }
  return FEATURE_REQUEST_STATUS.pending;
}

/** Board columns that sync may mirror after a draft is promoted. */
export const FEATURE_REQUEST_BOARD_COLUMNS = [
  FEATURE_REQUEST_STATUS.accepted,
  FEATURE_REQUEST_STATUS.inProgress,
  FEATURE_REQUEST_STATUS.readyForDeployment,
  FEATURE_REQUEST_STATUS.done,
] as const;
