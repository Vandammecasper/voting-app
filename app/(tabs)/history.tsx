import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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
  loserName: string;
  submittedAt: number;
}

interface ParticipantData {
  name: string;
  joinedAt: number;
  isCreator: boolean;
}

interface HistoryItem {
  lobbyId: string;
  lobbyData: LobbyData;
  mvpWinner: string | null;
  loserWinner: string | null;
  participatedAt: number;
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

// Helper to delete data using REST API
async function deleteViaRest(path: string): Promise<boolean> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.log(`❌ Delete failed for ${path}: No user`);
      return false;
    }
    
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      console.log(`❌ Delete failed for ${path}: ${response.status} ${response.statusText}`);
    } else {
      console.log(`✅ Deleted ${path}`);
    }
    
    return response.ok;
  } catch (error) {
    console.error(`❌ Delete error for ${path}:`, error);
    return false;
  }
}

// Calculate winners from votes
function calculateWinners(votes: Record<string, VoteData>): { mvp: string | null; loser: string | null } {
  const mvpCounts: Record<string, number> = {};
  const loserCounts: Record<string, number> = {};

  Object.values(votes).forEach((vote) => {
    mvpCounts[vote.mvpName] = (mvpCounts[vote.mvpName] || 0) + 1;
    loserCounts[vote.loserName] = (loserCounts[vote.loserName] || 0) + 1;
  });

  let mvpWinner: string | null = null;
  let maxMvpVotes = 0;
  Object.entries(mvpCounts).forEach(([name, count]) => {
    if (count > maxMvpVotes) {
      maxMvpVotes = count;
      mvpWinner = name;
    }
  });

  let loserWinner: string | null = null;
  let maxLoserVotes = 0;
  Object.entries(loserCounts).forEach(([name, count]) => {
    if (count > maxLoserVotes) {
      maxLoserVotes = count;
      loserWinner = name;
    }
  });

  return { mvp: mvpWinner, loser: loserWinner };
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  }
}

interface HistoryCardProps {
  item: HistoryItem;
  isCreator: boolean;
  isDeleting: boolean;
  onPress: () => void;
  onDelete: () => void;
}

