import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, defaultFontFamily } from '@/constants/theme';
import { VoteDraftInput } from '@/services/voteDraftStorage';

type VoteType = 'mvpOnly' | 'mvpAndLoser';
type DraftDropdownField = 'mvp' | 'loser';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
const DISMISS_DRAG_DISTANCE = 90;
const HIDDEN_PANEL_TRANSLATE_Y = 700;
const AUTOSAVE_DEBOUNCE_MS = 600;

interface DraftDropdownProps {
  value: string;
  options: string[];
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (value: string) => void;
}

function DraftDropdown({ value, options, placeholder, isOpen, onToggle, onClose, onSelect }: DraftDropdownProps) {
  return (
    <View style={styles.dropdownContainer}>
      <Pressable style={[styles.dropdown, isOpen && styles.dropdownOpen]} onPress={onToggle}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.icon} />
      </Pressable>

      {isOpen && Platform.OS !== 'android' && (
        <View style={styles.dropdownList}>
          <ScrollView
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {options.length > 0 ? (
              options.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.dropdownItem, value === option && styles.dropdownItemSelected]}
                  onPress={() => onSelect(option)}
                >
                  <Text style={[styles.dropdownItemText, value === option && styles.dropdownItemTextSelected]}>
                    {option}
                  </Text>
                  {value === option && <Ionicons name="checkmark" size={18} color="#6E92FF" />}
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyOptionsText}>Waiting for participants...</Text>
            )}
          </ScrollView>
        </View>
      )}

      {Platform.OS === 'android' && (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={onClose}
        >
          <View style={styles.dropdownModalOverlay}>
            <Pressable style={styles.dropdownModalBackdrop} onPress={onClose} />
            <View style={styles.dropdownModalCard}>
              <ScrollView
                style={styles.dropdownModalScroll}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {options.length > 0 ? (
                  options.map((option) => (
                    <Pressable
                      key={option}
                      style={[styles.dropdownItem, value === option && styles.dropdownItemSelected]}
                      onPress={() => onSelect(option)}
                    >
                      <Text style={[styles.dropdownItemText, value === option && styles.dropdownItemTextSelected]}>
                        {option}
                      </Text>
                      {value === option && <Ionicons name="checkmark" size={18} color="#6E92FF" />}
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.emptyOptionsText}>Waiting for participants...</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

interface VoteDraftPanelProps {
  visible: boolean;
  participantNames: string[];
  voteType: VoteType;
  initialDraft: VoteDraftInput;
  onClose: () => void;
  onSave: (draft: VoteDraftInput) => Promise<void>;
}

export function VoteDraftPanel({
  visible,
  participantNames,
  voteType,
  initialDraft,
  onClose,
  onSave,
}: VoteDraftPanelProps) {
  const [mvpName, setMvpName] = useState(initialDraft.mvpName);
  const [mvpComment, setMvpComment] = useState(initialDraft.mvpComment);
  const [loserName, setLoserName] = useState(initialDraft.loserName);
  const [loserComment, setLoserComment] = useState(initialDraft.loserComment);
  const [openDropdown, setOpenDropdown] = useState<DraftDropdownField | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(HIDDEN_PANEL_TRANSLATE_Y)).current;
  const lastSavedDraftKeyRef = useRef<string | null>(null);
  const wasVisibleRef = useRef(false);

  const currentDraft = useMemo<VoteDraftInput>(
    () => ({
      mvpName,
      mvpComment,
      loserName: voteType === 'mvpAndLoser' ? loserName : '',
      loserComment: voteType === 'mvpAndLoser' ? loserComment : '',
    }),
    [loserComment, loserName, mvpComment, mvpName, voteType]
  );
  const currentDraftKey = useMemo(() => JSON.stringify(currentDraft), [currentDraft]);

  const getInitialDraftKey = useCallback(
    () =>
      JSON.stringify({
        mvpName: initialDraft.mvpName,
        mvpComment: initialDraft.mvpComment,
        loserName: voteType === 'mvpAndLoser' ? initialDraft.loserName : '',
        loserComment: voteType === 'mvpAndLoser' ? initialDraft.loserComment : '',
      }),
    [initialDraft, voteType]
  );

  const saveDraftNow = useCallback(async () => {
    if (lastSavedDraftKeyRef.current === currentDraftKey) {
      return;
    }

    setSaveStatus('saving');
    try {
      await onSave(currentDraft);
      lastSavedDraftKeyRef.current = currentDraftKey;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [currentDraft, currentDraftKey, onSave]);

  const resetPanelPosition = useCallback(() => {
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [sheetTranslateY]);

  const closePanel = useCallback(() => {
    void saveDraftNow();
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: HIDDEN_PANEL_TRANSLATE_Y,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false);
      sheetTranslateY.setValue(HIDDEN_PANEL_TRANSLATE_Y);
      backdropOpacity.setValue(0);
      onClose();
    });
  }, [backdropOpacity, onClose, saveDraftNow, sheetTranslateY]);

  const panelPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          sheetTranslateY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > DISMISS_DRAG_DISTANCE || gestureState.vy > 0.7) {
            closePanel();
            return;
          }

          resetPanelPosition();
        },
        onPanResponderTerminate: resetPanelPosition,
      }),
    [closePanel, resetPanelPosition, sheetTranslateY]
  );

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      return;
    }

    if (wasVisibleRef.current) {
      return;
    }

    wasVisibleRef.current = true;
    setIsMounted(true);
    setMvpName(initialDraft.mvpName);
    setMvpComment(initialDraft.mvpComment);
    setLoserName(initialDraft.loserName);
    setLoserComment(initialDraft.loserComment);
    setOpenDropdown(null);
    setSaveStatus('idle');
    lastSavedDraftKeyRef.current = getInitialDraftKey();
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(HIDDEN_PANEL_TRANSLATE_Y);

    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }),
      ]).start();
    });
  }, [backdropOpacity, getInitialDraftKey, initialDraft, sheetTranslateY, visible]);

  useEffect(() => {
    if (!visible || !isMounted || lastSavedDraftKeyRef.current === currentDraftKey) {
      return;
    }

    setSaveStatus('idle');
    const autosaveTimer = setTimeout(() => {
      void saveDraftNow();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(autosaveTimer);
    };
  }, [currentDraftKey, isMounted, saveDraftNow, visible]);

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      onRequestClose={closePanel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePanel} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View style={styles.dragArea} {...panelPanResponder.panHandlers}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
            <View style={styles.header}>
              <Text style={styles.title}>Draft your vote</Text>
              {saveStatus !== 'idle' && (
                <Text style={[styles.saveStatus, saveStatus === 'error' && styles.saveStatusError]}>
                  {saveStatus === 'saving'
                    ? 'Saving draft...'
                    : saveStatus === 'saved'
                      ? 'Draft saved'
                      : 'Could not save draft'}
                </Text>
              )}
            </View>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            scrollEnabled={!openDropdown}
          >
            <Text style={styles.sectionLabel}>Your MVP of the match</Text>
            <DraftDropdown
              value={mvpName}
              options={participantNames}
              placeholder="Select the match MVP"
              isOpen={openDropdown === 'mvp'}
              onToggle={() => setOpenDropdown(openDropdown === 'mvp' ? null : 'mvp')}
              onClose={() => setOpenDropdown(null)}
              onSelect={(value) => {
                setMvpName(value);
                setOpenDropdown(null);
              }}
            />

            <Text style={styles.sectionLabel}>MVP comment</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Why is this person the MVP?"
              placeholderTextColor={Colors.placeholder}
              value={mvpComment}
              onChangeText={setMvpComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {voteType === 'mvpAndLoser' && (
              <>
                <Text style={styles.sectionLabel}>Your loser of the match</Text>
                <DraftDropdown
                  value={loserName}
                  options={participantNames}
                  placeholder="Select the match loser"
                  isOpen={openDropdown === 'loser'}
                  onToggle={() => setOpenDropdown(openDropdown === 'loser' ? null : 'loser')}
                  onClose={() => setOpenDropdown(null)}
                  onSelect={(value) => {
                    setLoserName(value);
                    setOpenDropdown(null);
                  }}
                />

                <Text style={styles.sectionLabel}>Loser comment</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Why is this person the loser?"
                  placeholderTextColor={Colors.placeholder}
                  value={loserComment}
                  onChangeText={setLoserComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    maxHeight: '95%',
    minHeight: '84%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
  },
  dragArea: {
    marginBottom: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4A4A4A',
  },
  header: {
    paddingBottom: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
  saveStatus: {
    color: Colors.icon,
    fontSize: 13,
    marginTop: 6,
    fontFamily: defaultFontFamily,
  },
  saveStatusError: {
    color: '#FF8A8A',
  },
  formScroll: {
    flexGrow: 0,
  },
  formContent: {
    paddingBottom: 8,
  },
  sectionLabel: {
    color: '#D9D9D9',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
    fontFamily: defaultFontFamily,
  },
  input: {
    width: '100%',
    minHeight: 48,
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    borderColor: Colors.icon,
    borderWidth: 1,
    paddingHorizontal: 16,
    color: Colors.text,
    fontSize: 16,
    fontFamily: defaultFontFamily,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10,
  },
  dropdown: {
    width: '100%',
    height: 48,
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    borderColor: Colors.icon,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: {
    color: Colors.text,
    fontSize: 16,
    flex: 1,
    fontFamily: defaultFontFamily,
  },
  dropdownPlaceholder: {
    color: Colors.placeholder,
  },
  dropdownList: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    maxHeight: 180,
    backgroundColor: '#3a3a3a',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#4a4a4a',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownScroll: {
    flex: 1,
  },
  dropdownModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dropdownModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dropdownModalCard: {
    maxHeight: '60%',
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a4a4a',
    overflow: 'hidden',
  },
  dropdownModalScroll: {
    maxHeight: 360,
  },
  dropdownItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(110, 146, 255, 0.1)',
  },
  dropdownItemText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: defaultFontFamily,
  },
  dropdownItemTextSelected: {
    color: '#6E92FF',
    fontWeight: '500',
  },
  emptyOptionsText: {
    color: Colors.icon,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: defaultFontFamily,
  },
});
