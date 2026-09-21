import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { ScreenBackButton } from '@/components/screen-back-button';
import { SelectDropdown } from '@/components/select-dropdown';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { usePolledRestData } from '@/hooks/usePolledRestData';
import type { JoinRequest } from '@/components/join-requests-panel';
import {
  generateLobbyCode,
  LOBBY_CODE_LENGTH,
  LobbyCodeMapping,
} from '@/services/database';
import { restDelete, restGet, restPush, restPut } from '@/services/firebaseRest';
import {
  availableMemberNames,
  claimedNameSet,
  isTeamLobby,
  listTeams,
  MIN_TEAM_MEMBERS,
  normalizeMemberList,
  usableTeams,
  UserTeamWithId,
} from '@/services/teams';
import { router, useLocalSearchParams } from 'expo-router';

interface JoinableLobbyData {
  status: string;
  creatorId?: string;
  teamName?: string;
  teamMembers?: string[] | Record<string, string>;
  claimedNames?: Record<string, string> | string[];
}

interface ParticipantData {
  name: string;
  joinedAt: number;
  nameChangeRequested?: boolean;
}

function lobbyIdFromCodeMapping(value: LobbyCodeMapping | string | null): string | null {
  if (typeof value === 'string' && value) {
    return value;
  }
  if (value && typeof value === 'object' && typeof value.lobbyId === 'string') {
    return value.lobbyId;
  }
  return null;
}

function joinPreviewFromMapping(
  mapping: LobbyCodeMapping | string | null
): JoinableLobbyData | null {
  if (!mapping || typeof mapping === 'string') {
    return null;
  }
  return {
    status: mapping.status,
    teamName: mapping.teamName,
    teamMembers: mapping.teamMembers,
    claimedNames: mapping.claimedNames,
  };
}

function isOpenJoinStatus(status: string): boolean {
  return status === 'waiting' || status === 'voting';
}

