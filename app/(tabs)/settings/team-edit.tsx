import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTabSceneBottomInset } from '@/hooks/useTabSceneBottomInset';
import {
    createTeam,
    deleteTeam,
    getTeam,
    MIN_TEAM_MEMBERS,
    updateTeam,
} from '@/services/teams';

export default function TeamEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const tabBarInset = useTabSceneBottomInset();
  const isEditing = Boolean(id);

  const [name, setName] = React.useState('');
  const [members, setMembers] = React.useState<string[]>([]);
  const [memberInput, setMemberInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(isEditing);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? 'Edit team' : 'New team',
    });
  }, [isEditing, navigation]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id || !user?.uid) {
        setIsLoading(false);
        return;
      }

      const team = await getTeam(user.uid, id);
      if (cancelled) return;

      if (!team) {
        Alert.alert('Error', 'Team not found.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      setName(team.name);
      setMembers(team.members);
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, user?.uid]);

  const addMember = () => {
    const nextName = memberInput.trim();
    if (!nextName) return;

    const exists = members.some((member) => member.toLowerCase() === nextName.toLowerCase());
    if (exists) {
      Alert.alert('Already added', 'That name is already on this team.');
      return;
    }

    setMembers((current) => [...current, nextName]);
    setMemberInput('');
  };

  const removeMember = (memberName: string) => {
    setMembers((current) => current.filter((member) => member !== memberName));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Team name', 'Please enter a team name.');
      return;
    }

    if (members.length < MIN_TEAM_MEMBERS) {
      Alert.alert(
        'Add members',
        `A team needs at least ${MIN_TEAM_MEMBERS} members before you can save it.`
      );
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && id) {
        const ok = await updateTeam(user.uid, id, { name: trimmedName, members });
        if (!ok) {
          Alert.alert('Error', 'Failed to update team. Please try again.');
          return;
        }
      } else {
        const createdId = await createTeam(user.uid, { name: trimmedName, members });
        if (!createdId) {
          Alert.alert('Error', 'Failed to create team. Please try again.');
          return;
        }
      }
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user?.uid || !id) return;

    Alert.alert(
      'Delete team',
      'Are you sure you want to delete this team? Existing votes that already used it are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const ok = await deleteTeam(user.uid, id);
              if (!ok) {
                Alert.alert('Error', 'Failed to delete team. Please try again.');
                return;
              }
              router.back();
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingBottom: tabBarInset }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <Text style={styles.loadingText}>Loading…</Text>
          ) : (
            <>
              <Text style={styles.label}>Team name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Saturday squad"
                placeholderTextColor={Colors.placeholder}
              />

              <Text style={styles.label}>Members</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.input, styles.memberInput]}
                  value={memberInput}
                  onChangeText={setMemberInput}
                  placeholder="Add a name"
                  placeholderTextColor={Colors.placeholder}
                  onSubmitEditing={addMember}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.addMemberButton}
                  onPress={addMember}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {members.length === 0 ? (
                <Text style={styles.hint}>
                  Add at least {MIN_TEAM_MEMBERS} names. People will pick from this list when joining a vote.
                </Text>
              ) : (
                <View style={styles.memberList}>
                  {members.map((member) => (
                    <View key={member} style={styles.memberChip}>
                      <Text style={styles.memberChipText}>{member}</Text>
                      <TouchableOpacity
                        onPress={() => removeMember(member)}
                        hitSlop={8}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={20} color={Colors.icon} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <PrimaryButton onPress={handleSave} disabled={isSaving || isDeleting}>
                  {isSaving ? 'Saving...' : 'Save team'}
                </PrimaryButton>
                {isEditing && (
                  <SecondaryButton onPress={handleDelete} disabled={isSaving || isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete team'}
                  </SecondaryButton>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  loadingText: {
    color: Colors.icon,
    fontSize: 16,
    fontFamily: defaultFontFamily,
  },
  label: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
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
    marginBottom: 20,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  memberInput: {
    flex: 1,
    marginBottom: 12,
  },
  addMemberButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#6E92FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: Colors.icon,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: defaultFontFamily,
    marginBottom: 24,
  },
  memberList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
  },
  memberChipText: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: defaultFontFamily,
  },
  actions: {
    gap: 16,
  },
});
