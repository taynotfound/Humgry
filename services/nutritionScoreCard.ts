import { MealEntry } from '@/hooks/useEntries';

export interface NutritionScore {
  category: string;
  current: number;
  target: number;
  percentage: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  emoji: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
  message: string;
}

export interface DailyScoreCard {
  date: string;
  scores: NutritionScore[];
  overallGrade: string;
  overallScore: number; // 0-100
  xpEarned: number;
  streaks: {
    name: string;
    count: number;
    emoji: string;
  }[];
  achievements: string[];
}

/**
 * Calculate grade from percentage
 */
function calculateGrade(percentage: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentage >= 95) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 75) return 'B';
  if (percentage >= 65) return 'C';
  if (percentage >= 55) return 'D';
  return 'F';
}

/**
 * Calculate color for grade
 */
function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+': return '#4CAF50';
    case 'A': return '#8BC34A';
    case 'B': return '#FFC107';
    case 'C': return '#FF9800';
    case 'D': return '#FF5722';
    case 'F': return '#F44336';
    default: return '#9E9E9E';
  }
}

/**
 * Calculate trend by comparing to previous period
 */
function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const diff = current - previous;
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}

/**
 * Generate daily nutrition score card
 */
export function generateDailyScoreCard(
  entries: MealEntry[],
  targets: {
    calories: number;
    protein: number;
    fiber: number;
    budget?: number;
  }
): DailyScoreCard {
  const today = new Date().toDateString();
  const todayEntries = entries.filter(e => new Date(e.time).toDateString() === today);
  
  // Get yesterday's data for trend
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayEntries = entries.filter(e => new Date(e.time).toDateString() === yesterday.toDateString());
  
  // Calculate totals
  const totalCalories = todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const totalProtein = todayEntries.reduce((sum, e) => sum + (e.protein || 0), 0);
  const totalFiber = todayEntries.reduce((sum, e) => sum + (e.fiber || 0), 0);
  const totalCost = todayEntries.reduce((sum, e) => sum + (e.cost || 0), 0);
  
  const yesterdayCalories = yesterdayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const yesterdayProtein = yesterdayEntries.reduce((sum, e) => sum + (e.protein || 0), 0);
  const yesterdayFiber = yesterdayEntries.reduce((sum, e) => sum + (e.fiber || 0), 0);
  
  const scores: NutritionScore[] = [];
  
  // Calories Score
  const caloriePercentage = Math.min(100, (totalCalories / targets.calories) * 100);
  const calorieGrade = calculateGrade(caloriePercentage);
  scores.push({
    category: 'Calories',
    current: Math.round(totalCalories),
    target: targets.calories,
    percentage: Math.round(caloriePercentage),
    grade: calorieGrade,
    emoji: '🔥',
    color: getGradeColor(calorieGrade),
    trend: calculateTrend(totalCalories, yesterdayCalories),
    message: caloriePercentage >= 95 
      ? 'Perfect energy balance!' 
      : caloriePercentage >= 80 
        ? 'Good energy intake' 
        : caloriePercentage < 70 
          ? 'Eat more to hit your goal' 
          : 'Almost there!',
  });
  
  // Protein Score
  const proteinPercentage = Math.min(100, (totalProtein / targets.protein) * 100);
  const proteinGrade = calculateGrade(proteinPercentage);
  scores.push({
    category: 'Protein',
    current: Math.round(totalProtein),
    target: targets.protein,
    percentage: Math.round(proteinPercentage),
    grade: proteinGrade,
    emoji: '💪',
    color: getGradeColor(proteinGrade),
    trend: calculateTrend(totalProtein, yesterdayProtein),
    message: proteinPercentage >= 90 
      ? 'Crushing your protein goals!' 
      : proteinPercentage >= 75 
        ? 'Good protein intake' 
        : `Need ${Math.round(targets.protein - totalProtein)}g more`,
  });
  
  // Fiber Score
  const fiberPercentage = Math.min(100, (totalFiber / targets.fiber) * 100);
  const fiberGrade = calculateGrade(fiberPercentage);
  scores.push({
    category: 'Fiber',
    current: Math.round(totalFiber),
    target: targets.fiber,
    percentage: Math.round(fiberPercentage),
    grade: fiberGrade,
    emoji: '🥗',
    color: getGradeColor(fiberGrade),
    trend: calculateTrend(totalFiber, yesterdayFiber),
    message: fiberPercentage >= 90 
      ? 'Excellent fiber intake!' 
      : fiberPercentage >= 75 
        ? 'Good digestive health' 
        : 'Add more veggies and whole grains',
  });
  
  // Budget Score (if tracking)
  if (targets.budget && targets.budget > 0) {
    const budgetPercentage = Math.max(0, 100 - ((totalCost / targets.budget) * 100));
    const budgetGrade = calculateGrade(budgetPercentage);
    const savings = Math.max(0, targets.budget - totalCost);
    
    scores.push({
      category: 'Budget',
      current: Math.round(totalCost * 100) / 100,
      target: targets.budget,
      percentage: Math.round(budgetPercentage),
      grade: budgetGrade,
      emoji: '💰',
      color: getGradeColor(budgetGrade),
      trend: 'stable',
      message: savings > 0 
        ? `Saved $${savings.toFixed(2)} today!` 
        : totalCost > targets.budget 
          ? `Over budget by $${(totalCost - targets.budget).toFixed(2)}` 
          : 'On track!',
    });
  }
  
  // Calculate overall score
  const avgScore = scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length;
  const overallGrade = calculateGrade(avgScore);
  
  // Calculate XP earned
  let xpEarned = 0;
  scores.forEach(score => {
    if (score.percentage >= 95) xpEarned += 50;
    else if (score.percentage >= 85) xpEarned += 35;
    else if (score.percentage >= 75) xpEarned += 20;
    else if (score.percentage >= 65) xpEarned += 10;
  });
  
  // Add bonus XP for all A's
  if (scores.every(s => s.grade === 'A' || s.grade === 'A+')) {
    xpEarned += 100;
  }
  
  // Calculate streaks
  const streaks = calculateStreaks(entries);
  
  // Achievements
  const achievements: string[] = [];
  if (scores.every(s => s.grade === 'A+')) {
    achievements.push('🏆 Perfect Day!');
  }
  if (totalProtein >= targets.protein * 1.2) {
    achievements.push('💪 Protein Champion');
  }
  if (targets.budget && totalCost < targets.budget * 0.8) {
    achievements.push('💰 Budget Master');
  }
  if (todayEntries.every(e => e.tags?.includes('Home-cooked'))) {
    achievements.push('👨‍🍳 Home Chef');
  }
  
  return {
    date: today,
    scores,
    overallGrade,
    overallScore: Math.round(avgScore),
    xpEarned,
    streaks,
    achievements,
  };
}

