import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { JoinRequestsHost, JoinRequestsMap } from '@/components/join-requests-panel';
import { ScreenBackButton } from '@/components/screen-back-button';
import { SelectDropdown } from '@/components/select-dropdown';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePolledRestData } from '@/hooks/usePolledRestData';
import { useVoteRouteParams } from '@/hooks/useVoteRouteParams';
import { normalizeMemberList } from '@/services/teams';
import { restGet, restUpdatePaths } from '@/services/firebaseRest';
import { isPublishedRankingStatus, isResultsStatus } from '@/services/lobbyFlow';
import { mvpVoteOptions } from '@/services/voteOptions';
import { loadVoteDraft, removeVoteDraft } from '@/services/voteDraftStorage';

interface Participant {
  name: string;
  joinedAt: number;
}

type ParticipantsData = Record<string, Participant>;

interface LobbyData {
  creatorId: string;
  creatorName: string;
  createdAt: number;
  status: string;
  code: string;
  voteType?: 'mvpOnly' | 'mvpAndLoser'; // Optional for backward compatibility
  teamName?: string;
  teamMembers?: string[] | Record<string, string>;
}

export default function VotingScreen() {
  const { voteId, from } = useVoteRouteParams();
  const { user } = useAuth();
  
  const [mvpName, setMvpName] = useState('');
  const [mvpComment, setMvpComment] = useState('');
  const [loserName, setLoserName] = useState('');
  const [loserComment, setLoserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [myName, setMyName] = useState('');
  const [voteType, setVoteType] = useState<'mvpOnly' | 'mvpAndLoser'>('mvpAndLoser');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [openDropdownCount, setOpenDropdownCount] = useState(0);
  const [lobbyCode, setLobbyCode] = useState<string | undefined>();
  const [isCreator, setIsCreator] = useState(false);
  const { data: joinRequests } = usePolledRestData<JoinRequestsMap>(
    isCreator && voteId ? `joinRequests/${voteId}` : null,
    2000
  );
  const { data: liveLobby } = usePolledRestData<LobbyData>(
    voteId ? `lobbies/${voteId}` : null,
    2000
  );
  const scrollRef = useRef<ScrollView>(null);
  const mvpCommentYRef = useRef(0);
  const loserCommentYRef = useRef(0);
  const activeCommentFieldRef = useRef<'mvp' | 'loser' | null>(null);
  const isAnyDropdownOpen = openDropdownCount > 0;

  const handleDropdownOpenChange = (isOpen: boolean) => {
    setOpenDropdownCount((prev) => {
      if (isOpen) return prev + 1;
      return Math.max(0, prev - 1);
    });
  };

  const scrollActiveCommentIntoView = () => {
    const delay = Platform.OS === 'android' ? 280 : 120;
    setTimeout(() => {
      const scroll = scrollRef.current;
      if (!scroll) return;
      const field = activeCommentFieldRef.current;
      if (field === 'loser') {
        scroll.scrollTo({ y: Math.max(0, loserCommentYRef.current - 48), animated: true });
        return;
      }
      if (field === 'mvp') {
        scroll.scrollTo({ y: Math.max(0, mvpCommentYRef.current - 32), animated: true });
      }
    }, delay);
  };

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      if (Platform.OS === 'android') {
        setKeyboardHeight(e.endCoordinates.height);
      }
      const delay = Platform.OS === 'android' ? 280 : 120;
      setTimeout(() => {
        const scroll = scrollRef.current;
        if (!scroll) return;
        const field = activeCommentFieldRef.current;
        if (field === 'loser') {
          scroll.scrollTo({ y: Math.max(0, loserCommentYRef.current - 48), animated: true });
        } else if (field === 'mvp') {
          scroll.scrollTo({ y: Math.max(0, mvpCommentYRef.current - 32), animated: true });
        }
      }, delay);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      if (Platform.OS === 'android') {
        setKeyboardHeight(0);
      }
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Fetch participants and lobby data on mount
  useEffect(() => {
    async function fetchData() {
      if (!voteId) return;
      
      const lobbyData = await restGet<LobbyData>(`lobbies/${voteId}`);
      const participants = await restGet<ParticipantsData>(`participants/${voteId}`);
      const ownName = (user?.uid && participants?.[user.uid]?.name?.trim()) || '';
      setMyName(ownName);

      const teamNames = normalizeMemberList(lobbyData?.teamMembers);
      if (teamNames.length > 0) {
        setParticipantNames(teamNames);
      } else if (participants) {
        const names = Object.values(participants).map(p => p.name);
        setParticipantNames(names);
      }
      
      if (lobbyData?.voteType) {
        setVoteType(lobbyData.voteType);
      }

      setLobbyCode(lobbyData?.code);
      setIsCreator(Boolean(user && lobbyData && user.uid === lobbyData.creatorId));

      if (user?.uid) {
        const draft = await loadVoteDraft(voteId, user.uid);
        if (draft) {
          setMvpName(draft.mvpName);
          setMvpComment(draft.mvpComment);
          setLoserName(draft.loserName);
          setLoserComment(draft.loserComment);
        }
      }
    }
    
    fetchData();
  }, [voteId, user?.uid]);

  const mvpOptions = mvpVoteOptions(participantNames, myName);

  useEffect(() => {
    if (myName && mvpName === myName) {
      setMvpName('');
    }
  }, [myName, mvpName]);

  useEffect(() => {
    if (!liveLobby?.status || !voteId) {
      return;
    }

    if (isResultsStatus(liveLobby.status)) {
      router.replace({
        pathname: '/results',
        params: { voteId, from },
      });
      return;
    }

    if (isPublishedRankingStatus(liveLobby.status)) {
      router.replace({
        pathname: '/ranking',
        params: { voteId, from },
      });
    }
  }, [liveLobby?.status, voteId, from]);

  const handleSubmit = async () => {
    if (!mvpName) {
      Alert.alert('Error', 'Please select the MVP');
      return;
    }

    if (myName && mvpName.trim() === myName) {
      Alert.alert('Error', 'You cannot vote for yourself as MVP.');
      return;
    }
    
    if (!mvpComment.trim()) {
      Alert.alert('Error', 'Please add a comment for the MVP');
      return;
    }
    
    // Only require loser fields if vote type is mvpAndLoser
    if (voteType === 'mvpAndLoser') {
      if (!loserName) {
        Alert.alert('Error', 'Please select the loser');
        return;
      }
      
      if (!loserComment.trim()) {
        Alert.alert('Error', 'Please add a comment for the loser');
        return;
      }
    }
    
    if (!user || !voteId) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user has already voted
      const existingVote = await restGet(`votes/${voteId}/${user.uid}`);
      if (existingVote) {
        Alert.alert('Already Voted', 'You have already submitted your vote.');
        // Navigate to waiting screen since they already voted
        router.replace({
          pathname: '/votingWaiting',
          params: { voteId, from },
        });
        return;
      }

      const voteData: {
        mvpName: string;
        mvpComment: string;
        loserName?: string;
        loserComment?: string;
        submittedAt: number;
      } = {
        mvpName: mvpName.trim(),
        mvpComment: mvpComment.trim(),
        submittedAt: Date.now(),
      };
      
      // Only include loser fields if vote type is mvpAndLoser
      if (voteType === 'mvpAndLoser') {
        voteData.loserName = loserName.trim();
        voteData.loserComment = loserComment.trim();
      }

      const success = await restUpdatePaths({
        [`votes/${voteId}/${user.uid}`]: voteData,
        [`voteReceipts/${voteId}/${user.uid}`]: true,
      });
      
      if (!success) {
        Alert.alert('Error', 'Failed to submit vote. Please try again.');
        return;
      }

      await removeVoteDraft(voteId, user.uid);

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
    router.replace('/(tabs)');
  };

  return (
    <ThemedView safeAndroid style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView 
          ref={scrollRef}
          style={styles.scrollView} 
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                24 + (Platform.OS === 'android' ? Math.round(keyboardHeight * 0.60) : 0),
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          scrollEnabled={!isAnyDropdownOpen}
          scrollEventThrottle={16}
        >
        <GradientText 
          text="Your vote" 
          style={styles.title}
        />

        {isCreator && voteId && (
          <JoinRequestsHost
            voteId={voteId}
            code={lobbyCode}
            requests={joinRequests}
          />
        )}

        {/* MVP Section */}
        <Text style={styles.sectionLabel}>Your MVP of the match</Text>
        <SelectDropdown
          value={mvpName}
          options={mvpOptions}
          placeholder="Select the match MVP"
          onSelect={setMvpName}
          onOpenChange={handleDropdownOpenChange}
        />

        <Text style={styles.sectionLabel}>MVP comment</Text>
        <View
          onLayout={(e) => {
            mvpCommentYRef.current = e.nativeEvent.layout.y;
          }}
        >
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
              activeCommentFieldRef.current = 'mvp';
              scrollActiveCommentIntoView();
            }}
            onBlur={() => {
              if (activeCommentFieldRef.current === 'mvp') {
                activeCommentFieldRef.current = null;
              }
            }}
          />
        </View>

        {/* Loser Section - only show if vote type is mvpAndLoser */}
        {voteType === 'mvpAndLoser' && (
          <>
            <Text style={styles.sectionLabel}>Your loser of the match</Text>
            <SelectDropdown
              value={loserName}
              options={participantNames}
              placeholder="Select the match loser"
              onSelect={setLoserName}
              onOpenChange={handleDropdownOpenChange}
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
              onLayout={(e) => {
                loserCommentYRef.current = e.nativeEvent.layout.y;
              }}
              onFocus={() => {
                activeCommentFieldRef.current = 'loser';
                scrollActiveCommentIntoView();
              }}
              onBlur={() => {
                if (activeCommentFieldRef.current === 'loser') {
                  activeCommentFieldRef.current = null;
                }
              }}
            />
          </>
        )}
      </ScrollView>

        {/* Send vote button - fixed at bottom */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            onPress={handleSubmit}
            disabled={
              isSubmitting || 
              !mvpName || 
              !mvpComment.trim() || 
              (voteType === 'mvpAndLoser' && (!loserName || !loserComment.trim()))
            }
            style={styles.submitButton}
            textStyle={styles.submitButtonText}
          >
            {isSubmitting ? 'Submitting...' : 'Send vote'}
          </PrimaryButton>
        </View>
      </KeyboardAvoidingView>
      <ScreenBackButton variant="exit" onPress={handleExit} />
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
  joinRequestsWrap: {
    marginBottom: 24,
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
  exitButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 1000,
    padding: 8,
  },
});
