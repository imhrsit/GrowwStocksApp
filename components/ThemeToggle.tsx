import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme, useTheme } from '@/hooks/useColorScheme';

export function ThemeToggle() {
  const colorScheme = useColorScheme();
  const { themeMode, setThemeMode, toggleTheme } = useTheme();

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return 'sun.max.fill';
      case 'dark':
        return 'moon.fill';
      case 'system':
        return 'gear';
      default:
        return 'sun.max.fill';
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'Auto';
      default:
        return 'Light';
    }
  };

  const handleThemePress = () => {
    switch (themeMode) {
      case 'light':
        setThemeMode('dark');
        break;
      case 'dark':
        setThemeMode('system');
        break;
      case 'system':
        setThemeMode('light');
        break;
      default:
        setThemeMode('light');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
          borderColor: Colors[colorScheme ?? 'light'].border 
        }
      ]}
      onPress={handleThemePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconSymbol 
          name={getThemeIcon()} 
          size={20} 
          color={Colors[colorScheme ?? 'light'].primary} 
        />
      </View>
      <ThemedText style={styles.label}>{getThemeLabel()}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
