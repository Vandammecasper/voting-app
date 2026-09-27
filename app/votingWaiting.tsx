import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ScreenBackButton } from '@/components/screen-back-button';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePolledRestData } from '@/hooks/usePolledRestData';
import { useVoteRouteParams } from '@/hooks/useVoteRouteParams';
import { isPublishedRankingStatus, isResultsStatus } from '@/services/lobbyFlow';
import { persistLobbyStatus } from '@/services/lobbyStatus';
import { scale, useScale } from '@/utils/scale';

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
  const { voteId, from } = useVoteRouteParams();
  const { user } = useAuth();
  const { s } = useScale();
  const [isOpeningResults, setIsOpeningResults] = useState(false);
  
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

  // Calculate vote counts
  const totalParticipants = participantsData ? Object.keys(participantsData).length : 0;
  const votesSubmitted = receiptsData ? Object.keys(receiptsData).length : 0;
  const votesRemaining = totalParticipants - votesSubmitted;

  // Auto-navigate when the host opens results or publishes the ranking
  useEffect(() => {
    if (!lobbyData?.status || !voteId) {
      return;
    }

    if (isResultsStatus(lobbyData.status)) {
      router.replace({
        pathname: '/results',
        params: { voteId, from },
      });
      return;
    }

    if (isPublishedRankingStatus(lobbyData.status)) {
      router.replace({
        pathname: '/ranking',
        params: { voteId, from },
      });
    }
  }, [lobbyData?.status, voteId, from]);

  const handleGoToResults = async () => {
    if (!voteId || isOpeningResults) {
      return;
    }

    setIsOpeningResults(true);
    const persisted = await persistLobbyStatus(voteId, 'results', lobbyData?.code);
    if (!persisted.ok) {
      Alert.alert("Couldn't open results", persisted.error);
      setIsOpeningResults(false);
      return;
    }

    router.replace({
      pathname: '/results',
      params: { voteId, from },
    });
  };

  const everyoneHasVoted = totalParticipants > 0 && votesRemaining === 0;

  const handleExit = () => {
    router.replace('/(tabs)');
  };

  return (
    <ThemedView safeAndroid style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingTop: s(100), paddingHorizontal: s(24) }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
      {everyoneHasVoted ? (
        <>
          <View style={styles.content}>
            <View style={styles.everyoneVotedContainer}>
              <Text style={[styles.everyoneVotedTitle, { fontSize: s(36) }]}>Everyone</Text>
              <Text style={[styles.everyoneVotedTitle, { fontSize: s(36) }]}>has voted!</Text>
              {!isCreator && (
                <Text style={[styles.waitingOnHost, { fontSize: s(16), marginTop: s(24) }]}>
                  Waiting on the host to read the votes...
                </Text>
              )}
            </View>
          </View>
          {isCreator && (
            <View style={[styles.bottomContainer, styles.bottomContainerButtonOnly, { paddingBottom: s(60), gap: s(24) }]}>
              <PrimaryButton
                onPress={handleGoToResults}
                disabled={isOpeningResults}
                style={styles.resultsButton}
                textStyle={[styles.resultsButtonText, { fontSize: s(20) }]}
              >
                Go to results
              </PrimaryButton>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={[styles.title, { fontSize: s(32) }]}>Your teammates are voting...</Text>

          <View style={styles.content}>
            <View style={styles.countContainer}>
              <Text style={[styles.alreadyLabel, { fontSize: s(18), marginBottom: s(12) }]}>already</Text>
              <GradientText text={String(votesSubmitted)} style={[styles.countNumber, { fontSize: s(104) }]} />
              <GradientText
                text={votesSubmitted === 1 ? 'vote submitted' : 'votes submitted'}
                style={[styles.votesSubmittedLabel, { fontSize: s(20), marginTop: s(8) }]}
              />
            </View>
          </View>

          <View style={[styles.bottomContainer, { paddingBottom: s(60), gap: s(24) }]}>
            <Text style={[styles.hint, { fontSize: s(14) }]}>
              {`waiting for ${votesRemaining} more ${votesRemaining === 1 ? 'vote' : 'votes'}`}
            </Text>

            {isCreator && (
              <PrimaryButton
                onPress={handleGoToResults}
                disabled={isOpeningResults}
                style={styles.resultsButton}
                textStyle={[styles.resultsButtonText, { fontSize: s(20) }]}
              >
                Go to results
              </PrimaryButton>
            )}
          </View>
        </>
      )}
      </ScrollView>
      <ScreenBackButton variant="exit" onPress={handleExit} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: scale(160),
  },
  title: {
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
    fontWeight: '500',
    fontFamily: defaultFontFamily,
  },
  countNumber: {
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
  votesSubmittedLabel: {
    fontWeight: '600',
    fontFamily: defaultFontFamily,
  },
  everyoneVotedContainer: {
    alignItems: 'center',
  },
  everyoneVotedTitle: {
    color: Colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  waitingOnHost: {
    color: Colors.icon,
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  bottomContainer: {},
  bottomContainerButtonOnly: {
    marginTop: 24,
  },
  hint: {
    color: Colors.icon,
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  resultsButton: {
    marginHorizontal: 0,
  },
  resultsButtonText: {
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
});
