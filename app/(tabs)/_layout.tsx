import { Ionicons } from '@expo/vector-icons';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Platform } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
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

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: Colors.tint,
        drawerInactiveTintColor: Colors.icon,
        drawerStyle: {
          backgroundColor: Colors.background,
        },
        ...androidHeaderOptions,
        headerShadowVisible: false,
        headerTitle: () => null,
        headerTintColor: Colors.text,
        headerShown: true,
        headerLeft: () => <DrawerToggleButton tintColor={Colors.text} />,
      }}>
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: () => null,
          drawerLabel: 'Home',
          drawerIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          headerTitle: () => null,
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
          const activeSettingsRouteName = nestedState?.routes?.[nestedState.index]?.name;
          const isNestedScreen = activeSettingsRouteName != null && activeSettingsRouteName !== 'index';
          return {
            headerTitle: () => null,
            drawerLabel: 'Settings',
            drawerIcon: ({ color }) => <Ionicons size={24} name="settings-outline" color={color} />,
            // When navigating inside Settings stack, hide the drawer header
            // so we only show the Stack header/back button.
            headerShown: !isNestedScreen,
          };
        }}
      />
    </Drawer>
  );
}
