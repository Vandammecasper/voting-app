import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { TAB_BAR_ITEM_HEIGHT } from '@/constants/tabBar';
import { Colors } from '@/constants/theme';

function JavaScriptTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_ITEM_HEIGHT + insets.bottom;

  return (
    <Tabs
      detachInactiveScreens={false}
      safeAreaInsets={insets}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          paddingBottom: tabBarHeight,
        },
        tabBarActiveTintColor: Colors.tint,
        tabBarInactiveTintColor: Colors.icon,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: Colors.background,
          borderTopColor: '#3a3a3a',
          borderTopWidth: 1,
          zIndex: 100,
          elevation: 100,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'My Votes',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="time-outline" color={color} />,
          tabBarAccessibilityLabel: 'My Votes',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="settings-outline" color={color} />,
          tabBarAccessibilityLabel: 'Settings',
        }}
      />
    </Tabs>
  );
}

function IosNativeTabs() {
  return (
    <NativeTabs
      tintColor={Colors.tint}
      iconColor={Colors.icon}
      labelStyle={{
        color: Colors.icon,
        fontSize: 11,
        fontWeight: '600',
      }}
      backgroundColor="transparent"
      blurEffect="none"
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Label>My Votes</Label>
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'ios') {
    return <IosNativeTabs />;
  }

  return <JavaScriptTabs />;
}
