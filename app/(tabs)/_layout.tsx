import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: Colors.tint,
        drawerInactiveTintColor: Colors.icon,
        drawerStyle: {
          backgroundColor: Colors.background,
        },
        headerTransparent: true,
        headerShadowVisible: false,
        headerTitle: '',
        headerTintColor: Colors.text,
        headerShown: true,
      }}>
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: '',
          drawerLabel: 'Home',
          drawerIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          headerTitle: '',
          drawerLabel: 'My Votes',
          drawerIcon: ({ color }) => <Ionicons size={24} name="time-outline" color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={({ navigation }) => {
          const state = navigation.getState();
          const settingsRoute = state?.routes?.find((r) => r.name === 'settings');
          const nestedState = settingsRoute?.state as { routes: { name: string }[]; index: number } | undefined;
          const isNestedScreen = nestedState?.routes?.[nestedState.index]?.name !== 'index';
          return {
            headerTitle: '',
            drawerLabel: 'Settings',
            drawerIcon: ({ color }) => <Ionicons size={24} name="settings-outline" color={color} />,
            headerLeft: isNestedScreen ? () => null : undefined,
          };
        }}
      />
    </Drawer>
  );
}
