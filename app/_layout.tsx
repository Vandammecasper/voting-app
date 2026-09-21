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

const onboardingStackScreen = {
  headerShown: false,
  headerBackVisible: false,
  gestureEnabled: false,
  animation: 'none',
} as const;

const tabsStackScreen = {
  headerShown: false,
  headerBackVisible: false,
  // Prevent popping the whole tab navigator; nested stacks keep their own back gesture.
  gestureEnabled: false,
} as const;

const flowStackScreen = {
  headerShown: false,
  headerBackVisible: false,
  headerTransparent: true,
  headerStyle: { backgroundColor: Colors.background },
  headerTintColor: Colors.text,
  headerShadowVisible: false,
  headerLeft: () => null,
  headerRight: () => null,
  contentStyle: { backgroundColor: Colors.background },
  // Exit is the only way out of a live vote; the iOS back control/gesture
  // otherwise stays on the stack and looks like a Back button.
  gestureEnabled: false,
  fullScreenGestureEnabled: false,
  animation: 'slide_from_right',
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
          <Stack.Screen name="index" options={onboardingStackScreen} />
          <Stack.Screen name="onboarding" options={onboardingStackScreen} />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={tabsStackScreen} />
          <Stack.Screen name="waitingRoom" options={flowStackScreen} />
          <Stack.Screen
            name="userInput"
            options={{
              ...flowStackScreen,
              gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          />
          <Stack.Screen name="voting" options={flowStackScreen} />
          <Stack.Screen name="votingWaiting" options={flowStackScreen} />
          <Stack.Screen name="results" options={flowStackScreen} />
          <Stack.Screen name="ranking" options={flowStackScreen} />
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
