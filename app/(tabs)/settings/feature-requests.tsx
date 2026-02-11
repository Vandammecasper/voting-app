import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';

/** Shape of a single feature request (for when data is connected later) */
export interface FeatureRequestItem {
  title?: string;
  description?: string;
  createdAt?: number;
  userId?: string;
  userName?: string;
  status?: string;
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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

interface FeatureRequestCardProps {
  id: string;
  item: FeatureRequestItem;
}

function FeatureRequestCard({ id, item }: FeatureRequestCardProps) {
  const title = item.title ?? 'Untitled';
  const description = item.description ?? '';
  const createdAt = item.createdAt ?? 0;
  const userName = item.userName ?? item.userId ?? null;
  const status = item.status;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>
        {createdAt > 0 && (
          <Text style={styles.cardDate}>{formatDate(createdAt)}</Text>
        )}
      </View>
      {description ? (
        <Text style={styles.cardDescription} numberOfLines={4}>
          {description}
        </Text>
      ) : null}
      <View style={styles.cardFooter}>
        {userName ? (
          <View style={styles.userRow}>
            <Ionicons name="person-outline" size={14} color={Colors.icon} />
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
          </View>
        ) : null}
        {status ? (
          <View style={[styles.statusBadge, styles.statusDefault]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** Not connected to any backend yet — styling only. */
const MOCK_LIST: { id: string; item: FeatureRequestItem }[] = [];

export default function FeatureRequestsScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          MOCK_LIST.length === 0 && styles.scrollContentCentered,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.text}
            colors={['#6E92FF']}
            progressBackgroundColor="#3a3a3a"
          />
        }
      >
        {MOCK_LIST.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={64} color={Colors.icon} />
            <Text style={styles.emptyTitle}>No feature requests yet</Text>
            <Text style={styles.emptySubtitle}>
              Feature requests from users will appear here once connected to a backend.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {MOCK_LIST.map(({ id, item }) => (
              <FeatureRequestCard key={id} id={id} item={item} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    fontFamily: defaultFontFamily,
  },
  emptySubtitle: {
    color: Colors.icon,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: defaultFontFamily,
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
    fontFamily: defaultFontFamily,
  },
  cardDate: {
    color: Colors.icon,
    fontSize: 13,
    fontFamily: defaultFontFamily,
  },
  cardDescription: {
    color: Colors.icon,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: defaultFontFamily,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '70%',
  },
  userName: {
    color: Colors.icon,
    fontSize: 12,
    fontFamily: defaultFontFamily,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDefault: {
    backgroundColor: 'rgba(110, 146, 255, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: defaultFontFamily,
  },
});