function HistoryCard({ item, isCreator, isDeleting, onPress, onDelete }: HistoryCardProps) {
  const isCompleted = item.lobbyData.status === 'ranking' || item.lobbyData.status === 'completed';
  
  const handleDelete = () => {
    onDelete();
  };
  
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card, 
        pressed && styles.cardPressed,
        isDeleting && styles.cardDeleting,
      ]}
      onPress={onPress}
      disabled={isDeleting}
    >
      {isDeleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="small" color={Colors.text} />
          <Text style={styles.deletingText}>Deleting...</Text>
        </View>
      )}
      <View style={[styles.cardHeader, isDeleting && styles.cardContentFaded]}>
        <Text style={styles.cardDate}>{formatDate(item.participatedAt)}</Text>
        <View style={styles.headerRight}>
          {isCreator && !isDeleting && (
            <Pressable 
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation?.();
                handleDelete();
              }}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
            </Pressable>
          )}
          <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusInProgress]}>
            <Text style={styles.statusText}>
              {isCompleted ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.cardContent, isDeleting && styles.cardContentFaded]}>
        <View style={styles.resultRow}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>🏆 MVP</Text>
            <Text style={styles.resultName} numberOfLines={1}>
              {item.mvpWinner || '—'}
            </Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>🤡 Loser</Text>
            <Text style={styles.resultName} numberOfLines={1}>
              {item.loserWinner || '—'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.cardFooter, isDeleting && styles.cardContentFaded]}>
        <Text style={styles.codeText}>Code: {item.lobbyData.code}</Text>
        <View style={styles.footerRight}>
          {!isCompleted && !isDeleting && (
            <Text style={styles.rejoinText}>Tap to rejoin</Text>
          )}
          <Ionicons name="chevron-forward" size={20} color={Colors.icon} />
        </View>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async (isRefresh = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    }

    try {
      // Fetch user's participation history
      const userHistory = await readViaRest<Record<string, { lobbyId: string; joinedAt: number }>>(
        `userHistory/${user.uid}`
      );

      if (!userHistory) {
        setHistory([]);
        return;
      }

      // Fetch details for each lobby
      const historyItems: HistoryItem[] = [];
      
      for (const [, entry] of Object.entries(userHistory)) {
        const lobbyId = entry.lobbyId;
        
        // Fetch lobby data and votes in parallel
        const [lobbyData, votesData] = await Promise.all([
          readViaRest<LobbyData>(`lobbies/${lobbyId}`),
          readViaRest<Record<string, VoteData>>(`votes/${lobbyId}`),
        ]);

        if (lobbyData) {
          const winners = votesData ? calculateWinners(votesData) : { mvp: null, loser: null };
          
          historyItems.push({
            lobbyId,
            lobbyData,
            mvpWinner: winners.mvp,
            loserWinner: winners.loser,
            participatedAt: entry.joinedAt,
          });
        }
      }

      // Sort by date, newest first
      historyItems.sort((a, b) => b.participatedAt - a.participatedAt);
      setHistory(historyItems);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
      if (isRefresh) {
        setIsRefreshing(false);
        // Show updated toast
        setShowUpdatedToast(true);
        setTimeout(() => setShowUpdatedToast(false), 2000);
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleRefresh = () => {
    fetchHistory(true);
  };

  const handleCardPress = (item: HistoryItem) => {
    const status = item.lobbyData.status;
    
    // Navigate to appropriate screen based on vote status
    // Pass 'from=history' so we can navigate back here when done
    switch (status) {
      case 'waiting':
        // Rejoin the waiting room
        router.push({
          pathname: '/waitingRoom',
          params: { voteId: item.lobbyId, from: 'history' },
        });
        break;
      case 'voting':
        // Rejoin the voting screen
        router.push({
          pathname: '/voting',
          params: { voteId: item.lobbyId, from: 'history' },
        });
        break;
      case 'results':
        // Go to results screen
        router.push({
          pathname: '/results',
          params: { voteId: item.lobbyId, from: 'history' },
        });
        break;
      case 'ranking':
      case 'completed':
      default:
        // Go to ranking screen for completed votes
        router.push({
          pathname: '/ranking',
          params: { voteId: item.lobbyId, from: 'history' },
        });
        break;
    }
  };

  const handleDelete = (item: HistoryItem) => {
    Alert.alert(
      'Delete Vote',
      'Are you sure you want to delete this vote? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const lobbyId = item.lobbyId;
            const code = item.lobbyData.code;

            // Set loading state
            setDeletingId(lobbyId);

            try {
              // IMPORTANT: Delete participants and votes FIRST
              // (Firebase rules check lobby creatorId, so lobby must still exist)
              await deleteViaRest(`participants/${lobbyId}`);
              await deleteViaRest(`votes/${lobbyId}`);
              
              // Then delete lobby and other data
              await Promise.all([
                deleteViaRest(`lobbies/${lobbyId}`),
                deleteViaRest(`lobbyCodes/${code}`),
                user ? deleteViaRest(`userHistory/${user.uid}/${lobbyId}`) : Promise.resolve(true),
              ]);

              // Remove from local state
              setHistory((prev) => prev.filter((h) => h.lobbyId !== lobbyId));
            } catch (error) {
              console.error('Error deleting vote:', error);
              Alert.alert('Error', 'Failed to delete the vote. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.tint} />
          <Text style={styles.loadingText}>Loading your votes...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Updated Toast */}
      {showUpdatedToast && (
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(200)}
          style={styles.toast}
        >
          <Ionicons name="checkmark-circle" size={18} color="#90FF91" />
          <Text style={styles.toastText}>Updated</Text>
        </Animated.View>
      )}

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.text}
            colors={['#6E92FF']}
            progressBackgroundColor="#3a3a3a"
          />
        }
      >
        <GradientText 
          text="My Votes" 
          style={styles.title}
        />

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={Colors.icon} />
            <Text style={styles.emptyTitle}>No votes yet</Text>
            <Text style={styles.emptySubtitle}>
              Your voting history will appear here after you participate in a vote.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((item) => (
              <HistoryCard
                key={item.lobbyId}
                item={item}
                isCreator={user?.uid === item.lobbyData.creatorId}
                isDeleting={deletingId === item.lobbyId}
                onPress={() => handleCardPress(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.icon,
    fontSize: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.icon,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  historyList: {
    gap: 16,
  },
  card: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardDeleting: {
    opacity: 0.7,
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  deletingText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  cardContentFaded: {
    opacity: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  cardDate: {
    color: Colors.icon,
    fontSize: 13,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: 'rgba(144, 255, 145, 0.2)',
  },
  statusInProgress: {
    backgroundColor: 'rgba(110, 146, 255, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultItem: {
    flex: 1,
  },
  resultDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#4a4a4a',
    marginHorizontal: 16,
  },
  resultLabel: {
    color: Colors.icon,
    fontSize: 12,
    marginBottom: 4,
  },
  resultName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#4a4a4a',
  },
  codeText: {
    color: Colors.icon,
    fontSize: 12,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejoinText: {
    color: '#6E92FF',
    fontSize: 12,
    fontWeight: '500',
  },
});
