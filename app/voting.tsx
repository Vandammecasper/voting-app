import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL;

interface Participant {
  name: string;
  joinedAt: number;
  isCreator: boolean;
}

type ParticipantsData = Record<string, Participant>;

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

// Helper to write data using REST API
async function writeViaRest<T>(path: string, data: T): Promise<boolean> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return false;
    }
    
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ REST write error:`, error);
    return false;
  }
}

// Animated Chevron Icon component
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

function AnimatedChevron({ isOpen }: { isOpen: boolean }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isOpen ? 180 : 0, { duration: 200 });
  }, [isOpen, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <AnimatedIonicons 
      name="chevron-down" 
      size={20} 
      color={Colors.icon} 
      style={animatedStyle}
    />
  );
}

// Dropdown component with inline expanding list
interface DropdownProps {
  value: string;
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
}

function Dropdown({ value, options, placeholder, onSelect }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Pressable 
        style={[styles.dropdown, isOpen && styles.dropdownOpen]} 
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {value || placeholder}
        </Text>
        <AnimatedChevron isOpen={isOpen} />
      </Pressable>

      {isOpen && (
        <View style={styles.dropdownList}>
          <ScrollView 
            style={styles.dropdownScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={Platform.OS === 'android'}
          >
            {options.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.dropdownItem,
                  value === option && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  value === option && styles.dropdownItemTextSelected,
                ]}>
                  {option}
                </Text>
                {value === option && (
                  <Ionicons name="checkmark" size={18} color="#6E92FF" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function VotingScreen() {
  const { voteId, from } = useLocalSearchParams<{ voteId: string; from?: string }>();
  const { user } = useAuth();
  
  const [mvpName, setMvpName] = useState('');
  const [mvpComment, setMvpComment] = useState('');
  const [loserName, setLoserName] = useState('');
  const [loserComment, setLoserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // Fetch participants on mount
  useEffect(() => {
    async function fetchParticipants() {
      if (!voteId) return;
      
      const participants = await readViaRest<ParticipantsData>(`participants/${voteId}`);
      if (participants) {
        const names = Object.values(participants).map(p => p.name);
        setParticipantNames(names);
      }
    }
    
    fetchParticipants();
  }, [voteId]);

  const handleSubmit = async () => {
    if (!mvpName) {
      Alert.alert('Error', 'Please select the MVP');
      return;
    }
    
    if (!mvpComment.trim()) {
      Alert.alert('Error', 'Please add a comment for the MVP');
      return;
    }
    
    if (!loserName) {
      Alert.alert('Error', 'Please select the loser');
      return;
    }
    
    if (!loserComment.trim()) {
      Alert.alert('Error', 'Please add a comment for the loser');
      return;
    }
    
    if (!user || !voteId) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user has already voted
      const existingVote = await readViaRest(`votes/${voteId}/${user.uid}`);
      if (existingVote) {
        Alert.alert('Already Voted', 'You have already submitted your vote.');
        // Navigate to waiting screen since they already voted
        router.replace({
          pathname: '/votingWaiting',
          params: { voteId, from },
        });
        return;
      }

      const voteData = {
        mvpName: mvpName.trim(),
        mvpComment: mvpComment.trim(),
        loserName: loserName.trim(),
        loserComment: loserComment.trim(),
        submittedAt: Date.now(),
      };

      const success = await writeViaRest(`votes/${voteId}/${user.uid}`, voteData);
      
      if (!success) {
        Alert.alert('Error', 'Failed to submit vote. Please try again.');
        return;
      }

      // Navigate to voting waiting screen
      router.replace({
        pathname: '/votingWaiting',
        params: { voteId, from },
      });
    } catch (error) {
      console.error('❌ Error submitting vote:', error);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    router.replace('/');
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.exitButton}
        onPress={handleExit}
        activeOpacity={0.6}
      >
        <Ionicons name="close" size={28} color={Colors.icon} style={{ opacity: 0.5 }} />
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollRef}
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
        >
        <GradientText 
          text="Your vote" 
          style={styles.title}
        />

        {/* MVP Section */}
        <Text style={styles.sectionLabel}>Your MVP of the match</Text>
        <Dropdown
          value={mvpName}
          options={participantNames}
          placeholder="Select the match MVP"
          onSelect={setMvpName}
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
          onFocus={() => {
            setTimeout(() => scrollRef.current?.scrollTo({ y: 180, animated: true }), 150);
          }}
        />

        {/* Loser Section */}
        <Text style={styles.sectionLabel}>Your loser of the match</Text>
        <Dropdown
          value={loserName}
          options={participantNames}
          placeholder="Select the match loser"
          onSelect={setLoserName}
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
          onFocus={() => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
          }}
        />
      </ScrollView>

        {/* Send vote button - fixed at bottom */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            onPress={handleSubmit}
            disabled={isSubmitting || !mvpName || !mvpComment.trim() || !loserName || !loserComment.trim()}
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          >
            {isSubmitting ? 'Submitting...' : 'Send vote'}
          </PrimaryButton>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: defaultFontFamily,
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
    height: 48,
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
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  submitButton: {
    marginHorizontal: 0,
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: defaultFontFamily,
  },
  // Dropdown styles
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
    fontFamily: defaultFontFamily,
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
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(110, 146, 255, 0.1)',
  },
  dropdownItemText: {
    color: Colors.text,
    fontSize: 16,
  },
  dropdownItemTextSelected: {
    color: '#6E92FF',
    fontWeight: '500',
  },
  exitButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 1000,
    padding: 8,
  },
});
