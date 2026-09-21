import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { listTeams, MIN_TEAM_MEMBERS, UserTeamWithId } from '@/services/teams';

export default function TeamsScreen() {
  const { user } = useAuth();
  const [teams, setTeams] = React.useState<UserTeamWithId[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadTeams = React.useCallback(async () => {
    if (!user?.uid) {
      setTeams([]);
      return;
    }
    try {
      const next = await listTeams(user.uid);
      setTeams(next);
    } catch {
      setTeams([]);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadTeams().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadTeams]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTeams();
    } finally {
      setRefreshing(false);
    }
  }, [loadTeams]);

  const openCreate = () => {
    router.push('/(tabs)/settings/team-edit' as Href);
  };

  const openEdit = (id: string) => {
    router.push(`/(tabs)/settings/team-edit?id=${encodeURIComponent(id)}` as Href);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          teams.length === 0 && !isLoading && styles.scrollContentCentered,
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
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#6E92FF" />
          </View>
        ) : teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.icon} />
            <Text style={styles.emptyTitle}>No teams yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a team with at least {MIN_TEAM_MEMBERS} members to use it when starting a vote.
            </Text>
            <PrimaryButton onPress={openCreate} style={styles.addButton}>
              Add team
            </PrimaryButton>
          </View>
        ) : (
          <View style={styles.list}>
            {teams.map((team) => (
              <PressableScale
                key={team.id}
                onPress={() => openEdit(team.id)}
                style={styles.card}
                accessibilityRole="button"
                accessibilityLabel={`Edit team ${team.name}`}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {team.name}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.icon} />
                </View>
                <Text style={styles.cardMembers} numberOfLines={2}>
                  {team.members.length > 0
                    ? team.members.join(', ')
                    : 'No members yet'}
                </Text>
                <Text style={styles.cardMeta}>
                  {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                  {team.members.length < MIN_TEAM_MEMBERS
                    ? ` · add ${MIN_TEAM_MEMBERS - team.members.length} more to use in a vote`
                    : ''}
                </Text>
              </PressableScale>
            ))}
          </View>
        )}
      </ScrollView>
      {teams.length > 0 && (
        <View style={styles.bottomBar}>
          <PrimaryButton onPress={openCreate} style={styles.addButtonBottom}>
            Add team
          </PrimaryButton>
        </View>
      )}
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
  addButton: {
    marginTop: 24,
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
    alignItems: 'center',
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
  cardMembers: {
    color: Colors.icon,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: defaultFontFamily,
    marginBottom: 8,
  },
  cardMeta: {
    color: Colors.icon,
    fontSize: 13,
    fontFamily: defaultFontFamily,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  addButtonBottom: {},
});
