import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { usePolledRestData } from '@/hooks/usePolledRestData';
import { RankingEntry, rankingsFromLobbyOrVotes, VoteTallyInput } from '@/services/voteRankings';

interface LobbyData {
  creatorId: string;
  status: string;
  mvpRanking?: unknown;
  loserRanking?: unknown;
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

export default function RankingScreen() {
  const { voteId } = useLocalSearchParams<{ voteId: string; from?: string }>();
  const { data: lobbyData, isLoading } = usePolledRestData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000
  );
  const { data: votesData } = usePolledRestData<Record<string, VoteTallyInput>>(
    voteId ? `votes/${voteId}` : null,
    2000
  );

  const rankings = rankingsFromLobbyOrVotes(lobbyData, votesData);

  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <ThemedView safeAndroid style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView safeAndroid style={styles.container}>
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
          <View style={[styles.rankingColumn, rankings.loserRanking.length === 0 && styles.rankingColumnFull]}>
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

          {/* Loser Rankings - only show if there are loser votes */}
          {rankings.loserRanking.length > 0 && (
            <View style={styles.rankingColumn}>
              <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, styles.loserIconBg]}>
                <Ionicons name="sad" size={16} color="#fff" />
              </View>
                <Text style={styles.sectionTitle}>Loser</Text>
              </View>
              
              <View style={styles.rankingList}>
                {rankings.loserRanking.map((entry, index) => (
                  <RankingItem 
                    key={entry.name} 
                    entry={entry} 
                    position={index}
                    type="loser"
                  />
                ))}
              </View>
            </View>
          )}
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
    fontFamily: defaultFontFamily,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: defaultFontFamily,
  },
  rankingsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rankingColumn: {
    flex: 1,
  },
  rankingColumnFull: {
    flex: 1,
    maxWidth: '100%',
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
    fontFamily: defaultFontFamily,
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
    fontFamily: defaultFontFamily,
  },
  rankingInfo: {
    flex: 1,
    minWidth: 0,
  },
  rankingName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: defaultFontFamily,
  },
  rankingNameFirst: {
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
  rankingVotes: {
    color: Colors.icon,
    fontSize: 11,
    marginTop: 1,
    fontFamily: defaultFontFamily,
  },
  winnerEmoji: {
    fontSize: 16,
    marginLeft: 4,
    fontFamily: defaultFontFamily,
  },
  noDataText: {
    color: Colors.icon,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
    fontFamily: defaultFontFamily,
  },
  finishButton: {
    marginTop: 32,
  },
  finishButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
});
