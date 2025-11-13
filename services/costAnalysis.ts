import { MealEntry } from '@/hooks/useEntries';

export interface CostInsight {
  type: 'spending' | 'savings' | 'comparison' | 'achievement';
  title: string;
  message: string;
  amount: number;
  emoji: string;
}

export interface MonthlyCostBreakdown {
  total: number;
  byCategory: {
    '$': number;
    '$$': number;
    '$$$': number;
    '$$$$': number;
  };
  byTag: { [tag: string]: number };
  avgPerMeal: number;
  avgPerDay: number;
  homeCooked: number;
  takeout: number;
}

/**
 * Calculate total spent in a time period
 */
export function calculateTotalSpent(entries: MealEntry[], days: number = 30): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return entries
    .filter(e => new Date(e.time) > cutoff)
    .reduce((sum, e) => sum + (e.cost || 0), 0);
}

/**
 * Get detailed cost breakdown for the month
 */
export function getMonthlyBreakdown(entries: MealEntry[]): MonthlyCostBreakdown {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEntries = entries.filter(e => new Date(e.time) >= monthStart);
  
  const breakdown: MonthlyCostBreakdown = {
    total: 0,
    byCategory: { '$': 0, '$$': 0, '$$$': 0, '$$$$': 0 },
    byTag: {},
    avgPerMeal: 0,
    avgPerDay: 0,
    homeCooked: 0,
    takeout: 0,
  };
  
  monthEntries.forEach(entry => {
    const cost = entry.cost || 0;
    breakdown.total += cost;
    
    if (entry.costCategory) {
      breakdown.byCategory[entry.costCategory] += cost;
    }
    
    entry.tags?.forEach(tag => {
      if (!breakdown.byTag[tag]) breakdown.byTag[tag] = 0;
      breakdown.byTag[tag] += cost;
    });
    
    if (entry.tags?.includes('Home-cooked')) {
      breakdown.homeCooked += cost;
    }
    if (entry.tags?.includes('Takeout')) {
      breakdown.takeout += cost;
    }
  });
  
  breakdown.avgPerMeal = monthEntries.length > 0 ? breakdown.total / monthEntries.length : 0;
  
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  breakdown.avgPerDay = breakdown.total / daysInMonth;
  
  return breakdown;
}

/**
 * Calculate cost per calorie for meals
 */
export function calculateCostPerCalorie(entries: MealEntry[]): {
  food: string;
  costPerCalorie: number;
  totalSpent: number;
  totalCalories: number;
  timesEaten: number;
}[] {
  const foodStats = new Map<string, {
    totalCost: number;
    totalCalories: number;
    count: number;
  }>();
  
  entries.forEach(entry => {
    if (!entry.cost || !entry.calories) return;
    
    const food = entry.what.toLowerCase();
    if (!foodStats.has(food)) {
      foodStats.set(food, { totalCost: 0, totalCalories: 0, count: 0 });
    }
    
    const stats = foodStats.get(food)!;
    stats.totalCost += entry.cost;
    stats.totalCalories += entry.calories;
    stats.count += 1;
  });
  
  const results: any[] = [];
  foodStats.forEach((stats, food) => {
    results.push({
      food,
      costPerCalorie: stats.totalCost / stats.totalCalories,
      totalSpent: stats.totalCost,
      totalCalories: stats.totalCalories,
      timesEaten: stats.count,
    });
  });
  
  return results.sort((a, b) => a.costPerCalorie - b.costPerCalorie);
}

/**
 * Generate cost insights and recommendations
 */