/**
 * Calculate active streaks
 */
function calculateStreaks(entries: MealEntry[]): { name: string; count: number; emoji: string }[] {
  const streaks: { name: string; count: number; emoji: string }[] = [];
  
  // Home cooking streak
  let homeCookingStreak = 0;
  const sortedEntries = [...entries].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const uniqueDays = new Set<string>();
  
  for (const entry of sortedEntries) {
    const day = new Date(entry.time).toDateString();
    if (uniqueDays.has(day)) continue;
    uniqueDays.add(day);
    
    const dayEntries = entries.filter(e => new Date(e.time).toDateString() === day);
    const allHomeCooked = dayEntries.every(e => e.tags?.includes('Home-cooked'));
    
    if (allHomeCooked) {
      homeCookingStreak++;
    } else {
      break;
    }
    
    if (homeCookingStreak >= 30) break; // Cap display at 30 days
  }
  
  if (homeCookingStreak > 0) {
    streaks.push({
      name: 'Home Cooking',
      count: homeCookingStreak,
      emoji: '🏠',
    });
  }
  
  // Logging streak (consecutive days with entries)
  let loggingStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const hasEntry = entries.some(e => 
      new Date(e.time).toDateString() === checkDate.toDateString()
    );
    if (hasEntry) {
      loggingStreak++;
    } else {
      break;
    }
  }
  
  if (loggingStreak > 0) {
    streaks.push({
      name: 'Daily Logging',
      count: loggingStreak,
      emoji: '📝',
    });
  }
  
  return streaks;
}

/**
 * Get weekly score summary
 */
export function getWeeklyScoreSummary(entries: MealEntry[], targets: any): {
  weekAverage: number;
  bestDay: { date: string; score: number };
  improvement: number;
  totalXP: number;
} {
  const last7Days: DailyScoreCard[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayEntries = entries.filter(e => 
      new Date(e.time).toDateString() === date.toDateString()
    );
    
    if (dayEntries.length > 0) {
      const scoreCard = generateDailyScoreCard(
        entries.filter(e => new Date(e.time) <= date),
        targets
      );
      last7Days.push(scoreCard);
    }
  }
  
  const weekAverage = last7Days.reduce((sum, day) => sum + day.overallScore, 0) / Math.max(1, last7Days.length);
  const bestDay = last7Days.reduce((best, day) => 
    day.overallScore > best.score ? { date: day.date, score: day.overallScore } : best,
    { date: '', score: 0 }
  );
  
  const firstHalf = last7Days.slice(0, 3);
  const secondHalf = last7Days.slice(3, 7);
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.overallScore, 0) / Math.max(1, firstHalf.length);
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.overallScore, 0) / Math.max(1, secondHalf.length);
  const improvement = secondAvg - firstAvg;
  
  const totalXP = last7Days.reduce((sum, day) => sum + day.xpEarned, 0);
  
  return {
    weekAverage: Math.round(weekAverage),
    bestDay,
    improvement: Math.round(improvement),
    totalXP,
  };
}

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  progress: number;
  title: string;
} {
  // XP curve: Level N requires N * 500 XP
  let level = 1;
  let xpRequired = 500;
  let totalRequired = 0;
  
  while (totalXP >= totalRequired + xpRequired) {
    totalRequired += xpRequired;
    level++;
    xpRequired = level * 500;
  }
  
  const currentXP = totalXP - totalRequired;
  const progress = (currentXP / xpRequired) * 100;
  
  const titles = [
    'Beginner',
    'Novice Chef',
    'Home Cook',
    'Meal Planner',
    'Nutrition Aware',
    'Balanced Eater',
    'Health Conscious',
    'Meal Master',
    'Nutrition Pro',
    'Wellness Expert',
    'Food Scientist',
    'Culinary Artist',
    'Master Chef',
    'Nutrition Guru',
    'Legendary Cook',
  ];
  
  const title = titles[Math.min(level - 1, titles.length - 1)];
  
  return {
    level,
    currentXP: Math.round(currentXP),
    xpToNextLevel: xpRequired,
    progress: Math.round(progress),
    title,
  };
}
