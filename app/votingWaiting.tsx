import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { JoinRequestsPanel, JoinRequestsMap } from '@/components/join-requests-panel';
import { ScreenBackButton } from '@/components/screen-back-button';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePolledRestData } from '@/hooks/usePolledRestData';
import { restPatch } from '@/services/firebaseRest';

interface Participant {
  name: string;
  joinedAt: number;
}

interface LobbyData {
  creatorId: string;
  creatorName: string;
  createdAt: number;
  status: string;
  code: string;
}

type ParticipantsData = Record<string, Participant>;
type VoteReceiptsData = Record<string, boolean>;

export default function VotingWaitingScreen() {
  const { voteId, from } = useLocalSearchParams<{ voteId: string; from?: string }>();
  const { user } = useAuth();
  
  // Poll lobby data
  const { data: lobbyData } = usePolledRestData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000
  );
  
  const { data: participantsData } = usePolledRestData<ParticipantsData>(
    voteId ? `participants/${voteId}` : null,
    2000
  );
  
  const { data: receiptsData } = usePolledRestData<VoteReceiptsData>(
    voteId ? `voteReceipts/${voteId}` : null,
    2000
  );

  // Check if current user is the creator
  const isCreator = user && lobbyData && user.uid === lobbyData.creatorId;
  const { data: joinRequests } = usePolledRestData<JoinRequestsMap>(
    isCreator && voteId ? `joinRequests/${voteId}` : null,
    2000
  );

  // Calculate vote counts
  const totalParticipants = participantsData ? Object.keys(participantsData).length : 0;
  const votesSubmitted = receiptsData ? Object.keys(receiptsData).length : 0;
  const votesRemaining = totalParticipants - votesSubmitted;

  // Auto-navigate to results when status changes
  useEffect(() => {
    if (lobbyData?.status === 'results' && voteId) {
      router.replace({
        pathname: '/results',
        params: { voteId, from },
      });
    }
  }, [lobbyData?.status, voteId, from]);

  const handleGoToResults = async () => {
    // Update lobby status to 'results' so all participants navigate
    if (voteId) {
      await restPatch(`lobbies/${voteId}`, { status: 'results' });
      if (lobbyData?.code) {
        await restPatch(`lobbyCodes/${lobbyData.code}`, { status: 'results' });
      }
    }
    
    router.replace({
      pathname: '/results',
      params: { voteId, from },
    });
  };

  const everyoneHasVoted = votesRemaining === 0;

  const handleExit = () => {
    router.replace('/');
  };

  return (
    <ThemedView safeAndroid style={styles.container}>
      {isCreator && voteId ? (
        <View style={styles.joinRequestsWrap}>
          <JoinRequestsPanel
            voteId={voteId}
            code={lobbyData?.code}
            requests={joinRequests}
          />
        </View>
      ) : null}
      {everyoneHasVoted ? (
        <>
          <View style={styles.content}>
            <View style={styles.everyoneVotedContainer}>
              <Text style={styles.everyoneVotedTitle}>Everyone</Text>
              <Text style={styles.everyoneVotedTitle}>has voted!</Text>
              {!isCreator && (
                <Text style={styles.waitingOnHost}>
                  Waiting on the host to read the votes...
                </Text>
              )}
            </View>
          </View>
          {isCreator && (
            <View style={[styles.bottomContainer, styles.bottomContainerButtonOnly]}>
              <PrimaryButton
                onPress={handleGoToResults}
                style={styles.resultsButton}
                textStyle={styles.resultsButtonText}
              >
                Go to results
              </PrimaryButton>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.title}>Your teammates are voting...</Text>

          <View style={styles.content}>
            <View style={styles.countContainer}>
              <Text style={styles.alreadyLabel}>already</Text>
              <GradientText text={String(votesSubmitted)} style={styles.countNumber} />
              <GradientText
                text={votesSubmitted === 1 ? 'vote submitted' : 'votes submitted'}
                style={styles.votesSubmittedLabel}
              />
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <Text style={styles.hint}>
              {`waiting for ${votesRemaining} more ${votesRemaining === 1 ? 'vote' : 'votes'}`}
            </Text>

            {isCreator && (
              <PrimaryButton
                onPress={handleGoToResults}
                style={styles.resultsButton}
                textStyle={styles.resultsButtonText}
              >
                Go to results
              </PrimaryButton>
            )}
          </View>
        </>
      )}
      <ScreenBackButton onPress={handleExit} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  joinRequestsWrap: {
    marginBottom: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#D9D9D9',
    fontFamily: defaultFontFamily,
  },
  countContainer: {
    alignItems: 'center',
  },
  alreadyLabel: {
    color: Colors.icon,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: defaultFontFamily,
  },
  countNumber: {
    fontSize: 104,
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
  votesSubmittedLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
    fontFamily: defaultFontFamily,
  },
  everyoneVotedContainer: {
    alignItems: 'center',
  },
  everyoneVotedTitle: {
    color: Colors.text,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  waitingOnHost: {
    color: Colors.icon,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: defaultFontFamily,
  },
  bottomContainer: {
    paddingBottom: 60,
    gap: 24,
  },
  bottomContainerButtonOnly: {
    marginTop: 24,
  },
  hint: {
    color: Colors.icon,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  resultsButton: {
    marginHorizontal: 0,
  },
  resultsButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
  exitButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 1000,
    padding: 8,
  },
});

