import { Alert, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { restPatch, restPut } from '@/services/firebaseRest';

export interface JoinRequest {
  name: string;
  requestedAt: number;
  status: 'pending' | 'approved' | 'denied';
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

interface JoinRequestsPanelProps {
  voteId: string;
  code?: string;
  requests: JoinRequestsMap | null;
}

export function JoinRequestsPanel({ voteId, code, requests }: JoinRequestsPanelProps) {
  const pending = pendingJoinRequests(requests);
  if (pending.length === 0) {
    return null;
  }

  const handleAdmit = async (userId: string, request: JoinRequest) => {
    const added = await restPut(`participants/${voteId}/${userId}`, {
      name: request.name.trim(),
      joinedAt: Date.now(),
    });
    if (!added) {
      Alert.alert('Could not admit', 'Please try again.');
      return;
    }
    if (code) {
      await restPut(`lobbyCodes/${code}/claimedNames/${userId}`, request.name.trim());
    }
    const updated = await restPatch(`joinRequests/${voteId}/${userId}`, { status: 'approved' });
    if (!updated) {
      Alert.alert('Could not admit', 'The player was added but the request could not be updated.');
    }
  };

  const handleDecline = async (userId: string) => {
    const updated = await restPatch(`joinRequests/${voteId}/${userId}`, { status: 'denied' });
    if (!updated) {
      Alert.alert('Could not decline', 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {pending.length === 1 ? 'Someone wants to join' : `${pending.length} people want to join`}
      </Text>
      {pending.map(([userId, request]) => (
        <View key={userId} style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>
            {request.name}
          </Text>
          <View style={styles.actions}>
            <SecondaryButton
              onPress={() => handleDecline(userId)}
              style={styles.actionButton}
              textStyle={styles.actionText}
            >
              Decline
            </SecondaryButton>
            <PrimaryButton
              onPress={() => handleAdmit(userId, request)}
              style={styles.actionButton}
              textStyle={styles.actionText}
            >
              Admit
            </PrimaryButton>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  row: {
    gap: 10,
  },
  name: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: defaultFontFamily,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: defaultFontFamily,
  },
});
