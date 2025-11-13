import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@nutrition_targets';

export interface NutritionTargets {
  calories: number;
  protein: number;
  fiber: number;
  budget: number;
}

const defaultTargets: NutritionTargets = {
  calories: 2000,
  protein: 150,
  fiber: 25,
  budget: 20,
};

export function useNutritionTargets() {
  const [targets, setTargets] = useState<NutritionTargets>(defaultTargets);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTargets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load nutrition targets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTargets = useCallback(async (newTargets: Partial<NutritionTargets>) => {
    try {
      const updated = { ...targets, ...newTargets };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setTargets(updated);
    } catch (error) {
      console.error('Failed to save nutrition targets:', error);
    }
  }, [targets]);

  const resetTargets = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTargets));
      setTargets(defaultTargets);
    } catch (error) {
      console.error('Failed to reset nutrition targets:', error);
    }
  }, []);

  return {
    targets,
    isLoading,
    updateTargets,
    resetTargets,
  };
}
