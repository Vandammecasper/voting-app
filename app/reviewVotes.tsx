import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ScreenBackButton } from '@/components/screen-back-button';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { usePolledRestData } from '@/hooks/usePolledRestData';
import { useVoteRouteParams } from '@/hooks/useVoteRouteParams';
import { formatVotesShareText, ShareableVote } from '@/services/voteShareText';
import { scale } from '@/utils/scale';

type VoteData = ShareableVote & { submittedAt?: number };

type VotesData = Record<string, VoteData>;

type ReviewVote = VoteData & { id: string };

function VoteSelectCard({
  vote,
  selected,
  onToggle,
}: {
  vote: ReviewVote;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Select vote for MVP ${vote.mvpName}`}
      style={[styles.voteCard, selected && styles.voteCardSelected]}
    >
      <View style={styles.checkboxColumn}>
        <Ionicons
          name={selected ? 'checkbox' : 'square-outline'}
          size={24}
          color={selected ? '#1a1a1a' : '#3a3a3a'}
        />
      </View>
      <View style={styles.voteContent}>
        <View style={styles.resultSection}>
          <Text style={styles.resultLabel}>MVP: {vote.mvpName.toUpperCase()}</Text>
          <Text style={styles.resultComment}>{vote.mvpComment}</Text>
        </View>
        {vote.loserName && vote.loserComment ? (
          <>
            <View style={styles.divider} />
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>Loser: {vote.loserName.toUpperCase()}</Text>
              <Text style={styles.resultComment}>{vote.loserComment}</Text>
            </View>
          </>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ReviewVotesScreen() {
  const { voteId } = useVoteRouteParams();
  const { data: votesData, isLoading } = usePolledRestData<VotesData>(
    voteId ? `votes/${voteId}` : null,
    2000
  );

  const votesArray = useMemo<ReviewVote[]>(() => {
    if (!votesData) return [];
    return Object.entries(votesData).map(([id, vote]) => ({ id, ...vote }));
  }, [votesData]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const ids = new Set(votesArray.map((v) => v.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => ids.has(id)));
      if (next.size === prev.size) {
        for (const id of next) {
          if (!prev.has(id)) return next;
        }
        return prev;
      }
      return next;
    });
  }, [votesArray]);

  const allSelected =
    votesArray.length > 0 && selectedIds.size === votesArray.length;

  const toggleVote = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    setSelectedIds(new Set(votesArray.map((v) => v.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleShare = async () => {
    const selected = votesArray.filter((v) => selectedIds.has(v.id));
    if (selected.length === 0 || isSharing) return;

    const message = formatVotesShareText(selected);
    setIsSharing(true);
    try {
      await Share.share({ message });
    } catch {
      try {
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied', 'Votes copied to clipboard.');
      } catch {
        Alert.alert('Error', 'Could not share votes. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (voteId) {
      router.replace({ pathname: '/ranking', params: { voteId } });
    } else {
      router.replace('/(tabs)');
    }
  };

  if (isLoading) {
    return (
      <ThemedView safeAndroid style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading votes...</Text>
        </View>
        <ScreenBackButton onPress={handleBack} />
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
        <GradientText text="Review votes" style={styles.title} />

        <Text style={styles.subtitle}>
          {votesArray.length === 0
            ? 'No votes to review'
            : `${selectedIds.size} of ${votesArray.length} selected`}
        </Text>

        {votesArray.length > 0 ? (
          <View style={styles.selectActions}>
            <Pressable
              onPress={allSelected ? handleDeselectAll : handleSelectAll}
              accessibilityRole="button"
              accessibilityLabel={allSelected ? 'Deselect all votes' : 'Select all votes'}
              hitSlop={8}
            >
              <Text style={styles.selectAllText}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {votesArray.length > 0 ? (
          <View style={styles.voteList}>
            {votesArray.map((vote) => (
              <VoteSelectCard
                key={vote.id}
                vote={vote}
                selected={selectedIds.has(vote.id)}
                onToggle={() => toggleVote(vote.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No votes submitted</Text>
          </View>
        )}

        <PrimaryButton
          onPress={handleShare}
          disabled={selectedIds.size === 0 || isSharing}
          style={styles.shareButton}
          textStyle={styles.shareButtonText}
        >
          Share selected
        </PrimaryButton>

        <SecondaryButton
          onPress={handleBack}
          style={styles.backButton}
          textStyle={styles.shareButtonText}
        >
          Back to ranking
        </SecondaryButton>
      </ScrollView>

      <ScreenBackButton onPress={handleBack} />
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
  },
  loadingText: {
    color: Colors.text,
    fontSize: scale(18),
    fontFamily: defaultFontFamily,
  },
  title: {
    fontSize: scale(32),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: scale(8),
    fontFamily: defaultFontFamily,
  },
  subtitle: {
    color: Colors.icon,
    fontSize: scale(14),
    textAlign: 'center',
    marginBottom: scale(16),
    fontFamily: defaultFontFamily,
  },
  selectActions: {
    alignItems: 'flex-end',
    marginBottom: scale(12),
  },
  selectAllText: {
    color: '#90FF91',
    fontSize: scale(14),
    fontWeight: '600',
    fontFamily: defaultFontFamily,
  },
  voteList: {
    gap: scale(12),
    marginBottom: scale(24),
  },
  voteCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: scale(16),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  voteCardSelected: {
    borderColor: '#90FF91',
  },
  checkboxColumn: {
    marginRight: scale(12),
    paddingTop: scale(4),
  },
  voteContent: {
    flex: 1,
    minWidth: 0,
  },
  resultSection: {
    paddingVertical: scale(4),
  },
  resultLabel: {
    color: '#1a1a1a',
    fontSize: scale(16),
    fontWeight: 'bold',
    marginBottom: scale(6),
    fontFamily: defaultFontFamily,
  },
  resultComment: {
    color: '#3a3a3a',
    fontSize: scale(14),
    lineHeight: scale(20),
    fontFamily: defaultFontFamily,
  },
  divider: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginVertical: scale(12),
  },
  emptyCard: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: scale(24),
    marginBottom: scale(24),
  },
  emptyText: {
    color: Colors.icon,
    fontSize: scale(16),
    textAlign: 'center',
    fontFamily: defaultFontFamily,
  },
  shareButton: {
    marginTop: scale(8),
  },
  backButton: {
    marginTop: scale(12),
  },
  shareButtonText: {
    fontSize: scale(18),
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
});
