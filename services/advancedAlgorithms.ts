/**
 * Advanced algorithmic analysis combining multiple data points
 * to provide powerful insights and predictions
 */

import { MealEntry } from '@/hooks/useEntries';
import { Recipe } from './recipes';

/**
 * ALGORITHM 1: Predictive Meal Timing Engine
 * Learns your eating patterns and predicts optimal meal times
 */
export interface MealTimePrediction {
  predictedTime: Date;
  confidence: number; // 0-1
  reason: string;
  hungerLevel: number; // 1-10
}

export function predictNextMealTime(entries: MealEntry[]): MealTimePrediction {
  if (entries.length === 0) {
    return {
      predictedTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      confidence: 0.3,
      reason: 'Default prediction (no data)',
      hungerLevel: 5,
    };
  }

  const lastMeal = entries[0];
  const now = new Date();
  const lastMealTime = new Date(lastMeal.time);
  const hoursSince = (now.getTime() - lastMealTime.getTime()) / (1000 * 60 * 60);

  // Analyze historical patterns
  const timeGaps: number[] = [];
  for (let i = 0; i < entries.length - 1 && i < 20; i++) {
    const gap = (new Date(entries[i].time).getTime() - new Date(entries[i + 1].time).getTime()) / (1000 * 60 * 60);
    if (gap < 12 && gap > 0.5) { // Only count reasonable gaps
      timeGaps.push(gap);
    }
  }

  const avgGap = timeGaps.length > 0 
    ? timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length 
    : 4;

  // Factor in last meal's satiety
  const proteinFactor = Math.min((lastMeal.protein || 0) / 30, 1);
  const fiberFactor = Math.min((lastMeal.fiber || 0) / 10, 1);
  const satietyMultiplier = 1 + (proteinFactor * 0.3) + (fiberFactor * 0.2);
  
  const predictedGap = avgGap * satietyMultiplier;
  const predictedTime = new Date(lastMealTime.getTime() + predictedGap * 60 * 60 * 1000);
  
  // Calculate confidence based on data consistency
  const gapVariance = timeGaps.length > 1
    ? timeGaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / timeGaps.length
    : 10;
  const confidence = Math.max(0.3, Math.min(0.95, 1 - (gapVariance / 10)));

  // Predict hunger level
  const hungerLevel = Math.min(10, Math.max(1, Math.round((hoursSince / predictedGap) * 10)));

  return {
    predictedTime,
    confidence,
    reason: `Based on your ${timeGaps.length} recent meals (avg ${avgGap.toFixed(1)}h gap) + meal composition`,
    hungerLevel,
  };
}

/**
 * ALGORITHM 2: Smart Recipe Recommender
 * Suggests recipes based on your eating history, preferences, and constraints
 */
export interface RecipeRecommendation {
  recipe: Recipe;
  score: number; // 0-100
  reasons: string[];
  matchesBudget: boolean;
  matchesTime: boolean;
  matchesMacros: boolean;
}

