import { Ionicons } from '@expo/vector-icons';
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
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState('');
  const [subtitleInput, setSubtitleInput] = React.useState('');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const openAddModal = React.useCallback(() => setShowAddModal(true), []);
  const closeAddModal = React.useCallback(() => {
    setShowAddModal(false);
    setTitleInput('');
    setSubtitleInput('');
  }, []);

  const handleSaveRequest = React.useCallback(() => {
    // TODO: submit titleInput + subtitleInput to backend when connected
    closeAddModal();
  }, [closeAddModal]);

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
            <PrimaryButton
              onPress={openAddModal}
              style={styles.addButton}
            >
              Add request
            </PrimaryButton>
          </View>
        ) : (
          <View style={styles.list}>
            {MOCK_LIST.map(({ id, item }) => (
              <FeatureRequestCard key={id} id={id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
      {MOCK_LIST.length > 0 && (
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
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeAddModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
                <PrimaryButton
                  onPress={handleSaveRequest}
                  style={styles.modalSaveButton}
                >
                  Save
                </PrimaryButton>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
