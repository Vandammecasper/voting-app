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
        title: '',
        headerTitle: '',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: '', headerTitle: '', gestureEnabled: false }}
      />
      <Stack.Screen
        name="feature-requests"
        options={{
          headerTitle: 'Feature requests',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="teams"
        options={{
          headerTitle: 'Teams',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="team-edit"
        options={{
          headerTitle: 'Team',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
