import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari/400Regular';
import { useFonts } from '@expo-google-fonts/noto-sans-devanagari/useFonts';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { applyRootBackground, rootStackScreenOptions, statusBarProps } from '@/constants/systemBars';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { useVersionCheck } from '@/hooks/useVersionCheck';

applyRootBackground();

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Custom dark theme with #292929 background
const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    primary: Colors.tint,
  },
};

const hiddenStackScreen = {
  headerShown: false,
  headerBackVisible: false,
  gestureEnabled: false,
  fullScreenGestureEnabled: false,
  animation: 'none',
} as const;

function RootLayoutNav() {
  const { isLoading } = useAuth();
  const { onboarded } = useOnboarding();
  useVersionCheck(!isLoading && onboarded === true);

  if (isLoading || onboarded === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={rootStackScreenOptions}>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="index" options={hiddenStackScreen} />
          <Stack.Screen name="onboarding" options={hiddenStackScreen} />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={hiddenStackScreen} />
          <Stack.Screen name="waitingRoom" options={{ headerShown: false }} />
          <Stack.Screen name="userInput" options={{ headerShown: false }} />
          <Stack.Screen name="voting" options={{ headerShown: false }} />
          <Stack.Screen name="votingWaiting" options={{ headerShown: false }} />
          <Stack.Screen name="results" options={{ headerShown: false }} />
          <Stack.Screen name="ranking" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      {Platform.OS !== 'android' ? <StatusBar {...statusBarProps} /> : null}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    NotoSansDevanagari_400Regular,
  });

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider style={styles.root}>
        <OnboardingProvider>
          <AuthProvider>
            <ThemeProvider value={AppTheme}>
              <RootLayoutNav />
            </ThemeProvider>
          </AuthProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
