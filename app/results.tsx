import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ScreenBackButton } from '@/components/screen-back-button';
import { SwipePager } from '@/components/swipe-pager';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePolledRestData } from '@/hooks/usePolledRestData';
import { restGet, restPatch } from '@/services/firebaseRest';
import { calculateRankings } from '@/services/voteRankings';

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

/** Shuffle copy of array (Fisher–Yates) so reveal order is not submission order. */
function shuffleInPlace<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ResultsScreen() {
  const { voteId, from } = useLocalSearchParams<{ voteId: string; from?: string }>();
  const { user } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = windowWidth - 48;
  
  const [votesData, setVotesData] = useState<VotesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVoteIndex, setCurrentVoteIndex] = useState(0);

  // Poll lobby data to detect status changes
  const { data: lobbyData, isLoading: lobbyLoading } = usePolledRestData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000
  );
  const isCreator = Boolean(user && lobbyData && user.uid === lobbyData.creatorId);

  useEffect(() => {
    async function fetchData() {
      if (!voteId || !lobbyData || !user) return;
      if (user.uid !== lobbyData.creatorId) {
        setVotesData(null);
        setIsLoading(false);
        return;
      }

      const votes = await restGet<VotesData>(`votes/${voteId}`);
      setVotesData(votes);
      setIsLoading(false);
    }

    fetchData();
  }, [voteId, user, lobbyData]);

  // Auto-navigate to ranking when status changes
  useEffect(() => {
    if (lobbyData?.status === 'ranking' && voteId) {
      router.replace({
        pathname: '/ranking',
        params: { voteId, from },
      });
    }
  }, [lobbyData?.status, voteId, from]);

  // Convert votes to array in random order (not submission order) for reading aloud
  const votesArray = useMemo(() => {
    if (!votesData) return [];
    return shuffleInPlace(Object.values(votesData));
  }, [votesData]);

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
    if (voteId) {
      const rankings = calculateRankings(votesData);
      const lobbyUpdate: Record<string, unknown> = { status: 'ranking' };
      if (rankings.mvpRanking.length > 0) {
        lobbyUpdate.mvpRanking = rankings.mvpRanking;
      }
      if (rankings.loserRanking.length > 0) {
        lobbyUpdate.loserRanking = rankings.loserRanking;
      }
      await restPatch(`lobbies/${voteId}`, lobbyUpdate);
      if (lobbyData?.code) {
        await restPatch(`lobbyCodes/${lobbyData.code}`, { status: 'ranking' });
      }
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
            The host is reading the voting results to the group. You can go back if you need to leave.
          </Text>
        </View>
        <ScreenBackButton onPress={() => router.replace('/')} />
      </ThemedView>
    );
  }

  const handleExit = () => {
    router.replace('/');
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
            {votesArray.map((vote, voteIndex) => (
              <View key={voteIndex} style={styles.resultsCard}>
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
              style={styles.primaryBtn}
              textStyle={styles.buttonText}
            >
              Go to ranking
            </PrimaryButton>
          )}
        </View>
      </ScrollView>
      <ScreenBackButton onPress={handleExit} />
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: defaultFontFamily,
  },
  // Non-creator waiting view
  waitingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
    fontFamily: defaultFontFamily,
  },
  waitingSubtitle: {
    color: Colors.icon,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontFamily: defaultFontFamily,
  },
  // Creator results view
  crownContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  crownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#90FF91',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mvpTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: defaultFontFamily,
    letterSpacing: -1,
    lineHeight: 54,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: 20,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    fontFamily: defaultFontFamily,
  },
  voteCounter: {
    color: Colors.icon,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: defaultFontFamily,
  },
  resultsCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  resultSection: {
    paddingVertical: 8,
  },
  resultLabel: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: defaultFontFamily,
  },
  resultComment: {
    color: '#3a3a3a',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: defaultFontFamily,
  },
  noVotesText: {
    color: '#3a3a3a',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
    fontFamily: defaultFontFamily,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
  },
  primaryBtn: {
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
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
