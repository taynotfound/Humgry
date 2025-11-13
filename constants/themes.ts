import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    background: '#0b0b0b',
    surface: '#1a1a1a',
    surfaceVariant: '#2a2a2a',
    text: '#ffffff',
    onSurface: '#ffffff',
    onBackground: '#ffffff',
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f0f0f0',
    text: '#000000',
    onSurface: '#000000',
    onBackground: '#000000',
  },
};

export interface AppColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  card: string;
  error: string;
  success: string;
  warning: string;
}

export const getThemeColors = (theme: 'dark' | 'light', accentColor: string): AppColors => {
  if (theme === 'dark') {
    return {
      background: '#0b0b0b',
      surface: '#1a1a1a',
      surfaceVariant: '#2a2a2a',
      text: '#ffffff',
      textSecondary: '#aaaaaa',
      textTertiary: '#888888',
      border: '#333333',
      card: '#1a1a1a',
      error: '#ff6b6b',
      success: '#69f0ae',
      warning: '#ffd740',
    };
  } else {
    return {
      background: '#f5f5f5',
      surface: '#ffffff',
      surfaceVariant: '#f0f0f0',
      text: '#000000',
      textSecondary: '#666666',
      textTertiary: '#999999',
      border: '#e0e0e0',
      card: '#ffffff',
      error: '#d32f2f',
      success: '#388e3c',
      warning: '#f57c00',
    };
  }
};
