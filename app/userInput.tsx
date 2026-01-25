import auth from '@react-native-firebase/auth';
import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { ThemedView } from '@/components/themed-view';
import { Colors, defaultFontFamily } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { generateLobbyCode } from '@/services/database';
import { router, useLocalSearchParams } from 'expo-router';

const DATABASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASEURL;

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
  const { user } = useAuth();

  const handleCreate = async () => {
    
    if (!name.trim()) {
      console.log('❌ Name empty');
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
      };

      console.log('📤 Creating lobby via REST...');
      const lobbyId = await pushViaRest('lobbies', lobbyData);
      
      if (!lobbyId) {
        console.error('❌ Failed to create lobby');
        Alert.alert('Error', 'Failed to create lobby. Please try again.');
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

      await new Promise(resolve => setTimeout(resolve, 1000));

      router.push({
        pathname: '/waitingRoom',
        params: { voteId: lobbyId },
      });
      console.log('✅ Navigation initiated');
    } catch (error) {
      console.error('❌ Error creating vote:', error);
      Alert.alert('Error', 'Failed to create lobby. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    
    if (!name.trim() || !lobbyCode.trim()) {
      console.log('❌ Name or lobby code empty');
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
        Alert.alert('Error', 'Lobby not found. Please check the code and try again.');
        return;
      }

      const lobbyData = await readViaRest<{ status: string }>(`lobbies/${lobbyId}`);

      if (!lobbyData) {
        console.error('❌ Lobby data not found');
        Alert.alert('Error', 'Lobby not found. Please try again.');
        return;
      }

      if (lobbyData.status !== 'waiting') {
        console.error('❌ Lobby is not accepting participants');
        Alert.alert('Error', 'This lobby is no longer accepting participants.');
        return;
      }

      const writeSuccess = await writeViaRest(`participants/${lobbyId}/${user.uid}`, {
        name: name.trim(),
        joinedAt: Date.now(),
        isCreator: false,
      });
      
      if (!writeSuccess) {
        console.error('❌ Failed to add participant');
        Alert.alert('Error', 'Failed to join the lobby. Please try again.');
        return;
      }
      
      console.log('✅ User added as participant');

      // Track participation in user history
      await writeViaRest(`userHistory/${user.uid}/${lobbyId}`, {
        lobbyId,
        joinedAt: Date.now(),
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to the waiting room with the lobby ID
      console.log('🚀 Navigating to waiting room with voteId:', lobbyId);
      router.push({
        pathname: '/waitingRoom',
        params: { voteId: lobbyId },
      });
    } catch (error) {
      console.error('❌ Error joining vote:', error);
      Alert.alert('Error', 'Failed to join the lobby. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Pressable style={styles.dismissKeyboard} onPress={Keyboard.dismiss}>
          {isJoinMode && (
            <Text
              style={{ fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginTop: 32, color: '#D9D9D9', fontFamily: defaultFontFamily }}
            >
              Join a voting session
            </Text>
          )}
          {!isJoinMode && (
            <Text
              style={{ fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#D9D9D9', fontFamily: defaultFontFamily }}
            >
              What is your name?
            </Text>
          )}
          <TextInput 
            style={styles.input} 
            placeholder="Enter your name" 
            placeholderTextColor={Colors.placeholder}
            value={name}
            onChangeText={setName}
          />
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
          <View style={styles.buttonContainer}>
            <PrimaryButton 
              onPress={isJoinMode ? handleJoin : handleCreate}
              disabled={isCreating || isJoining || !name.trim() || (isJoinMode && !lobbyCode.trim())}
            >
              {isCreating || isJoining ? 'Loading...' : (isJoinMode ? 'join' : 'create')}
            </PrimaryButton>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
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
});
