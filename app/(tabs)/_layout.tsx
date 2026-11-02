import { HapticTab } from '@/components/haptic-tab';
import { AntigravityPalette, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import React from 'react';
import { useWindowDimensions } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeColors = Colors[colorScheme ?? 'light'];
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColors.tint,
        tabBarInactiveTintColor: activeColors.tabIconDefault,
        tabBarStyle: isDesktop
          ? { display: 'none' }
          : {
              backgroundColor: activeColors.background,
              borderTopColor: AntigravityPalette.border,
              height: 64,
              paddingBottom: 10,
              paddingTop: 6,
            },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jornada',
          tabBarIcon: ({ color }) => (
            <Feather
              name="clock"
              size={20}
              color={typeof color === 'string' ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Documentos',
          tabBarIcon: ({ color }) => (
            <Feather
              name="folder"
              size={20}
              color={typeof color === 'string' ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cadastro"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Feather
              name="user"
              size={20}
              color={typeof color === 'string' ? color : undefined}
            />
          ),
        }}
      />
    </Tabs>
  );
}
