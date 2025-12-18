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
    </Drawer>
  );
}
