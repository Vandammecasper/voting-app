import { StyleSheet, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';

export default function UserInputScreen() {
  const { mode } = useLocalSearchParams<{ mode: 'create' | 'join' }>();
  const isJoinMode = mode === 'join';

  return (
    <ThemedView style={styles.container}>
      {isJoinMode && (
        <GradientText 
        text="Join a voting session" 
        style={{ fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginTop: 32 }}
        />
      )}
      {!isJoinMode && (
      <GradientText 
          text="What is your name?" 
          style={{ fontSize: 32, fontWeight: 'bold', textAlign: 'center' }}
        />
      )}
      <TextInput 
        style={styles.input} 
        placeholder="Enter your name" 
        placeholderTextColor={Colors.icon}
      />
      {isJoinMode && (
          <TextInput 
            style={styles.input} 
            placeholder="Enter lobby code" 
            placeholderTextColor={Colors.icon}
          />
      )}
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={() => {router.push('/waitingRoom')}}>
          {isJoinMode ? 'join' : 'create'}
        </PrimaryButton>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
});
