import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerTintColor: '#ECEDEE',
        headerTitle: '',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: '' }} />
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
