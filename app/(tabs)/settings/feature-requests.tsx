import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePullToRefreshGuard } from '@/hooks/usePullToRefreshGuard';
import { useTabSceneBottomInset } from '@/hooks/useTabSceneBottomInset';
import { restDelete, restGet, restPatch, restPush, restPut } from '@/services/firebaseRest';

export interface FeatureRequestItem {
  title?: string;
  description?: string;
  createdAt?: number;
  userId?: string;
  userName?: string;
  /** userId -> true for each like (from Firebase) */
  likes?: Record<string, true>;
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
  currentUserId: string | undefined;
  onLikeToggle: (requestId: string) => Promise<void>;
  onEdit: (requestId: string) => void;
  onDelete: (requestId: string) => void;
}

function FeatureRequestCard({ id, item, currentUserId, onLikeToggle, onEdit, onDelete }: FeatureRequestCardProps) {
  const title = item.title ?? 'Untitled';
  const description = item.description ?? '';
  const createdAt = item.createdAt ?? 0;
  const likes = item.likes ?? {};
  const likeCount = Object.keys(likes).length;
  const hasLiked = currentUserId ? !!likes[currentUserId] : false;
  const canLike = currentUserId && item.userId !== currentUserId;
  const isCreator = currentUserId && item.userId === currentUserId;
  const [liking, setLiking] = React.useState(false);

  const handleLikePress = React.useCallback(() => {
    if (!canLike || liking) return;
    setLiking(true);
    onLikeToggle(id).finally(() => setLiking(false));
  }, [canLike, id, liking, onLikeToggle]);

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
        {isCreator ? (
          <View style={styles.creatorActions}>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => onEdit(id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit request"
            >
              <Ionicons name="pencil-outline" size={18} color={Colors.icon} />
              <Text style={styles.cardActionLabel}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cardActionButton}
              onPress={() => onDelete(id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Remove request"
            >
              <Ionicons name="trash-outline" size={18} color={Colors.icon} />
              <Text style={styles.cardActionLabel}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {/* Only non-creators can like; creator sees read-only like count */}
        {isCreator ? (
          <View style={styles.likeButton}>
            <Ionicons name="heart-outline" size={18} color={Colors.icon} />
            <Text style={styles.likeCount}>{likeCount}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.likeButton, hasLiked && styles.likeButtonActive]}
            onPress={handleLikePress}
            disabled={liking}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={hasLiked ? 'Unlike request' : 'Like request'}
          >
            <Ionicons
              name={hasLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={hasLiked ? '#ff6b6b' : Colors.icon}
            />
            <Text style={[styles.likeCount, hasLiked && styles.likeCountActive]}>
              {likeCount}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const FEATURE_REQUESTS_PATH = 'featureRequests';

function buildListFromData(data: Record<string, FeatureRequestItem> | null): { id: string; item: FeatureRequestItem }[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  return Object.entries(data)
    .filter((entry): entry is [string, FeatureRequestItem] => {
      const item = entry[1];
      return item != null && typeof item === 'object';
    })
    .map(([id, item]) => ({ id, item }))
    .sort((a, b) => {
      const na = typeof a.item?.createdAt === 'number' && !Number.isNaN(a.item.createdAt) ? a.item.createdAt : 0;
      const nb = typeof b.item?.createdAt === 'number' && !Number.isNaN(b.item.createdAt) ? b.item.createdAt : 0;
      return nb - na;
    });
}

type ErrorBoundaryState = { hasError: boolean; error?: Error };

class FeatureRequestsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ThemedView style={styles.container}>
          <View style={[styles.emptyState, { flex: 1, justifyContent: 'center' }]}>
            <Ionicons name="alert-circle-outline" size={64} color={Colors.icon} />
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptySubtitle}>
              {this.state.error?.message ?? 'Failed to load feature requests.'}
            </Text>
          </View>
        </ThemedView>
      );
    }
    return this.props.children;
  }
}

function FeatureRequestsScreenInner() {
  const { user } = useAuth();
  const tabBarInset = useTabSceneBottomInset();
  const refreshGuard = usePullToRefreshGuard();
  const [list, setList] = React.useState<{ id: string; item: FeatureRequestItem }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<Error | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingRequestId, setEditingRequestId] = React.useState<string | null>(null);
  const [titleInput, setTitleInput] = React.useState('');
  const [subtitleInput, setSubtitleInput] = React.useState('');

  const fetchFeatureRequests = React.useCallback(async () => {
    const raw = await restGet<Record<string, FeatureRequestItem>>(FEATURE_REQUESTS_PATH);
    setList(buildListFromData(raw ?? null));
    setError(null);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      fetchFeatureRequests()
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setList([]);
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [fetchFeatureRequests])
  );

  const onRefresh = React.useCallback(async () => {
    refreshGuard.suppressPresses();
    setRefreshing(true);
    setError(null);
    try {
      const raw = await restGet<Record<string, FeatureRequestItem>>(FEATURE_REQUESTS_PATH);
      setList(buildListFromData(raw ?? null));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setRefreshing(false);
    }
  }, [refreshGuard]);

  const openAddModal = React.useCallback(() => {
    if (refreshGuard.shouldIgnorePress() || refreshing) {
      return;
    }
    setEditingRequestId(null);
    setTitleInput('');
    setSubtitleInput('');
    setSaveError(null);
    setShowAddModal(true);
  }, [refreshGuard, refreshing]);
  const closeAddModal = React.useCallback(() => {
    setShowAddModal(false);
    setEditingRequestId(null);
    setTitleInput('');
    setSubtitleInput('');
    setSaveError(null);
  }, []);

  const openEditModal = React.useCallback((requestId: string) => {
    if (refreshGuard.shouldIgnorePress() || refreshing) {
      return;
    }
    const entry = list.find((x) => x.id === requestId);
    if (!entry) return;
    setEditingRequestId(requestId);
    setTitleInput(entry.item.title ?? '');
    setSubtitleInput(entry.item.description ?? '');
    setSaveError(null);
    setShowAddModal(true);
  }, [list, refreshGuard, refreshing]);

  const handleSaveRequest = React.useCallback(async () => {
    const title = titleInput.trim();
    const description = subtitleInput.trim();
    if (!title || !user?.uid) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      if (editingRequestId) {
        const ok = await restPatch(`${FEATURE_REQUESTS_PATH}/${editingRequestId}`, {
          title,
          description: description || undefined,
        });
        if (!ok) {
          setSaveError(new Error('Failed to update'));
          return;
        }
      } else {
        const payload: Record<string, unknown> = {
          title,
          createdAt: Date.now(),
          userId: user.uid,
        };
        if (description) {
          payload.description = description;
        }
        if (user.displayName) {
          payload.userName = user.displayName;
        }
        const key = await restPush(FEATURE_REQUESTS_PATH, payload);
        if (key == null) {
          setSaveError(new Error('Failed to save'));
          return;
        }
      }
      closeAddModal();
      await fetchFeatureRequests();
    } catch (err) {
      setSaveError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSaving(false);
    }
  }, [closeAddModal, editingRequestId, titleInput, subtitleInput, user, fetchFeatureRequests]);

  const handleDeleteRequest = React.useCallback(
    (requestId: string) => {
      if (refreshGuard.shouldIgnorePress() || refreshing) {
        return;
      }
      Alert.alert(
        'Remove request',
        'Are you sure you want to remove this feature request?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const ok = await restDelete(`${FEATURE_REQUESTS_PATH}/${requestId}`);
              if (ok) await fetchFeatureRequests();
            },
          },
        ]
      );
    },
    [fetchFeatureRequests, refreshGuard, refreshing]
  );

  const handleLikeToggle = React.useCallback(
    async (requestId: string) => {
      if (refreshGuard.shouldIgnorePress() || refreshing) {
        return;
      }
      const item = list.find((x) => x.id === requestId)?.item;
      if (!item || !user?.uid) return;
      const hasLiked = !!(item.likes && item.likes[user.uid]);
      const path = `${FEATURE_REQUESTS_PATH}/${requestId}/likes/${user.uid}`;
      if (hasLiked) {
        await restDelete(path);
      } else {
        await restPut(path, true);
      }
      await fetchFeatureRequests();
    },
    [list, user?.uid, fetchFeatureRequests, refreshGuard, refreshing]
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + tabBarInset },
          list.length === 0 && !isLoading && styles.scrollContentCentered,
        ]}
        showsVerticalScrollIndicator={false}
        {...refreshGuard.scrollProps}
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
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color={Colors.icon} />
            <Text style={styles.emptyTitle}>Could not load feature requests</Text>
            <Text style={styles.emptySubtitle}>{error.message}</Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={64} color={Colors.icon} />
            <Text style={styles.emptyTitle}>No feature requests yet</Text>
            <Text style={styles.emptySubtitle}>
              Add the first feature request or wait for others to appear here.
            </Text>
            <PrimaryButton
              onPress={openAddModal}
              style={styles.addButton}
            >
              Add request
            </PrimaryButton>
          </View>
        ) : (
          <View style={styles.list}>
            {list.map(({ id, item }) => (
              <FeatureRequestCard
                key={id}
                id={id}
                item={item}
                currentUserId={user?.uid}
                onLikeToggle={handleLikeToggle}
                onEdit={openEditModal}
                onDelete={handleDeleteRequest}
              />
            ))}
          </View>
        )}
      </ScrollView>
      {list.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: 16 + tabBarInset }]}>
          <PrimaryButton onPress={openAddModal} style={styles.addButtonBottom}>
            Add request
          </PrimaryButton>
        </View>
      )}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={closeAddModal}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalKeyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalHeaderTitle}>
                {editingRequestId ? 'Edit request' : 'New feature request'}
              </Text>
              <Text style={styles.modalLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                value={titleInput}
                onChangeText={setTitleInput}
                placeholder="e.g. Dark mode support"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="sentences"
              />
              <Text style={styles.modalLabel}>Subtitle</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                value={subtitleInput}
                onChangeText={setSubtitleInput}
                placeholder="Brief description of your request"
                placeholderTextColor={Colors.placeholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {saveError ? (
                <Text style={styles.modalError}>{saveError.message}</Text>
              ) : null}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeAddModal}
                  activeOpacity={0.8}
                  disabled={isSaving}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
                <PrimaryButton
                  onPress={handleSaveRequest}
                  style={styles.modalSaveButton}
                  disabled={isSaving || !titleInput.trim()}
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </PrimaryButton>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

export default function FeatureRequestsScreen() {
  return (
    <FeatureRequestsErrorBoundary>
      <FeatureRequestsScreenInner />
    </FeatureRequestsErrorBoundary>
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
  loadingText: {
    color: Colors.icon,
    fontSize: 16,
    fontFamily: defaultFontFamily,
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
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  addButtonBottom: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalKeyboardAvoid: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalHeaderTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: defaultFontFamily,
  },
  modalLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: defaultFontFamily,
  },
  modalInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.icon,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    fontFamily: defaultFontFamily,
  },
  modalInputMultiline: {
    minHeight: 80,
    paddingTop: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCloseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: defaultFontFamily,
  },
  modalSaveButton: {
    flex: 1,
  },
  modalError: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
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
  creatorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cardActionLabel: {
    color: Colors.icon,
    fontSize: 14,
    fontFamily: defaultFontFamily,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginLeft: 'auto',
  },
  likeButtonActive: {},
  likeCount: {
    color: Colors.icon,
    fontSize: 14,
    fontFamily: defaultFontFamily,
  },
  likeCountActive: {
    color: '#ff6b6b',
  },
});
