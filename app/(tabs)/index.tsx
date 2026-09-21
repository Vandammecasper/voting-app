import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/gradient-button';
import { GradientText } from '@/components/gradient-text';
import { ThemedView } from '@/components/themed-view';
import { defaultFontFamily } from '@/constants/theme';
import { useTabSceneBottomInset } from '@/hooks/useTabSceneBottomInset';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabSceneBottomInset();

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: 16 + tabBarInset,
        },
      ]}
    >
      <View style={styles.hero}>
        <GradientText
          text="MVP"
          style={styles.display}
        />
      </View>
      <Text style={styles.subtitle}>
        Who is the most valuable player on your team?
      </Text>
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={() => {router.push('/userInput?mode=create')}}>Create vote</PrimaryButton>
        <SecondaryButton onPress={() => {router.push('/userInput?mode=join')}}>Join vote</SecondaryButton>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  display: {
    fontSize: 100,
    fontWeight: 'bold',
    letterSpacing: -2,
    lineHeight: 108,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    color: '#6E92FF',
    letterSpacing: -0.3,
    lineHeight: 26,
    fontFamily: defaultFontFamily,
  },
  buttonContainer: {
    marginTop: 32,
    width: '100%',
    gap: 16,
  },
});
