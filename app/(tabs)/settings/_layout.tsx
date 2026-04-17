import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';

const androidHeaderOptions =
  Platform.OS === 'android'
    ? {
        headerTransparent: false,
        headerStyle: { backgroundColor: Colors.background },
      }
    : {
        headerTransparent: true,
      };

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        ...androidHeaderOptions,
        headerShadowVisible: false,
        headerTintColor: '#ECEDEE',
        title: '',
        headerTitle: '',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: '', headerTitle: '' }} />
      <Stack.Screen
        name="feature-requests"
        options={{
          headerTitle: 'Feature requests',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
