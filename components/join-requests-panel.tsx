import { Alert } from 'react-native';
import { useEffect, useRef } from 'react';

import { restPatch, restPut } from '@/services/firebaseRest';
import { claimedNameSlotPath } from '@/services/teams';

export interface JoinRequest {
  name: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'denied';
  code: string;
}

export type JoinRequestsMap = Record<string, JoinRequest>;

export function pendingJoinRequests(
  requests: JoinRequestsMap | null | undefined
): [string, JoinRequest][] {
  if (!requests) {
    return [];
  }
  return Object.entries(requests).filter(([, request]) => request?.status === 'pending' && request.name);
}

interface JoinRequestsHostProps {
  voteId: string;
  code?: string;
  requests: JoinRequestsMap | null;
}

async function admitJoiner(voteId: string, code: string | undefined, userId: string, request: JoinRequest) {
  const added = await restPut(`participants/${voteId}/${userId}`, {
    name: request.name.trim(),
    joinedAt: Date.now(),
  });
  if (!added) {
    Alert.alert('Could not admit', 'Please try again.');
    return;
  }
  if (code) {
    await restPut(claimedNameSlotPath(code, request.name), request.name.trim());
  }
  const updated = await restPatch(`joinRequests/${voteId}/${userId}`, { status: 'approved' });
  if (!updated) {
    Alert.alert('Could not admit', 'The player was added but the request could not be updated.');
  }
}

async function declineJoiner(voteId: string, userId: string) {
  const updated = await restPatch(`joinRequests/${voteId}/${userId}`, { status: 'denied' });
  if (!updated) {
    Alert.alert('Could not decline', 'Please try again.');
  }
}

/** Shows one native system alert per pending join request. */
export function JoinRequestsHost({ voteId, code, requests }: JoinRequestsHostProps) {
  const busyRef = useRef(false);
  const pending = pendingJoinRequests(requests);
  const nextPending = pending[0];
  const nextKey = nextPending ? `${nextPending[0]}:${nextPending[1].requestedAt}` : '';

  useEffect(() => {
    if (!nextKey || busyRef.current) {
      return;
    }

    const current = pendingJoinRequests(requests)[0];
    if (!current) {
      return;
    }

    const [userId, request] = current;
    busyRef.current = true;

    Alert.alert(
      'Join request',
      `${request.name} wants to join this vote.`,
      [
        {
          text: 'Decline',
          style: 'cancel',
          onPress: () => {
            void declineJoiner(voteId, userId).finally(() => {
              busyRef.current = false;
            });
          },
        },
        {
          text: 'Admit',
          onPress: () => {
            void admitJoiner(voteId, code, userId, request).finally(() => {
              busyRef.current = false;
            });
          },
        },
      ],
      { cancelable: false }
    );
  }, [nextKey, voteId, code]);

  return null;
}

/** @deprecated Use JoinRequestsHost; kept so existing imports keep type-checking during edits. */
export const JoinRequestsPanel = JoinRequestsHost;