export function generateCostInsights(entries: MealEntry[]): CostInsight[] {
  const insights: CostInsight[] = [];
  
  if (entries.filter(e => e.cost).length < 5) {
    return [{
      type: 'spending',
      title: 'Start tracking costs',
      message: 'Add costs to your meals to unlock spending insights!',
      amount: 0,
      emoji: '💰'
    }];
  }
  
  const monthlyBreakdown = getMonthlyBreakdown(entries);
  const weeklyTotal = calculateTotalSpent(entries, 7);
  const monthlyTotal = monthlyBreakdown.total;
  
  // Monthly spending insight
  insights.push({
    type: 'spending',
    title: 'Monthly Food Budget',
    message: `You've spent $${monthlyTotal.toFixed(2)} on food this month`,
    amount: monthlyTotal,
    emoji: '📊'
  });
  
  // Home cooking vs takeout
  if (monthlyBreakdown.homeCooked > 0 && monthlyBreakdown.takeout > 0) {
    const savings = monthlyBreakdown.takeout - monthlyBreakdown.homeCooked;
    if (monthlyBreakdown.homeCooked < monthlyBreakdown.takeout) {
      insights.push({
        type: 'comparison',
        title: 'Home Cooking Saves Money',
        message: `Takeout costs you $${(monthlyBreakdown.takeout / monthlyBreakdown.homeCooked).toFixed(1)}x more than home cooking`,
        amount: savings,
        emoji: '🏠'
      });
    }
  }
  
  // Cost efficiency
  const costPerCal = calculateCostPerCalorie(entries);
  if (costPerCal.length >= 2) {
    const mostEfficient = costPerCal[0];
    const leastEfficient = costPerCal[costPerCal.length - 1];
    
    if (mostEfficient.timesEaten >= 3) {
      insights.push({
        type: 'achievement',
        title: 'Best Value Meal',
        message: `${mostEfficient.food} is your most cost-effective choice at $${(mostEfficient.costPerCalorie * 100).toFixed(3)} per 100 calories`,
        amount: mostEfficient.totalSpent,
        emoji: '🏆'
      });
    }
    
    if (leastEfficient.costPerCalorie > mostEfficient.costPerCalorie * 3 && leastEfficient.timesEaten >= 2) {
      insights.push({
        type: 'spending',
        title: 'Expensive Choice',
        message: `${leastEfficient.food} costs ${(leastEfficient.costPerCalorie / mostEfficient.costPerCalorie).toFixed(1)}x more per calorie than ${mostEfficient.food}`,
        amount: leastEfficient.totalSpent,
        emoji: '💸'
      });
    }
  }
  
  // Streak bonus
  const last7Days = entries.slice(0, 7);
  const homeCookedStreak = last7Days.filter(e => e.tags?.includes('Home-cooked')).length;
  if (homeCookedStreak >= 5) {
    const avgTakeoutCost = monthlyBreakdown.takeout / (entries.filter(e => e.tags?.includes('Takeout')).length || 1);
    const estimatedSavings = homeCookedStreak * (avgTakeoutCost * 0.5);
    
    insights.push({
      type: 'savings',
      title: `${homeCookedStreak}-Day Home Cooking Streak!`,
      message: `You've saved approximately $${estimatedSavings.toFixed(2)} this week by cooking at home`,
      amount: estimatedSavings,
      emoji: '🔥'
    });
  }
  
  // Weekly projection
  const weeklyProjection = (weeklyTotal / 7) * 30;
  if (weeklyProjection > monthlyTotal * 1.2) {
    insights.push({
      type: 'spending',
      title: 'Spending Increase',
      message: `Your current pace projects $${weeklyProjection.toFixed(2)}/month - ${((weeklyProjection / monthlyTotal - 1) * 100).toFixed(0)}% higher than usual`,
      amount: weeklyProjection - monthlyTotal,
      emoji: '📈'
    });
  }
  
  return insights;
}

/**
 * Calculate budget status
 */
export function calculateBudgetStatus(
  entries: MealEntry[], 
  weeklyBudget: number
): {
  spent: number;
  remaining: number;
  percentUsed: number;
  onTrack: boolean;
  projectedTotal: number;
} {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEntries = entries.filter(e => new Date(e.time) >= weekStart);
  const spent = weekEntries.reduce((sum, e) => sum + (e.cost || 0), 0);
  
  const dayOfWeek = now.getDay();
  const dailyBudget = weeklyBudget / 7;
  const expectedSpending = dailyBudget * (dayOfWeek + 1);
  const onTrack = spent <= expectedSpending * 1.1; // 10% buffer
  
  const projectedTotal = (spent / (dayOfWeek + 1)) * 7;
  
  return {
    spent,
    remaining: weeklyBudget - spent,
    percentUsed: (spent / weeklyBudget) * 100,
    onTrack,
    projectedTotal,
  };
}

/**
 * Estimate meal cost from category if exact cost not provided
 */
export function estimateCostFromCategory(category: '$' | '$$' | '$$$' | '$$$$'): number {
  const estimates = {
    '$': 5,
    '$$': 12,
    '$$$': 25,
    '$$$$': 50,
  };
  return estimates[category];
}
