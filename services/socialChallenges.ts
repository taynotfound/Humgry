import { MealEntry } from '@/hooks/useEntries';
import { Recipe } from './recipes';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  type: 'weekly' | 'daily' | 'monthly';
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  startDate: string;
  endDate: string;
  goal: {
    target: number;
    unit: string;
    description: string;
  };
  participants: number;
  topScore: number;
  tags?: string[];
  recipe?: Recipe;
}

export interface ChallengeProgress {
  challengeId: string;
  current: number;
  target: number;
  percentage: number;
  completed: boolean;
  rank?: number;
  completedAt?: string;
}

export interface UserChallengeStats {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalXPEarned: number;
  favoriteCategory: string;
  rank: number;
  achievements: string[];
}

/**
 * Generate active challenges
 */
export function getActiveChallenges(): Challenge[] {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return [
    {
      id: 'home-chef-week',
      title: 'Home Chef Week',
      description: 'Cook all your meals at home for 7 days straight',
      emoji: '🏠',
      type: 'weekly',
      difficulty: 'medium',
      xpReward: 500,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      goal: {
        target: 7,
        unit: 'days',
        description: 'Days of home cooking',
      },
      participants: 1247,
      topScore: 7,
      tags: ['Home-cooked'],
    },
    {
      id: 'protein-power',
      title: 'Protein Power',
      description: 'Hit your protein goal every day this week',
      emoji: '💪',
      type: 'weekly',
      difficulty: 'medium',
      xpReward: 400,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      goal: {
        target: 7,
        unit: 'days',
        description: 'Days hitting protein goal',
      },
      participants: 892,
      topScore: 7,
    },
    {
      id: 'budget-warrior',
      title: 'Budget Warrior',
      description: 'Stay under your daily budget for the whole week',
      emoji: '💰',
      type: 'weekly',
      difficulty: 'hard',
      xpReward: 600,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      goal: {
        target: 7,
        unit: 'days',
        description: 'Days under budget',
      },
      participants: 543,
      topScore: 7,
    },
    {
      id: 'veggie-master',
      title: 'Veggie Master',
      description: 'Include vegetables in every meal today',
      emoji: '🥗',
      type: 'daily',
      difficulty: 'easy',
      xpReward: 100,
      startDate: today.toISOString(),
      endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      goal: {
        target: 3,
        unit: 'meals',
        description: 'Meals with vegetables',
      },
      participants: 2341,
      topScore: 3,
      tags: ['Vegetarian', 'Vegan'],
    },
    {
      id: 'meal-prep-marathon',
      title: 'Meal Prep Marathon',
      description: 'Prepare and log at least 5 meals this month',
      emoji: '📦',
      type: 'monthly',
      difficulty: 'easy',
      xpReward: 300,
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString(),
      goal: {
        target: 5,
        unit: 'meals',
        description: 'Meal prep sessions',
      },
      participants: 1876,
      topScore: 12,
      tags: ['Meal Prep'],
    },
    {
      id: 'breakfast-champion',
      title: 'Breakfast Champion',
      description: 'Never skip breakfast for 7 days',
      emoji: '🍳',
      type: 'weekly',
      difficulty: 'easy',
      xpReward: 300,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      goal: {
        target: 7,
        unit: 'days',
        description: 'Days with breakfast logged',
      },
      participants: 1523,
      topScore: 7,
      tags: ['Breakfast'],
    },
    {
      id: 'international-cuisine',
      title: 'Around the World',
      description: 'Try 5 different cuisines this month',
      emoji: '🌍',
      type: 'monthly',
      difficulty: 'medium',
      xpReward: 500,
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString(),
      goal: {
        target: 5,
        unit: 'cuisines',
        description: 'Different cuisines tried',
      },
      participants: 734,
      topScore: 8,
    },
    {
      id: 'hydration-hero',
      title: 'Hydration Hero',
      description: 'Drink 8 glasses of water every day this week',
      emoji: '💧',
      type: 'weekly',
      difficulty: 'easy',
      xpReward: 250,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      goal: {
        target: 7,
        unit: 'days',
        description: 'Days well hydrated',
      },
      participants: 2156,
      topScore: 7,
    },
    {
      id: 'leftover-zero',
      title: 'Zero Waste Week',
      description: 'Use up all leftovers, no food waste',
      emoji: '♻️',
      type: 'weekly',
      difficulty: 'hard',
      xpReward: 550,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      goal: {
        target: 7,
        unit: 'days',
        description: 'Days with zero waste',
      },
      participants: 421,
      topScore: 7,
      tags: ['Leftovers'],
    },
    {
      id: 'fiber-focus',
      title: 'Fiber Focus',
      description: 'Get 25g+ of fiber every day this week',
      emoji: '🌾',
      type: 'weekly',
      difficulty: 'medium',
      xpReward: 400,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      goal: {
        target: 7,
        unit: 'days',
        description: 'Days hitting fiber goal',
      },
      participants: 678,
      topScore: 7,
    },
  ];
}

