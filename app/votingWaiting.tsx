import auth from '@react-native-firebase/auth';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

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
  const { voteId } = useLocalSearchParams<{ voteId: string }>();
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
        params: { voteId },
      });
    }
  }, [lobbyData?.status, voteId]);

  const handleGoToResults = async () => {
    // Update lobby status to 'results' so all participants navigate
    if (voteId) {
      await updateViaRest(`lobbies/${voteId}`, { status: 'results' });
    }
    
    router.replace({
      pathname: '/results',
      params: { voteId },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <GradientText 
        text="Your teammates are voting" 
        style={styles.title}
      />

      <View style={styles.content}>
        <View style={styles.countContainer}>
          <Text style={styles.countLabel}>Still need to vote:</Text>
          <Text style={styles.countNumber}>{votesRemaining}</Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.hint}>
          {votesRemaining === 0 ? 'Everyone has voted!' : 'Waiting for others to submit their votes...'}
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
  },
  countContainer: {
    alignItems: 'center',
  },
  countLabel: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 16,
  },
  countNumber: {
    color: Colors.text,
    fontSize: 64,
    fontWeight: 'bold',
  },
  bottomContainer: {
    paddingBottom: 60,
    gap: 24,
  },
  hint: {
    color: Colors.icon,
    fontSize: 14,
    textAlign: 'center',
  },
  resultsButton: {
    marginHorizontal: 0,
  },
  resultsButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

