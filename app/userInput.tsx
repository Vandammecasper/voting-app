import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { ScreenBackButton } from '@/components/screen-back-button';
import { SelectDropdown } from '@/components/select-dropdown';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { generateLobbyCode } from '@/services/database';
import { getFirebaseDatabaseUrl } from '@/services/firebaseDatabaseUrl';
import {
  claimedParticipantNames,
  isTeamLobby,
  listTeams,
  MIN_TEAM_MEMBERS,
  normalizeMemberList,
  usableTeams,
  UserTeamWithId,
} from '@/services/teams';
import { router, useLocalSearchParams } from 'expo-router';

const DATABASE_URL = getFirebaseDatabaseUrl();

type JoinableLobbyStatus = 'waiting' | 'voting';

interface JoinableLobbyData {
  status: string;
  creatorId?: string;
  teamName?: string;
  teamMembers?: string[] | Record<string, string>;
}

interface ParticipantData {
  name: string;
  joinedAt: number;
  isCreator: boolean;
  nameChangeRequested?: boolean;
}

function isJoinableLobbyStatus(status: string): status is JoinableLobbyStatus {
  return status === 'waiting' || status === 'voting';
}

// Helper to read data using REST API (bypasses SDK issues)
async function readViaRest<T>(path: string): Promise<T | null> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.error('❌ No authenticated user for REST call');
      return null;
    }
    
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ REST error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`❌ REST fetch error:`, error);
    return null;
  }
}

