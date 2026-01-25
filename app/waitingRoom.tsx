import auth from '@react-native-firebase/auth';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL;

// Tracks that we've shown the "Name Change Requested" alert for a participant so it
// isn't shown twice (e.g. from effect re-runs or Strict Mode remounts). Cleared when
// they resolve (submit, exit, or cancel).
const shownNameChangePromptKeys = new Set<string>();

// Helper to read data using REST API (silent version for polling)
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

// Helper to update data using REST API (PATCH for partial updates)
async function updateViaRest<T>(path: string, data: T): Promise<boolean> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return false;
    }
    
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return response.ok;
  } catch (error) {
    console.error('❌ REST update error:', error);
    return false;
  }
}

// Helper to delete data using REST API
async function deleteViaRest(path: string): Promise<boolean> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return false;
    }
    
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (error) {
    console.error('❌ REST delete error:', error);
    return false;
  }
}

// Hook to poll data using REST API
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

    // Initial fetch
    fetchData();

    // Set up polling interval
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [path, intervalMs]);

  return { data, isLoading };
}

const GRADIENT_COLORS = ['#6E92FF', '#90FF91'] as const;

// Loader gradient: purple -> blue -> green (a bit more purple)
const LOADER_GRADIENT = ['#A78BFA', '#6E92FF', '#90FF91'] as const;

// Bouncing dots loader in app gradient style
// Sequence: 1 → 2 → 3 → (brief gap) → 1 → … (no 3→2→1)
function WaitingLoader() {
  const d = 280;
  const gap = 100; // all dim before jumping back to 1
  const dot1 = useSharedValue(0.45);
  const dot2 = useSharedValue(0.45);
  const dot3 = useSharedValue(0.45);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: d }),
        withTiming(0.45, { duration: d }),
        withTiming(0.45, { duration: d }),
        withTiming(0.45, { duration: gap }),
      ),
      -1,
    );
    dot2.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: d }),
        withTiming(1, { duration: d }),
        withTiming(0.45, { duration: d }),
        withTiming(0.45, { duration: gap }),
      ),
      -1,
    );
    dot3.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: d }),
        withTiming(0.45, { duration: d }),
        withTiming(1, { duration: d }),
        withTiming(0.45, { duration: gap }),
      ),
      -1,
    );
  }, []);

  const style1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const style2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const style3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={loaderStyles.container}>
      <Animated.View style={[loaderStyles.dotWrapper, style1]}>
        <LinearGradient
          colors={LOADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={loaderStyles.dot}
        />
      </Animated.View>
      <Animated.View style={[loaderStyles.dotWrapper, style2]}>
        <LinearGradient
          colors={LOADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={loaderStyles.dot}
        />
      </Animated.View>
      <Animated.View style={[loaderStyles.dotWrapper, style3]}>
        <LinearGradient
          colors={LOADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={loaderStyles.dot}
        />
      </Animated.View>
    </View>
  );
}

const loaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
  },
  dotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

interface Participant {
  name: string;
  joinedAt: number;
  isCreator: boolean;
  nameChangeRequested?: boolean;
}

interface LobbyData {
  creatorId: string;
  creatorName: string;
  createdAt: number;
  status: string;
  code: string;
}

type ParticipantsData = Record<string, Participant>;

interface DisplayParticipant {
  id: string;
  name: string;
  isCreator: boolean;
  isOnline: boolean;
  nameChangeRequested?: boolean;
}

