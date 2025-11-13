import appJson from '@/app.json';
import { useSettings } from '@/contexts/settings-context';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function AppFooter() {
  const { colors } = useSettings();
  const version = appJson.expo.version;

  return (
    <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <Text variant="bodySmall" style={{ color: colors.textSecondary, textAlign: 'center' }}>
        Made with ❤️ by Tay • Humngry v{version}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    zIndex: 999,
  },
});
