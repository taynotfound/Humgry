import { AppColors, getThemeColors, darkTheme as paperDarkTheme, lightTheme as paperLightTheme } from '@/constants/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Provider as PaperProvider, Portal } from 'react-native-paper';

type TextSize = 'small' | 'normal' | 'large';

interface SettingsContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => Promise<void>;
  highContrast: boolean;
  setHighContrast: (value: boolean) => Promise<void>;
  accentColor: string;
  setAccentColor: (color: string) => Promise<void>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => Promise<void>;
  colors: AppColors;
  dailyCalorieGoal: number;
  setDailyCalorieGoal: (goal: number) => Promise<void>;
  getFontSize: (baseSize: number) => number;
  getColor: (lightColor: string, darkColor: string) => string;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const STORAGE_KEYS = {
  TEXT_SIZE: 'humngry.settings.textSize',
  HIGH_CONTRAST: 'humngry.settings.highContrast',
  ACCENT_COLOR: 'humngry.settings.accentColor',
  THEME: 'humngry.settings.theme',
  DAILY_CALORIE_GOAL: 'humngry.settings.dailyCalorieGoal',
};

const DEFAULT_ACCENT = '#bb86fc';
const DEFAULT_CALORIE_GOAL = 2000;

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>('normal');
  const [highContrast, setHighContrastState] = useState(false);
  const [accentColor, setAccentColorState] = useState(DEFAULT_ACCENT);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [dailyCalorieGoal, setDailyCalorieGoalState] = useState(DEFAULT_CALORIE_GOAL);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const [savedTextSize, savedHighContrast, savedAccentColor, savedTheme, savedCalorieGoal] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.TEXT_SIZE),
          AsyncStorage.getItem(STORAGE_KEYS.HIGH_CONTRAST),
          AsyncStorage.getItem(STORAGE_KEYS.ACCENT_COLOR),
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_CALORIE_GOAL),
        ]);

        if (savedTextSize) {
          setTextSizeState(savedTextSize as TextSize);
        }
        if (savedHighContrast !== null) {
          setHighContrastState(savedHighContrast === 'true');
        }
        if (savedAccentColor) {
          setAccentColorState(savedAccentColor);
        }
        if (savedTheme) {
          setThemeState(savedTheme as 'dark' | 'light');
        }
        if (savedCalorieGoal) {
          setDailyCalorieGoalState(parseInt(savedCalorieGoal));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const setTextSize = async (size: TextSize) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEXT_SIZE, size);
      setTextSizeState(size);
    } catch (error) {
      console.error('Failed to save text size:', error);
    }
  };

  const setHighContrast = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, enabled.toString());
      setHighContrastState(enabled);
    } catch (error) {
      console.error('Failed to save high contrast setting:', error);
    }
  };

  const setAccentColor = async (color: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, color);
      setAccentColorState(color);
    } catch (error) {
      console.error('Failed to save accent color:', error);
    }
  };

  const setTheme = async (newTheme: 'dark' | 'light') => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const setDailyCalorieGoal = async (goal: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_CALORIE_GOAL, goal.toString());
      setDailyCalorieGoalState(goal);
    } catch (error) {
      console.error('Failed to save calorie goal:', error);
    }
  };

  // Get scaled font size based on text size setting
  const getFontSize = (baseSize: number): number => {
    const multipliers = {
      small: 0.85,
      normal: 1.0,
      large: 1.15,
    };
    return baseSize * multipliers[textSize];
  };

  // Get color based on high contrast setting
  const getColor = (normalColor: string, highContrastColor?: string): string => {
    if (!highContrast) return normalColor;
    return highContrastColor || normalColor;
  };

  const colors = getThemeColors(theme, accentColor);
  // Build react-native-paper theme and override primary with accent color
  const basePaperTheme = theme === 'dark' ? paperDarkTheme : paperLightTheme;
  const paperTheme = {
    ...basePaperTheme,
    colors: {
      ...basePaperTheme.colors,
      primary: accentColor,
    },
  };

  return (
    <SettingsContext.Provider
      value={{
        textSize,
        highContrast,
        accentColor,
        theme,
        colors,
        dailyCalorieGoal,
        setTextSize,
        setHighContrast,
        setAccentColor,
        setTheme,
        setDailyCalorieGoal,
        getFontSize,
        getColor,
      }}
    >
      <PaperProvider theme={paperTheme}>
        <Portal.Host>{children}</Portal.Host>
      </PaperProvider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