export function recommendRecipes(
  recipes: Recipe[],
  entries: MealEntry[],
  preferences: {
    maxCost?: number;
    maxTime?: number;
    targetProtein?: number;
    avoidCategories?: string[];
  }
): RecipeRecommendation[] {
  const recommendations: RecipeRecommendation[] = [];

  // Analyze user's eating patterns
  const favoriteFoods = new Map<string, number>();
  const categoryPreference = new Map<string, number>();
  
  entries.forEach(entry => {
    const food = entry.what.toLowerCase();
    favoriteFoods.set(food, (favoriteFoods.get(food) || 0) + 1);
    
    entry.tags?.forEach(tag => {
      categoryPreference.set(tag, (categoryPreference.get(tag) || 0) + 1);
    });
  });

  for (const recipe of recipes) {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Budget match
    const matchesBudget = !preferences.maxCost || (recipe.estimatedCost || 0) <= preferences.maxCost;
    if (matchesBudget) {
      score += 15;
      reasons.push('Within budget');
    } else {
      score -= 20;
    }

    // Time match
    const matchesTime = !preferences.maxTime || (recipe.estimatedTime || 0) <= preferences.maxTime;
    if (matchesTime) {
      score += 15;
      reasons.push('Quick to prepare');
    }

    // Macro match (simplified - would need nutrition API for recipes)
    const matchesMacros = true; // Placeholder
    if (matchesMacros && preferences.targetProtein) {
      score += 10;
      reasons.push('Good protein source');
    }

    // Category preference
    const categoryMatch = categoryPreference.get(recipe.category) || 0;
    if (categoryMatch > 0) {
      score += Math.min(20, categoryMatch * 3);
      reasons.push(`You often eat ${recipe.category}`);
    }

    // Ingredient familiarity
    let familiarIngredients = 0;
    recipe.ingredients.forEach(item => {
      const ingredient = item.ingredient.toLowerCase();
      if (Array.from(favoriteFoods.keys()).some(food => food.includes(ingredient) || ingredient.includes(food))) {
        familiarIngredients++;
      }
    });
    
    if (familiarIngredients > 0) {
      score += Math.min(15, familiarIngredients * 3);
      reasons.push(`Uses ingredients you like`);
    }

    // Variety bonus (haven't eaten recently)
    const recentFoods = entries.slice(0, 10).map(e => e.what.toLowerCase());
    const isNovel = !recentFoods.some(food => 
      recipe.name.toLowerCase().includes(food) || food.includes(recipe.name.toLowerCase())
    );
    if (isNovel) {
      score += 10;
      reasons.push('Adds variety');
    }

    // Avoid categories penalty
    if (preferences.avoidCategories?.includes(recipe.category)) {
      score -= 30;
    }

    recommendations.push({
      recipe,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      matchesBudget,
      matchesTime,
      matchesMacros,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * ALGORITHM 3: Budget Optimizer
 * Finds the optimal food choices to hit nutritional goals within budget
 */
export interface BudgetOptimization {
  dailyTarget: number;
  recommended: {
    food: string;
    cost: number;
    calories: number;
    protein: number;
    efficiency: number;
  }[];
  projectedSpending: number;
  savings: number;
}

export function optimizeFoodBudget(
  entries: MealEntry[],
  weeklyBudget: number,
  calorieGoal: number = 2000
): BudgetOptimization {
  // Calculate efficiency: (calories + protein * 10) / cost
  const foodEfficiency = entries
    .filter(e => e.cost && e.cost > 0 && e.calories)
    .map(e => ({
      food: e.what,
      cost: e.cost!,
      calories: e.calories || 0,
      protein: e.protein || 0,
      efficiency: ((e.calories || 0) + (e.protein || 0) * 10) / e.cost!,
    }))
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 10);

  const dailyTarget = weeklyBudget / 7;
  
  // Calculate projected spending if using top efficient foods
  const avgEfficientCost = foodEfficiency.slice(0, 3).reduce((sum, f) => sum + f.cost, 0) / Math.max(1, Math.min(3, foodEfficiency.length));
  const mealsPerDay = 3;
  const projectedSpending = avgEfficientCost * mealsPerDay * 7;
  
  return {
    dailyTarget,
    recommended: foodEfficiency,
    projectedSpending,
    savings: weeklyBudget - projectedSpending,
  };
}

/**
 * ALGORITHM 4: Streak & Habit Analyzer
 * Identifies your consistent patterns and suggests how to build better habits
 */
export interface HabitPattern {
  habit: string;
  currentStreak: number;
  longestStreak: number;
  consistency: number; // 0-100%
  trend: 'improving' | 'stable' | 'declining';
  suggestion: string;
}

export function analyzeHabits(entries: MealEntry[]): HabitPattern[] {
  const patterns: HabitPattern[] = [];

  // Analyze home cooking streak
  const homeCookedStreak = calculateStreak(entries, e => e.tags?.includes('Home-cooked') || false);
  const homeCookedConsistency = calculateConsistency(entries, e => e.tags?.includes('Home-cooked') || false);
  patterns.push({
    habit: 'Home Cooking',
    currentStreak: homeCookedStreak.current,
    longestStreak: homeCookedStreak.longest,
    consistency: homeCookedConsistency,
    trend: homeCookedStreak.current > homeCookedStreak.longest * 0.7 ? 'improving' : 'stable',
    suggestion: homeCookedStreak.current >= 5 
      ? 'Amazing! Keep the streak going!' 
      : 'Try meal prepping to make home cooking easier',
  });

  // Analyze protein intake
  const proteinStreak = calculateStreak(entries, e => (e.protein || 0) >= 20);
  patterns.push({
    habit: 'High Protein Meals',
    currentStreak: proteinStreak.current,
    longestStreak: proteinStreak.longest,
    consistency: calculateConsistency(entries, e => (e.protein || 0) >= 20),
    trend: proteinStreak.current > proteinStreak.longest * 0.7 ? 'improving' : 'stable',
    suggestion: 'Aim for 20g+ protein per meal for better satiety',
  });

  // Analyze meal timing consistency
  const timingVariance = calculateMealTimingVariance(entries);
  const timingConsistency = Math.max(0, 100 - timingVariance);
  patterns.push({
    habit: 'Consistent Meal Times',
    currentStreak: 0,
    longestStreak: 0,
    consistency: timingConsistency,
    trend: timingConsistency > 70 ? 'stable' : 'declining',
    suggestion: timingConsistency > 70 
      ? 'Great rhythm! Your body loves consistency' 
      : 'Try eating at similar times daily for better hunger regulation',
  });

  return patterns;
}

/**
 * Helper: Calculate streak for a condition
 */
function calculateStreak(entries: MealEntry[], condition: (entry: MealEntry) => boolean): { current: number; longest: number } {
  let current = 0;
  let longest = 0;
  let temp = 0;

  for (const entry of entries) {
    if (condition(entry)) {
      temp++;
      if (current === 0 || entries.indexOf(entry) === 0) {
        current = temp;
      }
      longest = Math.max(longest, temp);
    } else {
      if (current > 0 && current === temp) {
        current = 0;
      }
      temp = 0;
    }
  }

  return { current, longest };
}

/**
 * Helper: Calculate consistency percentage
 */
function calculateConsistency(entries: MealEntry[], condition: (entry: MealEntry) => boolean): number {
  const matching = entries.filter(condition).length;
  return Math.round((matching / Math.max(1, entries.length)) * 100);
}

/**
 * Helper: Calculate meal timing variance (lower is better)
 */
function calculateMealTimingVariance(entries: MealEntry[]): number {
  const hoursByMeal = new Map<string, number[]>();
  
  entries.forEach(entry => {
    const hour = new Date(entry.time).getHours();
    const mealType = entry.tags?.find(t => ['Breakfast', 'Lunch', 'Dinner'].includes(t)) || 'Other';
    
    if (!hoursByMeal.has(mealType)) {
      hoursByMeal.set(mealType, []);
    }
    hoursByMeal.get(mealType)!.push(hour);
  });

  let totalVariance = 0;
  let count = 0;

  hoursByMeal.forEach((hours) => {
    if (hours.length < 2) return;
    
    const avg = hours.reduce((sum, h) => sum + h, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
    
    totalVariance += Math.sqrt(variance);
    count++;
  });

  return count > 0 ? totalVariance / count : 50;
}

/**
 * ALGORITHM 5: Nutrition Gap Analyzer
 * Identifies nutritional deficiencies and suggests foods to fill gaps
 */
export interface NutritionGap {
  nutrient: string;
  current: number;
  target: number;
  gap: number;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export function analyzeNutritionGaps(
  entries: MealEntry[],
  targets: { protein: number; fiber: number }
): NutritionGap[] {
  const recent7Days = entries.filter(e => {
    const daysAgo = (Date.now() - new Date(e.time).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7;
  });

  const avgProtein = recent7Days.reduce((sum, e) => sum + (e.protein || 0), 0) / Math.max(1, recent7Days.length);
  const avgFiber = recent7Days.reduce((sum, e) => sum + (e.fiber || 0), 0) / Math.max(1, recent7Days.length);

  const gaps: NutritionGap[] = [];

  // Protein gap
  const proteinGap = targets.protein - avgProtein;
  if (proteinGap > 5) {
    gaps.push({
      nutrient: 'Protein',
      current: Math.round(avgProtein),
      target: targets.protein,
      gap: Math.round(proteinGap),
      severity: proteinGap > 30 ? 'high' : proteinGap > 15 ? 'medium' : 'low',
      suggestions: [
        'Add chicken breast (+30g protein)',
        'Greek yogurt breakfast (+15g)',
        'Protein shake (+25g)',
        'Eggs for lunch (+12g per 2 eggs)',
      ],
    });
  }

  // Fiber gap
  const fiberGap = targets.fiber - avgFiber;
  if (fiberGap > 3) {
    gaps.push({
      nutrient: 'Fiber',
      current: Math.round(avgFiber),
      target: targets.fiber,
      gap: Math.round(fiberGap),
      severity: fiberGap > 15 ? 'high' : fiberGap > 8 ? 'medium' : 'low',
      suggestions: [
        'Add berries to breakfast (+4g)',
        'Switch to whole grain bread (+3g)',
        'Add beans to meals (+8g)',
        'Snack on vegetables (+5g)',
      ],
    });
  }

  return gaps;
}