// Helper to write data using REST API (bypasses SDK issues)
async function writeViaRest<T>(path: string, data: T): Promise<boolean> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.error('❌ No authenticated user for REST write');
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
      console.error(`❌ REST write error: ${response.status} ${response.statusText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`❌ REST write error:`, error);
    return false;
  }
}

// Helper to push data using REST API (creates new entry with generated key)
async function pushViaRest<T>(path: string, data: T): Promise<string | null> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      console.error('❌ No authenticated user for REST push');
      return null;
    }
    
    const token = await currentUser.getIdToken();
    const url = `${DATABASE_URL}/${path}.json?auth=${token}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      console.error(`❌ REST push error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const result = await response.json();
    return result.name; // Firebase returns { name: "generated-key" }
  } catch (error) {
    console.error(`❌ REST push error:`, error);
    return null;
  }
}

export default function UserInputScreen() {
  const { mode } = useLocalSearchParams<{ mode: 'create' | 'join' }>();
  const isJoinMode = mode === 'join';
  
  const [name, setName] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [voteType, setVoteType] = useState<'mvpAndLoser' | 'mvpOnly'>('mvpAndLoser');
  const [useTeam, setUseTeam] = useState(false);
  const [teams, setTeams] = useState<UserTeamWithId[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [joinLobby, setJoinLobby] = useState<JoinableLobbyData | null>(null);
  const [joinTakenNames, setJoinTakenNames] = useState<string[]>([]);
  const { user } = useAuth();

  const availableTeams = useMemo(() => usableTeams(teams), [teams]);
  const selectedTeam = availableTeams.find((team) => team.id === selectedTeamId) ?? null;
  const joinTeamMembers = normalizeMemberList(joinLobby?.teamMembers);
  const isJoinTeamLobby = isJoinMode && isTeamLobby(joinLobby);

  useEffect(() => {
    if (isJoinMode || !user?.uid) return;

    let cancelled = false;
    listTeams(user.uid)
      .then((next) => {
        if (!cancelled) setTeams(next);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isJoinMode, user?.uid]);

  useEffect(() => {
    if (!isJoinMode) return;

    const code = lobbyCode.trim();
    if (code.length !== 6) {
      setJoinLobby(null);
      setJoinTakenNames([]);
      return;
    }

    let cancelled = false;

    async function lookupLobby() {
      const lobbyId = await readViaRest<string>(`lobbyCodes/${code}`);
      if (cancelled) return;
      if (!lobbyId) {
        setJoinLobby(null);
        setJoinTakenNames([]);
        return;
      }

      const [lobbyData, participants] = await Promise.all([
        readViaRest<JoinableLobbyData>(`lobbies/${lobbyId}`),
        readViaRest<Record<string, ParticipantData>>(`participants/${lobbyId}`),
      ]);
      if (cancelled) return;

      setJoinLobby(lobbyData);
      const claimed = claimedParticipantNames(participants, user?.uid);
      setJoinTakenNames([...claimed]);

      if (isTeamLobby(lobbyData) && user?.uid) {
        const existingName = participants?.[user.uid]?.name?.trim();
        const members = normalizeMemberList(lobbyData?.teamMembers);
        if (existingName && members.includes(existingName)) {
          setName(existingName);
        } else {
          setName('');
        }
      }
    }

    lookupLobby();
    return () => {
      cancelled = true;
    };
    // name is intentionally omitted: lookup should not re-run when the user picks a name
  }, [isJoinMode, lobbyCode, user?.uid]);

  const handleToggleUseTeam = () => {
    setUseTeam((current) => {
      const next = !current;
      if (!next) {
        setSelectedTeamId('');
      }
      setName('');
      return next;
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const handleCreate = async () => {
    
    if (!useTeam && !name.trim()) {
      return;
    }

    if (useTeam && (!selectedTeam || !name.trim())) {
      return;
    }
    
    if (!user) {
      console.error('❌ No user found');
      return;
    }

    setIsCreating(true);

    try {
      // Generate a 6-digit code for the lobby
      const code = generateLobbyCode();
      
      // Create a new lobby/voting session using REST API
      const lobbyData = {
        creatorId: user.uid,
        creatorName: name.trim(),
        createdAt: Date.now(),
        status: 'waiting',
        code,
        voteType, // 'mvpOnly' or 'mvpAndLoser'
        ...(useTeam && selectedTeam
          ? {
              teamName: selectedTeam.name,
              teamMembers: selectedTeam.members,
            }
          : {}),
      };

      const lobbyId = await pushViaRest('lobbies', lobbyData);
      
      if (!lobbyId) {
        console.error('❌ Failed to create lobby');
        Alert.alert("Couldn't create lobby", 'Please try again.');
        return;
      }

      await writeViaRest(`lobbyCodes/${code}`, lobbyId);
      
      await writeViaRest(`participants/${lobbyId}/${user.uid}`, {
        name: name.trim(),
        joinedAt: Date.now(),
        isCreator: true,
      });

      // Track participation in user history
      await writeViaRest(`userHistory/${user.uid}/${lobbyId}`, {
        lobbyId,
        joinedAt: Date.now(),
      });

      router.push({
        pathname: '/waitingRoom',
        params: { voteId: lobbyId },
      });
    } catch (error) {
      console.error('❌ Error creating vote:', error);
      Alert.alert("Couldn't create lobby", 'Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    
    if (!name.trim() || !lobbyCode.trim()) {
      return;
    }
    
    if (!user) {
      console.error('❌ No user found');
      return;
    }

    setIsJoining(true);

    try {
      const lobbyId = await readViaRest<string>(`lobbyCodes/${lobbyCode.trim()}`);

      if (!lobbyId) {
        console.error('❌ No lobby found with this code');
        Alert.alert("Couldn't find lobby", 'Check the code and try again.');
        return;
      }

      const lobbyData = await readViaRest<JoinableLobbyData>(`lobbies/${lobbyId}`);

      if (!lobbyData) {
        console.error('❌ Lobby data not found');
        Alert.alert("Couldn't find lobby", 'Please try again.');
        return;
      }

      if (!isJoinableLobbyStatus(lobbyData.status)) {
        console.error('❌ Lobby is not accepting participants');
        Alert.alert("Can't join this lobby", 'This lobby is no longer accepting participants.');
        return;
      }

      if (isTeamLobby(lobbyData)) {
        const members = normalizeMemberList(lobbyData.teamMembers);
        if (!members.includes(name.trim())) {
          Alert.alert('Pick a team name', 'Please pick your name from the team list.');
          return;
        }

        const participants = await readViaRest<Record<string, ParticipantData>>(`participants/${lobbyId}`);
        const claimed = claimedParticipantNames(participants, user.uid);
        if (claimed.has(name.trim())) {
          Alert.alert('Name taken', 'That name is already in use. Please pick another.');
          setJoinTakenNames([...claimed]);
          return;
        }
      }

      const existingParticipant = await readViaRest<ParticipantData>(`participants/${lobbyId}/${user.uid}`);
      const participantData: ParticipantData = {
        ...existingParticipant,
        name: name.trim(),
        joinedAt: existingParticipant?.joinedAt ?? Date.now(),
        isCreator: existingParticipant?.isCreator ?? lobbyData.creatorId === user.uid,
        nameChangeRequested: false,
      };

      const writeSuccess = await writeViaRest(`participants/${lobbyId}/${user.uid}`, participantData);
      
      if (!writeSuccess) {
        console.error('❌ Failed to add participant');
        Alert.alert("Couldn't join lobby", 'Please try again.');
        return;
      }
      
      // Track participation in user history
      await writeViaRest(`userHistory/${user.uid}/${lobbyId}`, {
        lobbyId,
        joinedAt: Date.now(),
      });

      if (lobbyData.status === 'voting') {
        const existingVote = await readViaRest(`votes/${lobbyId}/${user.uid}`);
        if (existingVote) {
          router.push({
            pathname: '/votingWaiting',
            params: { voteId: lobbyId },
          });
          return;
        }

        router.push({
          pathname: '/voting',
          params: { voteId: lobbyId },
        });
        return;
      }

      router.push({
        pathname: '/waitingRoom',
        params: { voteId: lobbyId },
      });
    } catch (error) {
      console.error('❌ Error joining vote:', error);
      Alert.alert("Couldn't join lobby", 'Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <ThemedView safeAndroid style={styles.container}>
      <ScreenBackButton onPress={handleBack} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Pressable style={styles.dismissKeyboard} onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {isJoinMode && (
            <Text style={styles.title}>
              Join a voting session
            </Text>
          )}
          {!isJoinMode && (
            <Text style={styles.title}>
              {useTeam ? 'Create a voting session' : 'What is your name?'}
            </Text>
          )}

          {isJoinMode && (
            <TextInput
              style={styles.input}
              placeholder="Enter lobby code"
              placeholderTextColor={Colors.placeholder}
              value={lobbyCode}
              onChangeText={(text) => setLobbyCode(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
            />
          )}

          {!isJoinMode && (
            <Pressable
              style={styles.checkboxRow}
              onPress={handleToggleUseTeam}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: useTeam }}
              accessibilityLabel="Use a team"
            >
              <Ionicons
                name={useTeam ? 'checkbox' : 'square-outline'}
                size={22}
                color={useTeam ? '#6E92FF' : Colors.icon}
              />
              <Text style={styles.checkboxLabel}>Use a team</Text>
            </Pressable>
          )}

          {!isJoinMode && useTeam && (
            <View style={styles.teamFields}>
              {availableTeams.length === 0 ? (
                <Text style={styles.teamHint}>
                  Add a team with at least {MIN_TEAM_MEMBERS} members in Settings first.
                </Text>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Team</Text>
                  <View style={styles.dropdownWrapHigh}>
                    <SelectDropdown
                      value={selectedTeam?.name ?? ''}
                      options={availableTeams.map((team) => team.name)}
                      placeholder="Select a team"
                      onSelect={(teamName) => {
                        const team = availableTeams.find((item) => item.name === teamName);
                        setSelectedTeamId(team?.id ?? '');
                        setName('');
                      }}
                    />
                  </View>
                  <Text style={styles.fieldLabel}>Your name</Text>
                  <View style={styles.dropdownWrap}>
                    <SelectDropdown
                      value={name}
                      options={selectedTeam?.members ?? []}
                      placeholder={selectedTeam ? 'Select your name' : 'Select a team first'}
                      onSelect={setName}
                      disabled={!selectedTeam}
                    />
                  </View>
                </>
              )}
            </View>
          )}

          {isJoinTeamLobby && (
            <View style={styles.teamFields}>
              <Text style={styles.fieldLabel}>Your name</Text>
              <View style={styles.dropdownWrap}>
                <SelectDropdown
                  value={name}
                  options={joinTeamMembers}
                  placeholder="Select your name"
                  onSelect={setName}
                  disabledOptions={joinTakenNames}
                />
              </View>
            </View>
          )}

          {(!isJoinMode && !useTeam) || (isJoinMode && !isJoinTeamLobby) ? (
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.placeholder}
              value={name}
              onChangeText={setName}
            />
          ) : null}

          {!isJoinMode && (
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Vote type</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggleOption, voteType === 'mvpAndLoser' && styles.toggleOptionActive]}
                  onPress={() => setVoteType('mvpAndLoser')}
                >
                  <Text style={[styles.toggleText, voteType === 'mvpAndLoser' && styles.toggleTextActive]}>
                    MVP + Loser
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleOption, voteType === 'mvpOnly' && styles.toggleOptionActive]}
                  onPress={() => setVoteType('mvpOnly')}
                >
                  <Text style={[styles.toggleText, voteType === 'mvpOnly' && styles.toggleTextActive]}>
                    MVP only
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
          <View style={styles.buttonContainer}>
            <PrimaryButton
              onPress={isJoinMode ? handleJoin : handleCreate}
              disabled={
                isCreating ||
                isJoining ||
                !name.trim() ||
                (isJoinMode && !lobbyCode.trim()) ||
                (!isJoinMode && useTeam && !selectedTeam)
              }
            >
              {isCreating || isJoining ? 'Loading...' : (isJoinMode ? 'Join' : 'Create')}
            </PrimaryButton>
          </View>
          </ScrollView>
        </Pressable>
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
  dismissKeyboard: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#D9D9D9',
    fontFamily: defaultFontFamily,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginTop: 20,
    marginBottom: 8,
  },
  checkboxLabel: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: defaultFontFamily,
  },
  teamFields: {
    width: '100%',
    marginTop: 8,
  },
  teamHint: {
    color: Colors.icon,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: defaultFontFamily,
  },
  fieldLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: defaultFontFamily,
  },
  dropdownWrapHigh: {
    width: '100%',
    zIndex: 30,
  },
  dropdownWrap: {
    width: '100%',
    zIndex: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6E92FF',
    marginTop: 200,
  },
  buttonContainer: {
    marginTop: 32,
    width: '100%',
    gap: 16,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: Colors.icon,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.background,
    color: Colors.text,
    marginTop: 24,
    fontFamily: defaultFontFamily,
  },
  toggleContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 12,
  },
  toggleLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: defaultFontFamily,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleOption: {
    flex: 1,
    height: 44,
    borderColor: Colors.icon,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleOptionActive: {
    borderColor: '#6E92FF',
    backgroundColor: 'rgba(110, 146, 255, 0.1)',
  },
  toggleText: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: defaultFontFamily,
  },
  toggleTextActive: {
    color: '#6E92FF',
    fontWeight: '600',
  },
});
