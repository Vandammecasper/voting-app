import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ScreenBackButton } from '@/components/screen-back-button';
import { SwipePager } from '@/components/swipe-pager';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePolledRestData } from '@/hooks/usePolledRestData';
import { useVoteRouteParams } from '@/hooks/useVoteRouteParams';
import { restGet } from '@/services/firebaseRest';
import { isPublishedRankingStatus } from '@/services/lobbyFlow';
import { persistPublishedRanking } from '@/services/lobbyStatus';
import { calculateRankings, rankingListToMap } from '@/services/voteRankings';
import { scale } from '@/utils/scale';

interface LobbyData {
  creatorId: string;
  creatorName: string;
  createdAt: number;
  status: string;
  code: string;
}

interface VoteData {
  mvpName: string;
  mvpComment: string;
  loserName?: string;
  loserComment?: string;
  submittedAt: number;
}

type VotesData = Record<string, VoteData>;

type ShuffledVote = VoteData & { id: string };

/** Shuffle copy of array (Fisher–Yates) so reveal order is not submission order. */
function shuffleCopy<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Keep an existing reveal order stable; only shuffle newly arrived vote ids. */
function buildStableShuffledOrder(voteIds: string[], previousOrder: string[]): string[] {
  if (previousOrder.length === 0) {
    return shuffleCopy(voteIds);
  }

  const currentIds = new Set(voteIds);
  const kept = previousOrder.filter((id) => currentIds.has(id));
  const known = new Set(kept);
  const newcomers = shuffleCopy(voteIds.filter((id) => !known.has(id)));
  return [...kept, ...newcomers];
}