async function allocateLobbyCode(): Promise<string | null> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateLobbyCode();
    const existing = await restGet(`lobbyCodes/${code}`);
    if (existing == null) {
      return code;
    }
  }
  return null;
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
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [pendingJoin, setPendingJoin] = useState<{ lobbyId: string } | null>(null);
  const { user } = useAuth();

  const availableTeams = useMemo(() => usableTeams(teams), [teams]);
  const selectedTeam = availableTeams.find((team) => team.id === selectedTeamId) ?? null;
  const joinTeamMembers = normalizeMemberList(joinLobby?.teamMembers);
  const availableJoinNames = useMemo(
    () => availableMemberNames(joinTeamMembers, claimedNameSet(joinLobby?.claimedNames)),
    [joinTeamMembers, joinLobby?.claimedNames]
  );
  const isJoinTeamLobby = isJoinMode && isTeamLobby(joinLobby);
  const { data: pendingRequest } = usePolledRestData<JoinRequest>(
    pendingJoin && user?.uid ? `joinRequests/${pendingJoin.lobbyId}/${user.uid}` : null,
    2000
  );
  const normalizedJoinCode = lobbyCode.trim().toUpperCase();
  const { data: polledJoinMapping } = usePolledRestData<LobbyCodeMapping | string>(
    isJoinMode && normalizedJoinCode.length >= 6 ? `lobbyCodes/${normalizedJoinCode}` : null,
    2000
  );

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

    const lobbyId = lobbyIdFromCodeMapping(polledJoinMapping);
    const preview = joinPreviewFromMapping(polledJoinMapping);
    if (!lobbyId || !preview || !isOpenJoinStatus(preview.status)) {
      setJoinLobby(null);
      setAlreadyMember(false);
      return;
    }

    if (isTeamLobby(preview)) {
      const available = availableMemberNames(
        normalizeMemberList(preview.teamMembers),
        claimedNameSet(preview.claimedNames)
      );
      setName((current) => (current && available.includes(current) ? current : ''));
    }

    setJoinLobby((current) => ({
      ...preview,
      creatorId: current?.creatorId,
    }));

    let cancelled = false;
    restGet(`lobbies/${lobbyId}`).then((existingLobby) => {
      if (cancelled) return;
      setJoinLobby({
        ...preview,
        creatorId: (existingLobby as JoinableLobbyData | null)?.creatorId,
      });
      setAlreadyMember(existingLobby != null);
    });

    return () => {
      cancelled = true;
    };
  }, [isJoinMode, polledJoinMapping, user?.uid]);

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
      const code = await allocateLobbyCode();
      if (!code) {
        Alert.alert("Couldn't create lobby", 'Please try again.');
        return;
      }

      const lobbyData = {
        creatorId: user.uid,
        creatorName: name.trim(),
        createdAt: Date.now(),
        status: 'waiting' as const,
        code,
        voteType,
        ...(useTeam && selectedTeam
          ? {
              teamName: selectedTeam.name,
              teamMembers: selectedTeam.members,
            }
          : {}),
      };

      const lobbyId = await restPush('lobbies', lobbyData);
      
      if (!lobbyId) {
        console.error('❌ Failed to create lobby');
        Alert.alert("Couldn't create lobby", 'Please try again.');
        return;
      }

      const codeMapping: LobbyCodeMapping = {
        lobbyId,
        status: 'waiting',
        voteType,
        claimedNames: { [user.uid]: name.trim() },
        ...(useTeam && selectedTeam
          ? {
              teamName: selectedTeam.name,
              teamMembers: selectedTeam.members,
            }
          : {}),
      };

      const codeWrite = await restPut(`lobbyCodes/${code}`, codeMapping);
      if (!codeWrite) {
        Alert.alert("Couldn't create lobby", 'Please try again.');
        return;
      }
      
      await restPut(`participants/${lobbyId}/${user.uid}`, {
        name: name.trim(),
        joinedAt: Date.now(),
      });

      await restPut(`lobbyCodes/${code}/claimedNames/${user.uid}`, name.trim());

      await restPut(`userHistory/${user.uid}/${lobbyId}`, {
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
    if (!user) {
      console.error('❌ No user found');
      return;
    }

    if (!alreadyMember && !name.trim()) {
      return;
    }
    
    if (!lobbyCode.trim()) {
      return;
    }

    setIsJoining(true);

    try {
      const code = lobbyCode.trim().toUpperCase();
      const mapping = await restGet<LobbyCodeMapping | string>(`lobbyCodes/${code}`);
      const lobbyId = lobbyIdFromCodeMapping(mapping);
      const lobbyData = joinPreviewFromMapping(mapping);

      if (!lobbyId || !lobbyData) {
        console.error('❌ No lobby found with this code');
        Alert.alert("Couldn't find lobby", 'Check the code and try again.');
        return;
      }

      const existingLobby = await restGet<JoinableLobbyData>(`lobbies/${lobbyId}`);
      if (existingLobby) {
        await restPut(`userHistory/${user.uid}/${lobbyId}`, {
          lobbyId,
          joinedAt: Date.now(),
        });
        const existingVote = await restGet(`votes/${lobbyId}/${user.uid}`);
        router.push({
          pathname: existingVote ? '/votingWaiting' : '/waitingRoom',
          params: { voteId: lobbyId },
        });
        return;
      }

      if (!isOpenJoinStatus(lobbyData.status)) {
        console.error('❌ Lobby is not accepting participants');
        Alert.alert("Can't join this lobby", 'This lobby is no longer accepting participants.');
        return;
      }

      if (isTeamLobby(lobbyData)) {
        const available = availableMemberNames(
          normalizeMemberList(lobbyData.teamMembers),
          claimedNameSet(lobbyData.claimedNames)
        );
        if (!available.includes(name.trim())) {
          Alert.alert('Pick a team name', 'Please pick an available name from the team list.');
          return;
        }
      }

      if (lobbyData.status === 'voting') {
        const requestOk = await restPut(`joinRequests/${lobbyId}/${user.uid}`, {
          name: name.trim(),
          requestedAt: Date.now(),
          status: 'pending',
        });
        if (!requestOk) {
          Alert.alert("Couldn't send request", 'Please try again.');
          return;
        }
        setPendingJoin({ lobbyId });
        return;
      }

      const participantData: ParticipantData = {
        name: name.trim(),
        joinedAt: Date.now(),
        nameChangeRequested: false,
      };

      const writeSuccess = await restPut(`participants/${lobbyId}/${user.uid}`, participantData);
      
      if (!writeSuccess) {
        console.error('❌ Failed to add participant');
        Alert.alert("Couldn't join lobby", 'Please try again.');
        return;
      }

      await restPut(`lobbyCodes/${code}/claimedNames/${user.uid}`, name.trim());

      await restPut(`userHistory/${user.uid}/${lobbyId}`, {
        lobbyId,
        joinedAt: Date.now(),
      });

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

  useEffect(() => {
    if (!pendingJoin || !user?.uid || !pendingRequest) {
      return;
    }
    if (pendingRequest.status === 'approved') {
      const lobbyId = pendingJoin.lobbyId;
      setPendingJoin(null);
      restPut(`userHistory/${user.uid}/${lobbyId}`, {
        lobbyId,
        joinedAt: Date.now(),
      }).finally(() => {
        router.push({
          pathname: '/waitingRoom',
          params: { voteId: lobbyId },
        });
      });
      return;
    }
    if (pendingRequest.status === 'denied') {
      const lobbyId = pendingJoin.lobbyId;
      setPendingJoin(null);
      restDelete(`joinRequests/${lobbyId}/${user.uid}`);
      Alert.alert('Request declined', 'The host declined your request to join.');
    }
  }, [pendingJoin, pendingRequest, user?.uid]);

  const handleCancelJoinRequest = async () => {
    if (pendingJoin && user?.uid) {
      await restDelete(`joinRequests/${pendingJoin.lobbyId}/${user.uid}`);
    }
    setPendingJoin(null);
  };

  if (pendingJoin) {
    return (
      <ThemedView safeAndroid style={styles.container}>
        <View style={styles.pendingWrap}>
          <Text style={styles.title}>Waiting for the host</Text>
          <Text style={styles.pendingSubtitle}>
            Your request to join has been sent. You can enter the vote once the host admits you.
          </Text>
          <View style={styles.buttonContainer}>
            <PrimaryButton onPress={handleCancelJoinRequest}>Cancel request</PrimaryButton>
          </View>
        </View>
        <ScreenBackButton onPress={handleCancelJoinRequest} />
      </ThemedView>
    );
  }

  return (
    <ThemedView safeAndroid style={styles.container}>
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
              onChangeText={(text) => setLobbyCode(text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={LOBBY_CODE_LENGTH}
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
                  options={availableJoinNames}
                  placeholder={
                    availableJoinNames.length > 0 ? 'Select your name' : 'No names left'
                  }
                  onSelect={setName}
                  disabled={availableJoinNames.length === 0}
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
                (isJoinMode && !lobbyCode.trim()) ||
                (isJoinMode && !alreadyMember && !name.trim()) ||
                (isJoinMode && isJoinTeamLobby && !alreadyMember && availableJoinNames.length === 0) ||
                (!isJoinMode && !name.trim()) ||
                (!isJoinMode && useTeam && !selectedTeam)
              }
            >
              {isCreating || isJoining
                ? 'Loading...'
                : isJoinMode
                  ? alreadyMember
                    ? 'Rejoin'
                    : joinLobby?.status === 'voting'
                      ? 'Request to join'
                      : 'Join'
                  : 'Create'}
            </PrimaryButton>
          </View>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
      <ScreenBackButton onPress={handleBack} />
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
  pendingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  pendingSubtitle: {
    color: Colors.icon,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    fontFamily: defaultFontFamily,
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
