import auth from '@react-native-firebase/auth';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL;

interface Participant {
  name: string;
  joinedAt: number;
  isCreator: boolean;
}

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

type ParticipantsData = Record<string, Participant>;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!path) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      const result = await readViaRest<T>(path);
      if (isMounted) {
        setData(result);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling interval
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [path, intervalMs]);

  return { data, isLoading };
}

export default function VotingWaitingScreen() {
  const { voteId, from } = useLocalSearchParams<{ voteId: string; from?: string }>();
  const { user } = useAuth();
  
  // Poll lobby data
  const { data: lobbyData } = usePolledData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000
  );
  
  // Poll participants data
  const { data: participantsData } = usePolledData<ParticipantsData>(
    voteId ? `participants/${voteId}` : null,
    2000
  );
  
  // Poll votes data
  const { data: votesData } = usePolledData<VotesData>(
    voteId ? `votes/${voteId}` : null,
    2000
  );

  // Check if current user is the creator
  const isCreator = user && lobbyData && user.uid === lobbyData.creatorId;

  // Calculate vote counts
  const totalParticipants = participantsData ? Object.keys(participantsData).length : 0;
  const votesSubmitted = votesData ? Object.keys(votesData).length : 0;
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
      await updateViaRest(`lobbies/${voteId}`, { status: 'results' });
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
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.exitButton}
        onPress={handleExit}
        activeOpacity={0.6}
      >
        <Ionicons name="close" size={28} color={Colors.icon} style={{ opacity: 0.5 }} />
      </TouchableOpacity>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
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