/**
 * Calculate progress for a specific challenge
 */
export function calculateChallengeProgress(
  challenge: Challenge,
  entries: MealEntry[]
): ChallengeProgress {
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  
  const relevantEntries = entries.filter(e => {
    const entryDate = new Date(e.time);
    return entryDate >= startDate && entryDate <= endDate;
  });
  
  let current = 0;
  
  switch (challenge.id) {
    case 'home-chef-week':
    case 'breakfast-champion':
      // Count days with entries matching criteria
      const days = new Set<string>();
      relevantEntries.forEach(e => {
        const day = new Date(e.time).toDateString();
        if (challenge.id === 'home-chef-week') {
          if (e.tags?.includes('Home-cooked')) days.add(day);
        } else if (challenge.id === 'breakfast-champion') {
          if (e.tags?.includes('Breakfast')) days.add(day);
        }
      });
      current = days.size;
      break;
      
    case 'protein-power':
      // Count days hitting protein goal (assuming 150g target)
      const proteinDays = new Set<string>();
      relevantEntries.forEach(e => {
        const day = new Date(e.time).toDateString();
        const dayTotal = relevantEntries
          .filter(entry => new Date(entry.time).toDateString() === day)
          .reduce((sum, entry) => sum + (entry.protein || 0), 0);
        if (dayTotal >= 150) proteinDays.add(day);
      });
      current = proteinDays.size;
      break;
      
    case 'budget-warrior':
      // Count days under budget (assuming $20/day)
      const budgetDays = new Set<string>();
      relevantEntries.forEach(e => {
        const day = new Date(e.time).toDateString();
        const dayTotal = relevantEntries
          .filter(entry => new Date(entry.time).toDateString() === day)
          .reduce((sum, entry) => sum + (entry.cost || 0), 0);
        if (dayTotal <= 20) budgetDays.add(day);
      });
      current = budgetDays.size;
      break;
      
    case 'veggie-master':
      // Count meals with vegetarian/vegan tags today
      const today = new Date().toDateString();
      current = relevantEntries.filter(e => 
        new Date(e.time).toDateString() === today &&
        (e.tags?.includes('Vegetarian') || e.tags?.includes('Vegan'))
      ).length;
      break;
      
    case 'meal-prep-marathon':
      // Count meal prep entries
      current = relevantEntries.filter(e => e.tags?.includes('Meal Prep')).length;
      break;
      
    case 'fiber-focus':
      // Count days with 25g+ fiber
      const fiberDays = new Set<string>();
      relevantEntries.forEach(e => {
        const day = new Date(e.time).toDateString();
        const dayTotal = relevantEntries
          .filter(entry => new Date(entry.time).toDateString() === day)
          .reduce((sum, entry) => sum + (entry.fiber || 0), 0);
        if (dayTotal >= 25) fiberDays.add(day);
      });
      current = fiberDays.size;
      break;
      
    case 'international-cuisine':
      // Count unique cuisines from tags
      const cuisines = new Set<string>();
      relevantEntries.forEach(e => {
        const cuisineTags = ['Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'Japanese', 'Thai', 'Chinese', 'French', 'American'];
        e.tags?.forEach(tag => {
          if (cuisineTags.includes(tag)) cuisines.add(tag);
        });
      });
      current = cuisines.size;
      break;
      
    default:
      current = 0;
  }
  
  const percentage = Math.min(100, (current / challenge.goal.target) * 100);
  const completed = current >= challenge.goal.target;
  
  return {
    challengeId: challenge.id,
    current,
    target: challenge.goal.target,
    percentage: Math.round(percentage),
    completed,
    rank: completed ? Math.floor(Math.random() * 100) + 1 : undefined, // Simulated rank
  };
}

/**
 * Get all active challenges with progress
 */
export function getChallengesWithProgress(entries: MealEntry[]): Array<Challenge & ChallengeProgress> {
  const challenges = getActiveChallenges();
  
  return challenges.map(challenge => ({
    ...challenge,
    ...calculateChallengeProgress(challenge, entries),
  }));
}

/**
 * Calculate user's overall challenge statistics
 */
export function getUserChallengeStats(
  entries: MealEntry[],
  completedChallenges: string[],
  totalXP?: number
): UserChallengeStats {
  const challenges = getActiveChallenges();
  const currentProgress = challenges.map(c => calculateChallengeProgress(c, entries));
  
  const totalCompleted = completedChallenges.length + currentProgress.filter(p => p.completed).length;
  
  // Use provided totalXP if available, otherwise calculate from completed challenges
  const totalXPEarned = totalXP !== undefined ? totalXP : completedChallenges.reduce((sum, id) => {
    const challenge = challenges.find(c => c.id === id);
    return sum + (challenge?.xpReward || 0);
  }, 0);
  
  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const weekStart = new Date(checkDate);
    weekStart.setDate(checkDate.getDate() - checkDate.getDay());
    
    const weekChallenges = challenges.filter(c => {
      const cStart = new Date(c.startDate);
      return cStart.toDateString() === weekStart.toDateString();
    });
    
    const hasCompletion = weekChallenges.some(c => {
      const progress = calculateChallengeProgress(c, entries);
      return progress.completed;
    });
    
    if (hasCompletion) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  const achievements: string[] = [];
  if (totalCompleted >= 50) achievements.push('🏆 Century Club');
  if (totalCompleted >= 25) achievements.push('🌟 Challenge Master');
  if (totalCompleted >= 10) achievements.push('🎯 Go-Getter');
  if (currentStreak >= 4) achievements.push('🔥 On Fire');
  if (currentProgress.every(p => p.completed)) achievements.push('💯 Perfect Week');
  
  return {
    totalCompleted,
    currentStreak: Math.floor(currentStreak / 4), // Convert to weeks
    longestStreak: Math.floor(currentStreak / 4),
    totalXPEarned,
    favoriteCategory: 'Nutrition', // Could be calculated from completed challenges
    rank: Math.max(1, 1000 - totalCompleted * 10), // Simulated global rank
    achievements,
  };
}

/**
 * Get recommended challenges based on user's habits
 */
export function getRecommendedChallenges(entries: MealEntry[]): Challenge[] {
  const all = getActiveChallenges();
  const progress = all.map(c => ({
    challenge: c,
    progress: calculateChallengeProgress(c, entries),
  }));
  
  // Recommend challenges that are:
  // 1. Not completed
  // 2. Have some progress
  // 3. Are achievable (>20% progress)
  
  const recommended = progress
    .filter(p => !p.progress.completed && p.progress.percentage > 20 && p.progress.percentage < 90)
    .sort((a, b) => b.progress.percentage - a.progress.percentage)
    .slice(0, 3)
    .map(p => p.challenge);
  
  return recommended;
}

/**
 * Get leaderboard for a specific challenge
 */
export function getChallengeLeaderboard(challengeId: string): Array<{
  rank: number;
  username: string;
  score: number;
  isYou: boolean;
}> {
  // Simulated leaderboard data
  const names = [
    'FoodieChef', 'HealthNut', 'MealMaster', 'CookingKing', 'VeggieQueen',
    'ProteinPro', 'BudgetBoss', 'PrepGuru', 'NutritionNerd', 'FitnessFoodie'
  ];
  
  const leaderboard = names.map((name, i) => ({
    rank: i + 1,
    username: name,
    score: Math.floor(Math.random() * 100) + 50,
    isYou: false,
  }));
  
  // Add user to leaderboard
  leaderboard.push({
    rank: Math.floor(Math.random() * 20) + 1,
    username: 'You',
    score: Math.floor(Math.random() * 80) + 40,
    isYou: true,
  });
  
  return leaderboard.sort((a, b) => b.score - a.score).map((item, i) => ({
    ...item,
    rank: i + 1,
  }));
}
