/** User-facing / mirrored statuses for in-app feature requests. */

import { Colors } from '@/constants/theme';

import {
  displayBoardStatus,
  FEATURE_REQUEST_STATUS,
  type FeatureRequestBoardStatus,
} from '@/services/feature-request-status-core';

export {
  displayBoardStatus,
  FEATURE_REQUEST_BOARD_COLUMNS,
  FEATURE_REQUEST_ID_MARKER,
  FEATURE_REQUEST_STATUS,
  featureRequestMarker,
  parseFeatureRequestIdFromDescription,
  type FeatureRequestBacklogPhase,
  type FeatureRequestBoardStatus,
} from '@/services/feature-request-status-core';

/** Soft badge colors tuned for the app's dark UI. */
export type FeatureRequestStatusBadgeColors = {
  background: string;
  border: string;
  text: string;
};

const STATUS_BADGE_COLORS: Record<FeatureRequestBoardStatus, FeatureRequestStatusBadgeColors> = {
  [FEATURE_REQUEST_STATUS.pending]: {
    background: '#3A3A3A',
    border: '#555555',
    text: '#9BA1A6',
  },
  [FEATURE_REQUEST_STATUS.received]: {
    background: '#2A3A4A',
    border: '#3D5A73',
    text: '#9BB8D4',
  },
  [FEATURE_REQUEST_STATUS.accepted]: {
    background: '#352A45',
    border: '#5A4573',
    text: '#C4B0E0',
  },
  [FEATURE_REQUEST_STATUS.inProgress]: {
    background: '#3F3420',
    border: '#6B5528',
    text: '#E0C48A',
  },
  [FEATURE_REQUEST_STATUS.readyForDeployment]: {
    background: '#1F3A36',
    border: '#2F5C54',
    text: '#8FD4C8',
  },
  [FEATURE_REQUEST_STATUS.done]: {
    background: '#2A3A2A',
    border: '#3D5A3D',
    text: Colors.tint,
  },
};

export function statusBadgeColors(
  boardStatus: string | undefined | null,
): FeatureRequestStatusBadgeColors {
  return STATUS_BADGE_COLORS[displayBoardStatus(boardStatus)];
}
