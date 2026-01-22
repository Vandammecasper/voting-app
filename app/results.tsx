import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL;

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
  loserName: string;
  loserComment: string;
  submittedAt: number;
}

type VotesData = Record<string, VoteData>;

// Helper to read data using REST API
async function readViaRest<T>(path: string): Promise<T | null> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return null;
    }
    
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    return null;
  }
}

// Helper to update data using REST API (PATCH)
async function updateViaRest<T extends Record<string, unknown>>(path: string, data: T): Promise<boolean> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return false;
    }
    
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Hook to poll data using REST API
function usePolledData<T>(path: string | null, intervalMs: number = 2000) {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      const result = await readViaRest<T>(path);
      if (isMounted) {
        setData(result);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [path, intervalMs]);

  return data;
}

export default function ResultsScreen() {
  const { voteId, from } = useLocalSearchParams<{ voteId: string; from?: string }>();
  const { user } = useAuth();
  
  const [votesData, setVotesData] = useState<VotesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVoteIndex, setCurrentVoteIndex] = useState(0);

  // Poll lobby data to detect status changes
  const lobbyData = usePolledData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000
  );

  // Fetch votes data on mount
  useEffect(() => {
    async function fetchData() {
      if (!voteId) return;
      
      const votes = await readViaRest<VotesData>(`votes/${voteId}`);
      setVotesData(votes);
      setIsLoading(false);
    }
    
    fetchData();
  }, [voteId]);

  // Auto-navigate to ranking when status changes
  useEffect(() => {
    if (lobbyData?.status === 'ranking' && voteId) {
      router.replace({
        pathname: '/ranking',
        params: { voteId, from },
      });
    }
  }, [lobbyData?.status, voteId, from]);

  // Convert votes object to sorted array
  const votesArray = useMemo(() => {
    if (!votesData) return [];
    return Object.values(votesData).sort((a, b) => a.submittedAt - b.submittedAt);
  }, [votesData]);

  const isCreator = user && lobbyData && user.uid === lobbyData.creatorId;
  const currentVote = votesArray[currentVoteIndex];
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
    // Update lobby status to 'ranking' so all participants navigate
    if (voteId) {
      await updateViaRest(`lobbies/${voteId}`, { status: 'ranking' });
    }
    
    router.replace({
      pathname: '/ranking',
      params: { voteId, from },
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </ThemedView>
    );
  }

  // Non-creator view - simple waiting message
  if (!isCreator) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="megaphone-outline" size={64} color={Colors.icon} />
          <GradientText 
            text="Reading the votes" 
            style={styles.waitingTitle}
          />
          <Text style={styles.waitingSubtitle}>
            The host is reading the voting results to the group
          </Text>
        </View>
      </ThemedView>
    );
  }

  // Creator view - show individual votes
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        <GradientText 
          text="MVP" 
          style={styles.mvpTitle}
        />
        
        <Text style={styles.pageTitle}>Voting results</Text>

        {/* Vote Counter */}
        <Text style={styles.voteCounter}>
          Vote {currentVoteIndex + 1} of {totalVotes}
        </Text>

        {/* Results Card */}
        {currentVote ? (
          <View style={styles.resultsCard}>
            {/* MVP Section */}
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>MVP: {currentVote.mvpName.toUpperCase()}</Text>
              <Text style={styles.resultComment}>{currentVote.mvpComment}</Text>
            </View>

            <View style={styles.divider} />

            {/* Loser Section */}
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>Loser: {currentVote.loserName.toUpperCase()}</Text>
              <Text style={styles.resultComment}>{currentVote.loserComment}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.resultsCard}>
            <Text style={styles.noVotesText}>No votes submitted yet</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {hasPreviousVote && (
            <SecondaryButton
              onPress={handlePreviousVote}
              style={styles.secondaryBtn}
              textStyle={styles.buttonText}
            >
              Previous vote
            </SecondaryButton>
          )}
          
          {hasNextVote ? (
            <PrimaryButton
              onPress={handleNextVote}
              style={[styles.primaryBtn, !hasPreviousVote && styles.fullWidthBtn]}
              textStyle={styles.buttonText}
            >
              Next vote
            </PrimaryButton>
          ) : (
            <PrimaryButton
              onPress={handleGoToRanking}
              style={[styles.primaryBtn, !hasPreviousVote && styles.fullWidthBtn]}
              textStyle={styles.buttonText}
            >
              Go to ranking
            </PrimaryButton>
          )}
        </View>
      </ScrollView>
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
  },
  // Non-creator waiting view
  waitingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
  },
  waitingSubtitle: {
    color: Colors.icon,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
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
  },
  pageTitle: {
    color: Colors.text,
    fontSize: 20,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  voteCounter: {
    color: Colors.icon,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
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
  },
  resultComment: {
    color: '#3a3a3a',
    fontSize: 14,
    lineHeight: 20,
  },
  noVotesText: {
    color: '#3a3a3a',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
  },
  primaryBtn: {
    flex: 1,
  },
  fullWidthBtn: {
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