export default function ResultsScreen() {
  const { voteId, from } = useVoteRouteParams();
  const { user } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = windowWidth - 48;
  
  const [votesData, setVotesData] = useState<VotesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVoteIndex, setCurrentVoteIndex] = useState(0);
  const [isPublishingRanking, setIsPublishingRanking] = useState(false);
  const shuffleOrderRef = useRef<string[]>([]);
  const shuffleVoteIdRef = useRef<string | null>(null);

  // Poll lobby data to detect status changes
  const { data: lobbyData, isLoading: lobbyLoading } = usePolledRestData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000
  );
  const creatorId = lobbyData?.creatorId;
  const isCreator = Boolean(user && creatorId && user.uid === creatorId);

  // Fetch votes once the creator is known — do not re-fetch on every lobby poll
  useEffect(() => {
    async function fetchData() {
      if (!voteId || !user || !creatorId) return;
      if (user.uid !== creatorId) {
        setVotesData(null);
        setIsLoading(false);
        return;
      }

      const votes = await restGet<VotesData>(`votes/${voteId}`);
      setVotesData(votes);
      setIsLoading(false);
    }

    fetchData();
  }, [voteId, user, creatorId]);

  // Auto-navigate to ranking when the host publishes it
  useEffect(() => {
    if (isPublishedRankingStatus(lobbyData?.status) && voteId) {
      router.replace({
        pathname: '/ranking',
        params: { voteId, from },
      });
    }
  }, [lobbyData?.status, voteId, from]);

  // Convert votes to array in a stable random order (not submission order) for reading aloud
  const votesArray = useMemo((): ShuffledVote[] => {
    if (!votesData) return [];

    if (shuffleVoteIdRef.current !== voteId) {
      shuffleVoteIdRef.current = voteId ?? null;
      shuffleOrderRef.current = [];
    }

    const voteIds = Object.keys(votesData);
    shuffleOrderRef.current = buildStableShuffledOrder(voteIds, shuffleOrderRef.current);

    return shuffleOrderRef.current.flatMap((id) => {
      const vote = votesData[id];
      return vote ? [{ id, ...vote }] : [];
    });
  }, [votesData, voteId]);

  const totalVotes = votesArray.length;
  const hasPreviousVote = currentVoteIndex > 0;
  const hasNextVote = currentVoteIndex < totalVotes - 1;

  const handlePreviousVote = () => {
    if (hasPreviousVote) {
      setCurrentVoteIndex(currentVoteIndex - 1);
    }
  };

  const handleNextVote = () => {
    if (hasNextVote) {
      setCurrentVoteIndex(currentVoteIndex + 1);
    }
  };

  const handleGoToRanking = async () => {
    if (!voteId || isPublishingRanking) {
      return;
    }

    setIsPublishingRanking(true);
    const rankings = calculateRankings(votesData);
    const extra: Record<string, unknown> = {};
    if (rankings.mvpRanking.length > 0) {
      extra.mvpRanking = rankingListToMap(rankings.mvpRanking);
    }
    if (rankings.loserRanking.length > 0) {
      extra.loserRanking = rankingListToMap(rankings.loserRanking);
    }

    const persisted = await persistPublishedRanking(
      voteId,
      lobbyData?.code,
      extra
    );
    if (!persisted.ok) {
      Alert.alert("Couldn't publish ranking", persisted.error);
      setIsPublishingRanking(false);
      return;
    }

    router.replace({
      pathname: '/ranking',
      params: { voteId, from },
    });
  };

  if (lobbyLoading && !lobbyData) {
    return (
      <ThemedView safeAndroid style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </ThemedView>
    );
  }

  if (isLoading && isCreator) {
    return (
      <ThemedView safeAndroid style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </ThemedView>
    );
  }

  // Non-creator view - simple waiting message
  if (!isCreator) {
    return (
      <ThemedView safeAndroid style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="megaphone-outline" size={64} color={Colors.icon} />
          <GradientText 
            text="Reading the votes" 
            style={styles.waitingTitle}
          />
          <Text style={styles.waitingSubtitle}>
            The host is reading the votes to the group. You will see the ranking as soon as they finish.
          </Text>
        </View>
        <ScreenBackButton variant="exit" onPress={() => router.replace('/(tabs)')} />
      </ThemedView>
    );
  }

  const handleExit = () => {
    router.replace('/(tabs)');
  };

  // Creator view - show individual votes
  return (
    <ThemedView safeAndroid style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        
        <GradientText 
          text="MVP" 
          style={styles.mvpTitle}
        />
        
        <Text style={styles.pageTitle}>Voting results</Text>

        <Text style={styles.voteCounter}>
          Vote {currentVoteIndex + 1} of {totalVotes}
        </Text>

        {votesArray.length > 0 ? (
          <SwipePager
            index={currentVoteIndex}
            onIndexChange={setCurrentVoteIndex}
            pageWidth={pageWidth}
          >
            {votesArray.map((vote) => (
              <View key={vote.id} style={styles.resultsCard}>
                <View style={styles.resultSection}>
                  <Text style={styles.resultLabel}>MVP: {vote.mvpName.toUpperCase()}</Text>
                  <Text style={styles.resultComment}>{vote.mvpComment}</Text>
                </View>
                {vote.loserName && vote.loserComment && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.resultSection}>
                      <Text style={styles.resultLabel}>Loser: {vote.loserName.toUpperCase()}</Text>
                      <Text style={styles.resultComment}>{vote.loserComment}</Text>
                    </View>
                  </>
                )}
              </View>
            ))}
          </SwipePager>
        ) : (
          <View style={styles.resultsCard}>
            <Text style={styles.noVotesText}>No votes submitted yet</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <SecondaryButton
            onPress={handlePreviousVote}
            disabled={!hasPreviousVote}
            style={styles.secondaryBtn}
            textStyle={styles.buttonText}
          >
            Previous vote
          </SecondaryButton>
          
          {hasNextVote ? (
            <PrimaryButton
              onPress={handleNextVote}
              style={styles.primaryBtn}
              textStyle={styles.buttonText}
            >
              Next vote
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onPress={handleGoToRanking}
              disabled={isPublishingRanking}
              style={styles.primaryBtn}
              textStyle={styles.buttonText}
            >
              Go to ranking
            </PrimaryButton>
          )}
        </View>
      </ScrollView>
      <ScreenBackButton variant="exit" onPress={handleExit} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(24),
    paddingTop: scale(60),
    paddingBottom: scale(40),
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  loadingText: {
    color: Colors.text,
    fontSize: scale(18),
    fontFamily: defaultFontFamily,
  },
  // Non-creator waiting view
  waitingTitle: {
    fontSize: scale(28),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: scale(24),
    fontFamily: defaultFontFamily,
  },
  waitingSubtitle: {
    color: Colors.icon,
    fontSize: scale(16),
    textAlign: 'center',
    marginTop: scale(12),
    lineHeight: scale(22),
    fontFamily: defaultFontFamily,
  },
  // Creator results view
  crownContainer: {
    alignItems: 'center',
    marginBottom: scale(8),
  },
  crownCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    borderWidth: 2,
    borderColor: '#90FF91',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mvpTitle: {
    fontSize: scale(48),
    fontWeight: 'bold',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: defaultFontFamily,
    letterSpacing: -1,
    lineHeight: scale(54),
  },
  pageTitle: {
    color: Colors.text,
    fontSize: scale(20),
    textAlign: 'center',
    marginTop: scale(4),
    marginBottom: scale(16),
    fontFamily: defaultFontFamily,
  },
  voteCounter: {
    color: Colors.icon,
    fontSize: scale(14),
    textAlign: 'center',
    marginBottom: scale(24),
    fontFamily: defaultFontFamily,
  },
  resultsCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: scale(20),
    marginBottom: scale(32),
  },
  resultSection: {
    paddingVertical: scale(8),
  },
  resultLabel: {
    color: '#1a1a1a',
    fontSize: scale(18),
    fontWeight: 'bold',
    marginBottom: scale(8),
    fontFamily: defaultFontFamily,
  },
  resultComment: {
    color: '#3a3a3a',
    fontSize: scale(14),
    lineHeight: scale(20),
    fontFamily: defaultFontFamily,
  },
  noVotesText: {
    color: '#3a3a3a',
    fontSize: scale(16),
    textAlign: 'center',
    paddingVertical: scale(20),
    fontFamily: defaultFontFamily,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginVertical: scale(16),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  secondaryBtn: {
    flex: 1,
  },
  primaryBtn: {
    flex: 1,
  },
  buttonText: {
    fontSize: scale(14),
    fontWeight: '600',
    fontFamily: defaultFontFamily,
  },
  exitButton: {
    position: 'absolute',
    top: scale(60),
    right: scale(24),
    zIndex: 1000,
    padding: 8,
  },
});
