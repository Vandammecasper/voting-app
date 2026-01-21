import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)', // drawer navigation group
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

function RootLayoutNav() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="waitingRoom" 
          options={{ 
            title: '',
            headerBackVisible: false,
            headerTransparent: true,
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="userInput" 
          options={{ 
            title: '',
            headerBackTitle: 'Back',
            headerTransparent: true,
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="voting" 
          options={{ 
            title: '',
            headerBackVisible: false,
            headerTransparent: true,
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="votingWaiting" 
          options={{ 
            title: '',
            headerBackVisible: false,
            headerTransparent: true,
            headerShadowVisible: false,
          }} 
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={AppTheme}>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
