import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: false,
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerTintColor: '#ECEDEE',
        headerBackTitle: 'Back',
        headerBackButtonDisplayMode: 'generic',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: 'default',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: 'Settings', headerTitle: 'Settings' }}
      />
      <Stack.Screen
        name="feature-requests"
        options={{
          title: 'Feature requests',
          headerTitle: 'Feature requests',
        }}
      />
      <Stack.Screen
        name="teams"
        options={{
          title: 'Teams',
          headerTitle: 'Teams',
        }}
      />
      <Stack.Screen
        name="team-edit"
        options={{
          title: 'Team',
          headerTitle: 'Team',
        }}
      />
    </Stack>
  );
}
