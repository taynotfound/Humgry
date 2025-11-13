import { MealEntry } from '@/hooks/useEntries';

export interface HungerPattern {
  timeOfDay: string; // "14:00"
  dayOfWeek: number; // 0-6
  avgHunger: number;
  frequency: number; // How often this pattern occurs
}

export interface FoodEffectiveness {
  foodName: string;
  avgTimeBetweenMeals: number; // in hours
  avgFullness: number;
  timesEaten: number;
  effectiveness: number; // Calculated score
}

export interface HungerInsight {
  type: 'pattern' | 'warning' | 'suggestion' | 'achievement';
  title: string;
  message: string;
  emoji: string;
  data?: any;
}

/**
 * Calculate how long a meal kept the user satisfied
 */
export function calculateMealEffectiveness(meal: MealEntry, nextMeal?: MealEntry): number {
  if (!nextMeal) return 0;
  
  const mealTime = new Date(meal.time);
  const nextTime = new Date(nextMeal.time);
  const hoursBetween = (nextTime.getTime() - mealTime.getTime()) / (1000 * 60 * 60);
  
  // Factor in fullness, protein, fiber
  const fullnessBonus = (meal.fullness || 3) / 5;
  const proteinBonus = Math.min((meal.protein || 0) / 30, 1); // Max at 30g
  const fiberBonus = Math.min((meal.fiber || 0) / 10, 1); // Max at 10g
  
  return hoursBetween * (1 + fullnessBonus + proteinBonus + fiberBonus);
}

/**
 * Analyze which foods keep you full longest
 */
export function analyzeFoodEffectiveness(entries: MealEntry[]): FoodEffectiveness[] {
  const foodStats = new Map<string, {
    totalTimeBetween: number;
    totalFullness: number;
    count: number;
  }>();
  
  // Sort entries by time
  const sorted = [...entries].sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  );
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const meal = sorted[i];
    const nextMeal = sorted[i + 1];
    const foodName = meal.what.toLowerCase();
    
    const hoursBetween = (new Date(nextMeal.time).getTime() - new Date(meal.time).getTime()) / (1000 * 60 * 60);
    
    if (!foodStats.has(foodName)) {
      foodStats.set(foodName, { totalTimeBetween: 0, totalFullness: 0, count: 0 });
    }
    
    const stats = foodStats.get(foodName)!;
    stats.totalTimeBetween += hoursBetween;
    stats.totalFullness += meal.fullness || 3;
    stats.count += 1;
  }
  
  const results: FoodEffectiveness[] = [];
  foodStats.forEach((stats, foodName) => {
    const avgTime = stats.totalTimeBetween / stats.count;
    const avgFullness = stats.totalFullness / stats.count;
    
    results.push({
      foodName,
      avgTimeBetweenMeals: avgTime,
      avgFullness,
      timesEaten: stats.count,
      effectiveness: avgTime * (avgFullness / 3) // Normalize to 3 = baseline
    });
  });
  
  return results.sort((a, b) => b.effectiveness - a.effectiveness);
}

/**
 * Find patterns in when user gets hungry
 */
export function findHungerPatterns(entries: MealEntry[]): HungerPattern[] {
  const patterns = new Map<string, { totalHunger: number; count: number }>();
  
  entries.forEach(entry => {
    if (!entry.hungerBefore) return;
    
    const date = new Date(entry.time);
    const hour = date.getHours();
    const day = date.getDay();
    const key = `${day}-${hour}`;
    
    if (!patterns.has(key)) {
      patterns.set(key, { totalHunger: 0, count: 0 });
    }
    
    const pattern = patterns.get(key)!;
    pattern.totalHunger += entry.hungerBefore;
    pattern.count += 1;
  });
  
  const results: HungerPattern[] = [];
  patterns.forEach((data, key) => {
    const [day, hour] = key.split('-').map(Number);
    results.push({
      timeOfDay: `${hour.toString().padStart(2, '0')}:00`,
      dayOfWeek: day,
      avgHunger: data.totalHunger / data.count,
      frequency: data.count,
    });
  });
  
  return results.filter(p => p.frequency >= 2).sort((a, b) => b.avgHunger - a.avgHunger);
}

/**
 * Generate insights based on eating patterns
 */
