import auth from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL;

// Helper to read data using REST API (silent version for polling)
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

// Helper to update data using REST API (PATCH for partial updates)
async function updateViaRest<T>(path: string, data: T): Promise<boolean> {
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
    console.error('❌ REST update error:', error);
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

const GRADIENT_COLORS = ['#6E92FF', '#90FF91'] as const;

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

type ParticipantsData = Record<string, Participant>;

interface DisplayParticipant {
  name: string;
  isCreator: boolean;
  isOnline: boolean;
}

export default function WaitingRoomScreen() {
  const { voteId } = useLocalSearchParams<{ voteId: string }>();
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const hasNavigated = useRef(false);
  
  // Poll lobby data using REST API (avoids SDK crashes)
  const { data: lobbyData } = usePolledData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000 // Poll every 2 seconds
  );
  
  // Poll participants data using REST API
  const { data: participantsData } = usePolledData<ParticipantsData>(
    voteId ? `participants/${voteId}` : null,
    2000 // Poll every 2 seconds
  );

  // Check if current user is the creator
  const isCreator = user && lobbyData && user.uid === lobbyData.creatorId;

  // Navigate to voting screen when status changes to 'voting'
  useEffect(() => {
    if (lobbyData?.status === 'voting' && voteId && !hasNavigated.current) {
      hasNavigated.current = true;
      router.replace({
        pathname: '/voting',
        params: { voteId },
      });
    }
  }, [lobbyData?.status, voteId]);

  // Handle start voting button
  const handleStartVoting = async () => {
    if (!voteId || !isCreator) return;

    setIsStarting(true);
    try {
      const success = await updateViaRest(`lobbies/${voteId}`, { status: 'voting' });
      
      if (!success) {
        Alert.alert('Error', 'Failed to start voting. Please try again.');
        setIsStarting(false);
        return;
      }
      // Navigation will happen automatically via the useEffect when status changes
    } catch (error) {
      console.error('❌ Error starting voting:', error);
      Alert.alert('Error', 'Failed to start voting. Please try again.');
      setIsStarting(false);
    }
  };

  // Build participants list with host always included
  const participants: DisplayParticipant[] = React.useMemo(() => {
    try {
      const result: DisplayParticipant[] = [];
      
      if (!lobbyData) {
        return result;
      }
      
      // Check if host is in the participants list
      const hostInParticipants = participantsData 
        ? Object.keys(participantsData).includes(lobbyData.creatorId)
        : false;
      
      // Always add host first
      result.push({
        name: lobbyData.creatorName || 'Host',
        isCreator: true,
        isOnline: hostInParticipants,
      });
      
      // Add other participants (excluding the host since we already added them)
      if (participantsData) {
        Object.entries(participantsData).forEach(([id, participant]) => {
          if (id !== lobbyData.creatorId && participant && participant.name) {
            result.push({
              name: participant.name,
              isCreator: false,
              isOnline: true,
            });
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error building participants list:', error);
      return [];
    }
  }, [lobbyData, participantsData]);

  return (
    <ThemedView style={styles.container}>
      <SecondaryButton style={{ marginHorizontal: 56, top: -64 }} textStyle={{ fontSize: 16, fontWeight: 'bold' }} onPress={() => {}}>
        {`ID: ${lobbyData?.code || 'Loading...'}`}
      </SecondaryButton>
      <GradientText 
        text="Waiting for others to join" 
        style={{ fontSize: 40, fontWeight: 'bold', textAlign: 'center' }}
      />
      
      {/* Waiting Room Box */}
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0.42, y: 0.1 }}
        end={{ x: 0.5, y: 1.75 }}
        style={styles.boxBorder}
      >
        <View style={styles.boxInner}>
          <GradientText 
            text="Waiting room" 
            style={styles.boxTitle}
          />
          <ScrollView style={styles.participantsScroll} contentContainerStyle={styles.participantsGrid}>
            {participants.length > 0 ? (
              participants.map((participant, index) => (
                <Text 
                  key={index} 
                  style={[
                    styles.participantName,
                    participant.isCreator && styles.creatorName,
                    !participant.isOnline && styles.offlineName,
                  ]}
                >
                  {participant.name}{participant.isCreator ? ' 👑' : ''}
                </Text>
              ))
            ) : (
              <Text style={styles.participantName}>Waiting for participants...</Text>
            )}
          </ScrollView>
        </View>
      </LinearGradient>

      <Text style={styles.waitingCount}>
        {participants.filter(p => p.isOnline).length} {participants.filter(p => p.isOnline).length === 1 ? 'person is' : 'people are'} waiting
      </Text>
      <View style={styles.buttonContainer}>
        {isCreator && (
          <PrimaryButton 
            style={{ marginHorizontal: 24 }} 
            textStyle={{ fontSize: 24, fontWeight: 'bold' }} 
            onPress={handleStartVoting}
            disabled={isStarting}
          >
            {isStarting ? 'Starting...' : 'start voting'}
          </PrimaryButton>
        )}
        <SecondaryButton style={{ marginHorizontal: 24 }} textStyle={{ fontSize: 18 }} onPress={() => router.replace('/')}>exit vote</SecondaryButton>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  boxBorder: {
    borderRadius: 20,
    padding: 2,
    marginTop: 80,
    width: '100%',
  },
  boxInner: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  boxTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  participantsScroll: {
    maxHeight: 140,
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  participantName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '500',
    width: '33%',
    textAlign: 'center',
    paddingVertical: 12,
  },
  creatorName: {
    fontWeight: '700',
  },
  offlineName: {
    opacity: 0.4,
  },
  waitingCount: {
    color: Colors.icon,
    fontSize: 16,
    marginTop: 16,
  },
  buttonContainer: {
    marginTop: 32,
    width: '100%',
    gap: 16,
  },
});
