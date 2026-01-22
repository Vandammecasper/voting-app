import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

const DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL;

interface LobbyData {
  creatorId: string;
  status: string;
}

interface VoteData {
  mvpName: string;
  mvpComment: string;
  loserName: string;
  loserComment: string;
  submittedAt: number;
}

type VotesData = Record<string, VoteData>;

interface RankingEntry {
  name: string;
  votes: number;
}

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

// Calculate rankings from votes
function calculateRankings(votes: VotesData): {
  mvpRanking: RankingEntry[];
  loserRanking: RankingEntry[];
} {
  const mvpCounts: Record<string, number> = {};
  const loserCounts: Record<string, number> = {};

  Object.values(votes).forEach((vote) => {
    // Count MVP votes
    mvpCounts[vote.mvpName] = (mvpCounts[vote.mvpName] || 0) + 1;
    // Count Loser votes
    loserCounts[vote.loserName] = (loserCounts[vote.loserName] || 0) + 1;
  });

  // Convert to sorted arrays
  const mvpRanking = Object.entries(mvpCounts)
    .map(([name, votes]) => ({ name, votes }))
    .sort((a, b) => b.votes - a.votes);

  const loserRanking = Object.entries(loserCounts)
    .map(([name, votes]) => ({ name, votes }))
    .sort((a, b) => b.votes - a.votes);

  return { mvpRanking, loserRanking };
}

// Medal colors for top 3
const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze

function RankingItem({ entry, position, type }: { 
  entry: RankingEntry; 
  position: number;
  type: 'mvp' | 'loser';
}) {
  const isTopThree = position < 3;
  const isFirst = position === 0;
  
  return (
    <View style={[
      styles.rankingItem, 
      isFirst && (type === 'mvp' ? styles.rankingItemFirstMvp : styles.rankingItemFirstLoser)
    ]}>
      <View style={styles.positionContainer}>
        {isTopThree ? (
          <Ionicons 
            name={position === 0 ? 'trophy' : 'medal'} 
            size={20} 
            color={medalColors[position]} 
          />
        ) : (
          <Text style={styles.positionNumber}>{position + 1}</Text>
        )}
      </View>
      
      <View style={styles.rankingInfo}>
        <Text style={[styles.rankingName, isFirst && styles.rankingNameFirst]} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={styles.rankingVotes}>
          {entry.votes} {entry.votes === 1 ? 'vote' : 'votes'}
        </Text>
      </View>
      
      {isFirst && (
        <Text style={styles.winnerEmoji}>
          {type === 'mvp' ? '🏆' : '🤡'}
        </Text>
      )}
    </View>
  );
}

// Hook to poll data
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

    fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [path, intervalMs]);

  return { data, isLoading };
}

export default function RankingScreen() {
  const { voteId } = useLocalSearchParams<{ voteId: string }>();
  
  const [votesData, setVotesData] = useState<VotesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Poll lobby data to check for status changes
  const { data: lobbyData } = usePolledData<LobbyData>(
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

  const rankings = useMemo(() => {
    if (!votesData) return { mvpRanking: [], loserRanking: [] };
    return calculateRankings(votesData);
  }, [votesData]);

  const handleFinish = () => {
    router.replace('/');
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GradientText 
          text="Final Rankings" 
          style={styles.title}
        />

        {/* Side by Side Rankings */}
        <View style={styles.rankingsRow}>
          {/* MVP Rankings */}
          <View style={styles.rankingColumn}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#90FF91', '#6E92FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sectionIconBg}
              >
                <Ionicons name="trophy" size={16} color="#1a1a1a" />
              </LinearGradient>
              <Text style={styles.sectionTitle}>MVP</Text>
            </View>
            
            <View style={styles.rankingList}>
              {rankings.mvpRanking.length > 0 ? (
                rankings.mvpRanking.map((entry, index) => (
                  <RankingItem 
                    key={entry.name} 
                    entry={entry} 
                    position={index}
                    type="mvp"
                  />
                ))
              ) : (
                <Text style={styles.noDataText}>No votes</Text>
              )}
            </View>
          </View>

          {/* Loser Rankings */}
          <View style={styles.rankingColumn}>
            <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, styles.loserIconBg]}>
              <Ionicons name="sad" size={16} color="#fff" />
            </View>
              <Text style={styles.sectionTitle}>Loser</Text>
            </View>
            
            <View style={styles.rankingList}>
              {rankings.loserRanking.length > 0 ? (
                rankings.loserRanking.map((entry, index) => (
                  <RankingItem 
                    key={entry.name} 
                    entry={entry} 
                    position={index}
                    type="loser"
                  />
                ))
              ) : (
                <Text style={styles.noDataText}>No votes</Text>
              )}
            </View>
          </View>
        </View>

        {/* Finish Button */}
        <PrimaryButton
          onPress={handleFinish}
          style={styles.finishButton}
          textStyle={styles.finishButtonText}
        >
          Finish
        </PrimaryButton>
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
    paddingHorizontal: 16,
    paddingTop: 80,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text,
    fontSize: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  rankingsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rankingColumn: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  loserIconBg: {
    backgroundColor: '#FF6B6B',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankingList: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a4a',
  },
  rankingItemFirstMvp: {
    backgroundColor: 'rgba(144, 255, 145, 0.1)',
  },
  rankingItemFirstLoser: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  positionContainer: {
    width: 28,
    alignItems: 'center',
    marginRight: 8,
  },
  positionNumber: {
    color: Colors.icon,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankingInfo: {
    flex: 1,
    minWidth: 0,
  },
  rankingName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  rankingNameFirst: {
    fontWeight: 'bold',
  },
  rankingVotes: {
    color: Colors.icon,
    fontSize: 11,
    marginTop: 1,
  },
  winnerEmoji: {
    fontSize: 16,
    marginLeft: 4,
  },
  noDataText: {
    color: Colors.icon,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  finishButton: {
    marginTop: 32,
  },
  finishButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
