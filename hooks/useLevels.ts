import { useMemo } from 'react';
import { useEntries } from './useEntries';

export interface LevelInfo {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  xpProgress: number;
  totalXP: number;
  levelTitle: string;
  nextLevelTitle: string;
  unlockedFeatures: string[];
}

const LEVEL_TITLES = [
  'Beginner',
  'Food Explorer',
  'Meal Tracker',
  'Nutrition Novice',
  'Calorie Counter',
  'Macro Master',
  'Habit Builder',
  'Health Warrior',
  'Wellness Champion',
  'Nutrition Expert',
  'Fitness Legend',
  'Ultimate Achiever',
];

const UNLOCKABLE_FEATURES = {
  2: 'Custom meal tags',
  3: 'Meal comparison tool',
  5: 'Advanced statistics',
  7: 'Recipe collections',
  10: 'Expert insights',
  15: 'All features unlocked',
};

export function useLevels(): LevelInfo {
  const { points } = useEntries();
  
  return useMemo(() => {
    // XP calculation: 1 point = 1 XP
    const totalXP = points;
    
    // Level formula: Each level requires more XP (exponential growth)
    // Level 1->2: 100 XP, Level 2->3: 200 XP, Level 3->4: 300 XP, etc.
    const calculateLevel = (xp: number): number => {
      let level = 1;
      let xpNeeded = 0;
      
      while (xp >= xpNeeded) {
        xpNeeded += level * 100;
        if (xp >= xpNeeded) {
          level++;
        }
      }
      
      return level;
    };
    
    const currentLevel = calculateLevel(totalXP);
    
    // Calculate XP needed for current level
    const xpForCurrentLevel = (currentLevel - 1) * currentLevel * 50;
    
    // Calculate XP needed for next level
    const xpForNextLevel = currentLevel * (currentLevel + 1) * 50;
    
    // Current progress within the level
    const currentXP = totalXP - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    const xpProgress = xpNeededForNext > 0 ? currentXP / xpNeededForNext : 1;
    
    // Get level titles
    const levelTitle = LEVEL_TITLES[Math.min(currentLevel - 1, LEVEL_TITLES.length - 1)] || `Level ${currentLevel}`;
    const nextLevelTitle = LEVEL_TITLES[Math.min(currentLevel, LEVEL_TITLES.length - 1)] || `Level ${currentLevel + 1}`;
    
    // Get unlocked features up to current level
    const unlockedFeatures = Object.entries(UNLOCKABLE_FEATURES)
      .filter(([level]) => parseInt(level) <= currentLevel)
      .map(([, feature]) => feature);
    
    return {
      currentLevel,
      currentXP,
      xpForNextLevel: xpNeededForNext,
      xpProgress,
      totalXP,
      levelTitle,
      nextLevelTitle,
      unlockedFeatures,
    };
  }, [points]);
}

export function getXPFromAction(action: string): number {
  const XP_REWARDS = {
    'log_meal': 10,
    'complete_quest': 25,
    'daily_streak': 50,
    'week_streak': 100,
    'month_streak': 500,
    'hit_all_goals': 75,
    'first_meal': 20,
    'water_goal': 15,
    'protein_goal': 30,
  };
  
  return XP_REWARDS[action as keyof typeof XP_REWARDS] || 0;
}
