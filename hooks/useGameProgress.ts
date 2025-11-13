import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@game_progress';
const POINTS_KEY = 'humngry:points'; // The actual XP storage key

export interface GameProgress {
  totalXP: number;
  completedChallenges: string[];
  lastUpdated: string;
}

const defaultProgress: GameProgress = {
  totalXP: 0,
  completedChallenges: [],
  lastUpdated: new Date().toISOString(),
};

export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress>(defaultProgress);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load challenges completion data
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let challengeData = defaultProgress;
      if (stored) {
        challengeData = JSON.parse(stored);
      }
      
      // Load actual XP from humngry:points
      const pointsStr = await AsyncStorage.getItem(POINTS_KEY);
      const totalXP = pointsStr ? parseInt(pointsStr, 10) : 0;
      
      console.log('Loaded XP from humngry:points:', totalXP);
      
      setProgress({
        ...challengeData,
        totalXP, // Use humngry:points as the source of truth for XP
      });
    } catch (error) {
      console.error('Failed to load game progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load progress from storage
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const saveProgress = async (newProgress: GameProgress) => {
    try {
      // Save challenges completion data
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        completedChallenges: newProgress.completedChallenges,
        lastUpdated: newProgress.lastUpdated,
      }));
      
      // Save XP to humngry:points
      await AsyncStorage.setItem(POINTS_KEY, newProgress.totalXP.toString());
      
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to save game progress:', error);
    }
  };

  const addXP = useCallback(async (amount: number) => {
    const newProgress = {
      ...progress,
      totalXP: progress.totalXP + amount,
      lastUpdated: new Date().toISOString(),
    };
    await saveProgress(newProgress);
  }, [progress]);

  const completeChallenge = useCallback(async (challengeId: string, xpReward: number) => {
    if (progress.completedChallenges.includes(challengeId)) {
      return; // Already completed
    }

    const newProgress = {
      totalXP: progress.totalXP + xpReward,
      completedChallenges: [...progress.completedChallenges, challengeId],
      lastUpdated: new Date().toISOString(),
    };
    await saveProgress(newProgress);
  }, [progress]);

  const resetProgress = useCallback(async () => {
    await saveProgress(defaultProgress);
  }, []);

  return {
    progress,
    isLoading,
    addXP,
    completeChallenge,
    resetProgress,
  };
}
