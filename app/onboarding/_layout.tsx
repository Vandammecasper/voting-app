import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
          headerBackVisible: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="step2" 
        options={{
          headerShown: false,
          headerBackVisible: true,
          gestureEnabled: true,
          animation: 'fade',
        }} 
      />
    </Stack>
  );
}
