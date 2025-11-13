import { useSettings } from '@/contexts/settings-context';
import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const { accentColor, colors } = useSettings();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="insights" />
      <Stack.Screen name="scorecard" />
      <Stack.Screen name="challenges" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="history" />
      <Stack.Screen name="recipes" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="recipe-builder" />
      <Stack.Screen name="tags-manager" />
      <Stack.Screen name="combos-manager" />
      <Stack.Screen name="tdee-calculator" />
      <Stack.Screen name="fasting" />
    </Stack>
  );
}