export default function WaitingRoomScreen() {
  const { voteId, from } = useLocalSearchParams<{ voteId: string; from?: string }>();
  const { user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showNameInputModal, setShowNameInputModal] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');
  const hasNavigated = useRef(false);

  // Copy lobby code to clipboard
  const handleCopyCode = async () => {
    if (!lobbyData?.code) return;
    
    await Clipboard.setStringAsync(lobbyData.code);
    setIsCopied(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  // Poll lobby data using REST API (avoids SDK crashes)
  const { data: lobbyData } = usePolledData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000 // Poll every 2 seconds
  );
  
  // Poll participants data using REST API
  const { data: participantsData } = usePolledData<ParticipantsData>(
    voteId ? `participants/${voteId}` : null,
    2000 // Poll every 2 seconds
  );

  // Check if current user is the creator
  const isCreator = user && lobbyData && user.uid === lobbyData.creatorId;

  // Navigate to voting screen when status changes to 'voting'
  useEffect(() => {
    if (lobbyData?.status === 'voting' && voteId && !hasNavigated.current) {
      hasNavigated.current = true;
      router.replace({
        pathname: '/voting',
        params: { voteId, from },
      });
    }
  }, [lobbyData?.status, voteId, from]);

  // Track if user was previously in the lobby (to detect removal)
  const wasInLobby = useRef(false);

  // Detect if current user has been removed from the lobby
  useEffect(() => {
    // Skip if no user or already navigated
    if (!user || hasNavigated.current) {
      return;
    }

    // Creators can't be removed, skip check for them
    if (isCreator) {
      return;
    }

    // Check if user is currently in the participants list
    const participantIds = participantsData ? Object.keys(participantsData) : [];
    const isCurrentlyInLobby = participantIds.includes(user.uid);

    // If user is in lobby, mark them as being in the lobby
    if (isCurrentlyInLobby) {
      wasInLobby.current = true;
      return;
    }

    // If user was in lobby but is no longer (and we have participant data), they've been removed
    if (wasInLobby.current && participantsData && !isCurrentlyInLobby) {
      hasNavigated.current = true;
      const lobbyId = voteId;
      Alert.alert(
        'Removed from Lobby',
        'You have been removed from the lobby by the host.',
        [
          {
            text: 'OK',
            onPress: async () => {
              if (lobbyId && user) await deleteViaRest(`userHistory/${user.uid}/${lobbyId}`);
              router.replace('/');
            },
          },
        ]
      );
    }
  }, [participantsData, user, isCreator, voteId]);

  // Detect if host has requested a name change for the current user
  useEffect(() => {
    if (!user || !participantsData || !voteId || isCreator) return;

    const myData = participantsData[user.uid];
    if (!myData?.nameChangeRequested) return;

    const key = `${voteId}-${user.uid}`;
    if (shownNameChangePromptKeys.has(key)) return;

    shownNameChangePromptKeys.add(key);
    setNewNameInput(myData.name); // Pre-fill with current name

    Alert.alert(
      'Name Change Requested',
      'The host has requested that you change your name.',
      [
        {
          text: 'Exit Lobby',
          style: 'destructive',
          onPress: async () => {
            shownNameChangePromptKeys.delete(key);
            await deleteViaRest(`participants/${voteId}/${user.uid}`);
            await deleteViaRest(`userHistory/${user.uid}/${voteId}`);
            router.replace('/');
          },
        },
        {
          text: 'Change Name',
          onPress: () => {
            setShowNameInputModal(true);
          },
        },
      ],
      { cancelable: false }
    );
  }, [participantsData, user, isCreator, voteId]);

  // Handle submitting the new name from the modal
  const handleSubmitNewName = async () => {
    if (!user || !voteId) return;

    if (!newNameInput || newNameInput.trim().length === 0) {
      Alert.alert('Error', 'Please enter a valid name.');
      return;
    }

    const currentName = (participantsData?.[user.uid]?.name ?? '').trim();
    if (newNameInput.trim() === currentName) {
      Alert.alert('Error', 'Please enter a different name. The new name cannot be the same as your current name.');
      return;
    }
    
    // Update name and clear the request flag
    const success = await updateViaRest(`participants/${voteId}/${user.uid}`, {
      name: newNameInput.trim(),
      nameChangeRequested: false,
    });
    
    if (success) {
      setShowNameInputModal(false);
      shownNameChangePromptKeys.delete(`${voteId}-${user.uid}`);
    } else {
      Alert.alert('Error', 'Failed to update name. Please try again.');
    }
  };

  // Handle canceling the name change modal
  const handleCancelNameChange = () => {
    setShowNameInputModal(false);
    if (voteId && user) shownNameChangePromptKeys.delete(`${voteId}-${user.uid}`);
  };

  // Handle tapping on a participant (creator only) - shows action options
  const handleParticipantPress = (participant: DisplayParticipant) => {
    if (!isCreator || !voteId || participant.isCreator) return;

    Alert.alert(
      participant.name,
      'What would you like to do?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Request Name Change',
          onPress: async () => {
            const success = await updateViaRest(`participants/${voteId}/${participant.id}`, {
              nameChangeRequested: true,
            });
            if (!success) {
              Alert.alert('Error', 'Failed to send name change request. Please try again.');
            }
          },
        },
        {
          text: 'Remove from Lobby',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteViaRest(`participants/${voteId}/${participant.id}`);
            if (!success) {
              Alert.alert('Error', 'Failed to remove participant. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle start voting button
  const handleStartVoting = async () => {
    if (!voteId || !isCreator) return;

    setIsStarting(true);
    try {
      const success = await updateViaRest(`lobbies/${voteId}`, { status: 'voting' });
      
      if (!success) {
        Alert.alert('Error', 'Failed to start voting. Please try again.');
        setIsStarting(false);
        return;
      }
      // Navigation will happen automatically via the useEffect when status changes
    } catch (error) {
      console.error('❌ Error starting voting:', error);
      Alert.alert('Error', 'Failed to start voting. Please try again.');
      setIsStarting(false);
    }
  };

  // Build participants list: newest first, host always at the end
  const participants: DisplayParticipant[] = React.useMemo(() => {
    try {
      const result: DisplayParticipant[] = [];
      
      if (!lobbyData) {
        return result;
      }
      
      const hostInParticipants = participantsData 
        ? Object.keys(participantsData).includes(lobbyData.creatorId)
        : false;
      
      // Add other participants (excluding the host), newest first
      if (participantsData) {
        const others = Object.entries(participantsData)
          .filter(([id, p]) => id !== lobbyData.creatorId && p?.name)
          .sort(([, a], [, b]) => (b?.joinedAt ?? 0) - (a?.joinedAt ?? 0));
        others.forEach(([id, participant]) => {
          if (participant) {
            result.push({
              id,
              name: participant.name,
              isCreator: false,
              isOnline: true,
              nameChangeRequested: participant.nameChangeRequested || false,
            });
          }
        });
      }
      
      // Always add host at the end
      result.push({
        id: lobbyData.creatorId,
        name: lobbyData.creatorName || 'Host',
        isCreator: true,
        isOnline: hostInParticipants,
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error building participants list:', error);
      return [];
    }
  }, [lobbyData, participantsData]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topSection}>
        <SecondaryButton style={{ marginHorizontal: 56 }} textStyle={{ fontSize: 16, fontWeight: 'bold' }} onPress={handleCopyCode}>
          {isCopied ? 'Copied!' : `ID: ${lobbyData?.code || 'Loading...'}`}
        </SecondaryButton>
      </View>

      <View style={styles.centerSection}>
        <Text style={{ fontSize: 40, fontWeight: 'bold', textAlign: 'center', color: '#D9D9D9', fontFamily: defaultFontFamily }}>
          Waiting for others to join
        </Text>
        <WaitingLoader />
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={{ x: 0.42, y: 0.1 }}
          end={{ x: 0.5, y: 1.75 }}
          style={styles.boxBorder}
        >
          <View style={styles.boxInner}>
            <Text style={styles.boxTitle}>Waiting room</Text>
            <ScrollView style={styles.participantsScroll} contentContainerStyle={styles.participantsGrid}>
              {participants.length > 0 ? (
                participants.map((participant) => {
                  const canRemove = isCreator && !participant.isCreator;
                  const content = (
                    <Text 
                      style={[
                        styles.participantName,
                        participant.isCreator && styles.creatorName,
                        !participant.isOnline && styles.offlineName,
                        participant.nameChangeRequested && styles.nameChangeRequestedName,
                      ]}
                    >
                      {participant.name}{participant.isCreator ? ' 👑' : ''}
                    </Text>
                  );

                  if (canRemove) {
                    return (
                      <TouchableOpacity
                        key={participant.id}
                        style={styles.participantWrapper}
                        onPress={() => handleParticipantPress(participant)}
                        activeOpacity={0.6}
                      >
                        {content}
                      </TouchableOpacity>
                    );
                  }

                  return <View key={participant.id} style={styles.participantWrapper}>{content}</View>;
                })
              ) : (
                <Text style={styles.participantName}>Waiting for participants...</Text>
              )}
            </ScrollView>
          </View>
        </LinearGradient>

        <Text style={styles.waitingCount}>
          {participants.filter(p => p.isOnline).length} {participants.filter(p => p.isOnline).length === 1 ? 'person is' : 'people are'} waiting
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.buttonContainer}>
          {isCreator && (
            <PrimaryButton 
              style={{ marginHorizontal: 24 }} 
              textStyle={{ fontSize: 24, fontWeight: 'bold' }} 
              onPress={handleStartVoting}
              disabled={isStarting}
            >
              {isStarting ? 'Starting...' : 'start voting'}
            </PrimaryButton>
          )}
          <SecondaryButton style={{ marginHorizontal: 24 }} textStyle={{ fontSize: 18 }} onPress={() => router.replace('/')}>exit vote</SecondaryButton>
        </View>
      </View>

      {/* Name Change Modal - Cross-platform (iOS + Android) */}
      <Modal
        visible={showNameInputModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelNameChange}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalKeyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter New Name</Text>
              <Text style={styles.modalSubtitle}>Please enter your new name:</Text>
              <TextInput
                style={styles.modalInput}
                value={newNameInput}
                onChangeText={setNewNameInput}
                placeholder="Your name"
                placeholderTextColor={Colors.placeholder}
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalButtonCancel} 
                  onPress={handleCancelNameChange}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButtonSubmit} 
                  onPress={handleSubmitNewName}
                >
                  <Text style={styles.modalButtonSubmitText}>Submit</Text>
                </TouchableOpacity>
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
    paddingHorizontal: 24,
  },
  topSection: {
    paddingTop: 80,
    width: '100%',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bottomSection: {
    width: '100%',
    paddingBottom: 40,
  },
  boxBorder: {
    borderRadius: 20,
    padding: 2,
    marginTop: 36,
    width: '100%',
  },
  boxInner: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  boxTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#6E92FF',
    fontFamily: defaultFontFamily,
  },
  participantsScroll: {
    height: 220,
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  participantWrapper: {
    width: '33%',
  },
  participantName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: defaultFontFamily,
  },
  creatorName: {
    fontWeight: '700',
    fontFamily: defaultFontFamily,
  },
  offlineName: {
    opacity: 0.4,
    fontFamily: defaultFontFamily,
  },
  nameChangeRequestedName: {
    opacity: 0.5,
    fontStyle: 'italic',
    fontFamily: defaultFontFamily,
  },
  waitingCount: {
    color: Colors.icon,
    fontSize: 16,
    marginTop: 16,
    fontFamily: defaultFontFamily,
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
    gap: 16,
  },
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
  modalTitle: {
    color: '#D9D9D9',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: defaultFontFamily,
  },
  modalSubtitle: {
    color: '#D9D9D9',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: defaultFontFamily,
  },
  modalInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderColor: Colors.icon,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
    fontFamily: defaultFontFamily,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: defaultFontFamily,
  },
  modalButtonSubmit: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#6E92FF',
    alignItems: 'center',
  },
  modalButtonSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: defaultFontFamily,
  },
});