export function generateHungerInsights(entries: MealEntry[]): HungerInsight[] {
  const insights: HungerInsight[] = [];
  
  if (entries.length < 3) {
    return [{
      type: 'suggestion',
      title: 'Start tracking hunger',
      message: 'Log a few more meals to unlock pattern insights!',
      emoji: '📊'
    }];
  }
  
  // Find best/worst foods
  const effectiveness = analyzeFoodEffectiveness(entries);
  if (effectiveness.length >= 2) {
    const best = effectiveness[0];
    const worst = effectiveness[effectiveness.length - 1];
    
    if (best.timesEaten >= 3) {
      insights.push({
        type: 'achievement',
        title: 'Champion Food Discovered',
        message: `${best.foodName} keeps you satisfied for ${best.avgTimeBetweenMeals.toFixed(1)} hours on average!`,
        emoji: '🏆',
        data: best
      });
    }
    
    if (worst.timesEaten >= 3 && worst.avgTimeBetweenMeals < 2.5) {
      insights.push({
        type: 'warning',
        title: 'Low Satiety Alert',
        message: `${worst.foodName} only keeps you full for ${worst.avgTimeBetweenMeals.toFixed(1)} hours. Consider adding protein or fiber.`,
        emoji: '⚠️',
        data: worst
      });
    }
  }
  
  // Find hunger patterns
  const patterns = findHungerPatterns(entries);
  if (patterns.length > 0) {
    const topPattern = patterns[0];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    insights.push({
      type: 'pattern',
      title: 'Recurring Hunger Pattern',
      message: `You're often hungry around ${topPattern.timeOfDay} on ${days[topPattern.dayOfWeek]}s`,
      emoji: '🔍',
      data: topPattern
    });
  }
  
  // Check recent meal timing
  const recentMeals = entries.slice(0, 3);
  if (recentMeals.length >= 2) {
    const lastMeal = recentMeals[0];
    const predictedNext = lastMeal.nextEatAt ? new Date(lastMeal.nextEatAt) : null;
    const now = new Date();
    
    if (predictedNext && now > predictedNext) {
      const hoursLate = (now.getTime() - predictedNext.getTime()) / (1000 * 60 * 60);
      if (hoursLate > 0.5) {
        insights.push({
          type: 'warning',
          title: 'Time to Eat?',
          message: `Based on your last meal, you might be getting hungry soon!`,
          emoji: '⏰'
        });
      }
    }
  }
  
  return insights;
}

/**
 * Calculate current hunger score based on time since last meal
 */
export function calculateCurrentHungerScore(entries: MealEntry[]): {
  score: number; // 0-10
  status: 'satisfied' | 'getting-hungry' | 'hungry' | 'very-hungry';
  message: string;
} {
  if (entries.length === 0) {
    return {
      score: 5,
      status: 'getting-hungry',
      message: 'No meals logged yet'
    };
  }
  
  const lastMeal = entries[0];
  const now = new Date();
  const lastMealTime = new Date(lastMeal.time);
  const hoursSince = (now.getTime() - lastMealTime.getTime()) / (1000 * 60 * 60);
  
  const predictedNext = lastMeal.nextEatAt ? new Date(lastMeal.nextEatAt) : null;
  
  if (predictedNext) {
    const hoursUntilNext = (predictedNext.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilNext > 2) {
      return { score: 2, status: 'satisfied', message: 'You should be feeling satisfied' };
    } else if (hoursUntilNext > 0) {
      return { score: 5, status: 'getting-hungry', message: 'You might start feeling hungry soon' };
    } else if (hoursUntilNext > -1) {
      return { score: 7, status: 'hungry', message: 'Time to eat soon!' };
    } else {
      return { score: 9, status: 'very-hungry', message: 'You\'re probably quite hungry now' };
    }
  }
  
  // Fallback based on hours since last meal
  if (hoursSince < 2) return { score: 2, status: 'satisfied', message: 'Recently ate' };
  if (hoursSince < 4) return { score: 5, status: 'getting-hungry', message: 'Normal interval' };
  if (hoursSince < 6) return { score: 7, status: 'hungry', message: 'Getting hungry' };
  return { score: 9, status: 'very-hungry', message: 'Very hungry' };
}

/**
 * Generate heatmap data for hunger patterns across week
 */
export function generateHungerHeatmap(entries: MealEntry[]): number[][] {
  // 7 days x 24 hours
  const heatmap: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
  const counts: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
  
  entries.forEach(entry => {
    if (!entry.hungerBefore) return;
    
    const date = new Date(entry.time);
    const day = date.getDay();
    const hour = date.getHours();
    
    heatmap[day][hour] += entry.hungerBefore;
    counts[day][hour] += 1;
  });
  
  // Calculate averages
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (counts[d][h] > 0) {
        heatmap[d][h] = heatmap[d][h] / counts[d][h];
      }
    }
  }
  
  return heatmap;
}
