import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <GradientText 
        text="MVP" 
        style={{ fontSize: 100, fontWeight: 'bold' }}
      />
      <Text style={styles.subtitle}>
        Who's the most valuable player on your team?
      </Text>
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={() => {}}>create vote</PrimaryButton>
        <SecondaryButton onPress={() => {}}>join vote</SecondaryButton>
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
});
