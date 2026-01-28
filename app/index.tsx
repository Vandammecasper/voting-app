import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { isOnboardingCompleted } from '@/services/onboardingStorage';
import { Colors } from '@/constants/theme';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await isOnboardingCompleted();
      setHasCompletedOnboarding(completed);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // If there's an error, show onboarding to be safe
      setHasCompletedOnboarding(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </View>
    );
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
