import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import React from 'react';
import {
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

const DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL;

// Read data via REST API (same pattern as userInput, history, waitingRoom, etc.)
async function readViaRest<T>(path: string): Promise<T | null> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) return null;
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data as T;
  } catch {
    return null;
  }
}

// Push new entry via REST API (same pattern as userInput pushViaRest)
async function pushViaRest<T>(path: string, data: T): Promise<string | null> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) return null;
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result.name ?? null;
  } catch {
    return null;
  }
}

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
  const [list, setList] = React.useState<{ id: string; item: FeatureRequestItem }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<Error | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState('');
  const [subtitleInput, setSubtitleInput] = React.useState('');

  const fetchFeatureRequests = React.useCallback(async () => {
    const raw = await readViaRest<Record<string, FeatureRequestItem>>(FEATURE_REQUESTS_PATH);
    setList(buildListFromData(raw ?? null));
    setError(null);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    readViaRest<Record<string, FeatureRequestItem>>(FEATURE_REQUESTS_PATH)
      .then((raw) => {
        if (!cancelled) {
          setList(buildListFromData(raw ?? null));
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setList([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const raw = await readViaRest<Record<string, FeatureRequestItem>>(FEATURE_REQUESTS_PATH);
      setList(buildListFromData(raw ?? null));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const openAddModal = React.useCallback(() => {
    setSaveError(null);
    setShowAddModal(true);
  }, []);
  const closeAddModal = React.useCallback(() => {
    setShowAddModal(false);
    setTitleInput('');
    setSubtitleInput('');
    setSaveError(null);
  }, []);

  const handleSaveRequest = React.useCallback(async () => {
    const title = titleInput.trim();
    const description = subtitleInput.trim();
    if (!title) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const key = await pushViaRest(FEATURE_REQUESTS_PATH, {
        title,
        description: description || undefined,
        createdAt: Date.now(),
        userId: user?.uid ?? undefined,
        userName: user?.displayName ?? undefined,
        status: 'pending',
      });
      if (key == null) {
        setSaveError(new Error('Failed to save'));
        return;
      }
      closeAddModal();
      await fetchFeatureRequests();
    } catch (err) {
      setSaveError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSaving(false);
    }
  }, [closeAddModal, titleInput, subtitleInput, user, fetchFeatureRequests]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          list.length === 0 && !isLoading && styles.scrollContentCentered,
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
              <FeatureRequestCard key={id} id={id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
      {list.length > 0 && (
        <View style={styles.bottomBar}>
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
              <Text style={styles.modalHeaderTitle}>New feature request</Text>
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
    paddingTop: 136,
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
    paddingBottom: 40,
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
