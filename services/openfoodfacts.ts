// OpenFoodFacts API integration
import { FoodProduct, Nutriments, isValidNutriments } from '../types';

export type { FoodProduct, Nutriments };

export async function searchFood(query: string): Promise<FoodProduct[]> {
  if (!query || query.length < 2) return [];
  
  try {
    // Search with category tags to get generic foods first
    const categorySearch = `${encodeURIComponent(query)}`;
    const response = await fetch(
      `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${categorySearch}&search_simple=1&action=process&json=1&page_size=30&sort_by=unique_scans_n`
    );
    const data = await response.json();
    
    if (!data.products) return [];
    
    const queryLower = query.toLowerCase().trim();
    
    // Filter and score results
    const scoredProducts = data.products
      .filter((p: any) => p?.product_name && isValidNutriments(p?.nutriments))
      .map((p: any) => {
        const nameLower = (p?.product_name ?? '').toLowerCase();
        const genericName = (p?.generic_name ?? '').toLowerCase();
        
        // Scoring: prefer exact matches and simple products without brands
        let score = 0;
        
        // Exact match gets highest score
        if (nameLower === queryLower || genericName === queryLower) score += 100;
        
        // Starts with query
        if (nameLower.startsWith(queryLower)) score += 50;
        
        // Contains query
        if (nameLower.includes(queryLower)) score += 20;
        
        // Prefer products without brands (more generic)
        if (!p.brands || p.brands.trim().length === 0) score += 30;
        
        // Prefer shorter names (likely more generic)
        score += Math.max(0, 20 - nameLower.length / 5);
        
        // Prefer products with nutriscore (usually better data)
        if (p.nutriscore_grade) score += 10;
        
        // Prefer products with images
        if (p.image_url || p.image_front_url) score += 5;
        
        return {
          score,
          product: {
            id: p?.code ?? p?._id ?? `food-${Date.now()}`,
            name: p?.product_name ?? 'Unknown Product',
            brands: p?.brands,
            image_url: p?.image_url ?? p?.image_front_url ?? p?.image_small_url,
            nutriments: {
              'energy-kcal_100g': p?.nutriments?.['energy-kcal_100g'] ?? p?.nutriments?.['energy-kcal'],
              proteins_100g: p?.nutriments?.proteins_100g ?? p?.nutriments?.proteins,
              carbohydrates_100g: p?.nutriments?.carbohydrates_100g ?? p?.nutriments?.carbohydrates,
              fat_100g: p?.nutriments?.fat_100g ?? p?.nutriments?.fat,
              fiber_100g: p?.nutriments?.fiber_100g ?? p?.nutriments?.fiber,
            },
            serving_size: p?.serving_size,
            nutriscore_grade: p?.nutriscore_grade,
          },
        };
      });
    
    // Sort by score and return top 10
    return scoredProducts
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10)
      .map((item: any) => item.product);
  } catch (error) {
    console.error('OpenFoodFacts search error:', error);
    return [];
  }
}

export async function getFoodByBarcode(barcode: string): Promise<FoodProduct | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.net/api/v2/product/${barcode}`);
    const data = await response.json();
    
    if (data.status !== 1 || !data.product) return null;
    
    const p = data.product;
    if (!p || !isValidNutriments(p.nutriments)) return null;
    
    return {
      id: p?.code ?? barcode,
      name: p?.product_name ?? 'Unknown Product',
      brands: p?.brands,
      image_url: p?.image_url ?? p?.image_front_url,
      nutriments: {
        'energy-kcal_100g': p?.nutriments?.['energy-kcal_100g'],
        proteins_100g: p?.nutriments?.proteins_100g,
        carbohydrates_100g: p?.nutriments?.carbohydrates_100g,
        fat_100g: p?.nutriments?.fat_100g,
        fiber_100g: p?.nutriments?.fiber_100g,
      },
      serving_size: p?.serving_size,
      nutriscore_grade: p?.nutriscore_grade,
    };
  } catch (error) {
    console.error('OpenFoodFacts barcode lookup error:', error);
    return null;
  }
}

// Calculate next meal time based on nutritional data
export function calculateNextMealTime(params: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  amount: 'small' | 'medium' | 'large';
  fullness: number;
  timeOfDay: Date;
  sleepStart?: string;
  sleepEnd?: string;
}): Date {
  const { calories, protein, carbs, fat, fiber, amount, fullness, timeOfDay } = params;
  
  // Base calculation on calories and macros
  let baseHours = 3.5;
  
  // Calorie-based adjustment (more calories = longer wait)
  if (calories > 600) baseHours += 1.5;
  else if (calories > 400) baseHours += 1;
  else if (calories > 200) baseHours += 0.5;
  else if (calories < 100) baseHours -= 1;
  
  // Protein slows digestion (keeps you full longer)
  if (protein > 25) baseHours += 1;
  else if (protein > 15) baseHours += 0.5;
  
  // Fiber also slows digestion
  if (fiber > 10) baseHours += 0.5;
  else if (fiber > 5) baseHours += 0.25;
  
  // Fat slows digestion significantly
  if (fat > 20) baseHours += 1;
  else if (fat > 10) baseHours += 0.5;
  
  // Simple carbs digest quickly
  if (carbs > 50 && protein < 10 && fat < 5) baseHours -= 0.5;
  
  // Amount adjustment
  if (amount === 'small') baseHours -= 0.5;
  if (amount === 'large') baseHours += 0.5;
  
  // Fullness adjustment
  const fullnessAdj = ((fullness ?? 3) - 3) * 0.5;
  baseHours += fullnessAdj;
  
  // Ensure minimum 1 hour, max 8 hours
  baseHours = Math.max(1, Math.min(8, baseHours));
  
  // Calculate next meal time
  const nextMealTime = new Date(timeOfDay.getTime() + baseHours * 60 * 60 * 1000);
  
  // Respect sleep hours (default 10 PM to 7 AM)
  const sleepStartHour = params.sleepStart ? parseInt(params.sleepStart.split(':')[0]) : 22;
  const sleepEndHour = params.sleepEnd ? parseInt(params.sleepEnd.split(':')[0]) : 7;
  const sleepEndMinute = params.sleepEnd ? parseInt(params.sleepEnd.split(':')[1]) : 0;
  
  const hour = nextMealTime.getHours();
  const isSleepTime = hour >= sleepStartHour || hour < sleepEndHour;
  
  if (isSleepTime) {
    // If it falls in sleep time, push to configured wake time
    const morningTime = new Date(nextMealTime);
    if (hour >= sleepStartHour) {
      morningTime.setDate(morningTime.getDate() + 1);
    }
    morningTime.setHours(sleepEndHour, sleepEndMinute + 30, 0, 0);
    return morningTime;
  }
  
  return nextMealTime;
}

// Get random food tip
const FOOD_TIPS = [
  "⏰ Set reminders to eat - your body needs fuel even when you're busy!",
  "🍽️ Skipping meals can lead to overeating later - stay consistent!",
  "🧠 Your brain needs glucose to function - don't forget to eat!",
  "💪 Regular meals help maintain energy levels throughout the day",
  "🥗 Eating protein with every meal helps you stay full longer!",
  "💧 Don't forget to drink water throughout the day!",
  "⚡ Eating regularly can improve focus and productivity",
  "🌈 Try to eat a variety of colorful foods for different nutrients",
  "🥜 Healthy fats like nuts and avocados are great for satiety",
  "🍎 Fiber-rich foods slow digestion and keep you satisfied",
  "⏰ Eating at regular times helps regulate your hunger signals",
  "🧘 Listen to your body - eat when hungry, stop when satisfied",
  "🥦 Vegetables are low in calories but high in volume and nutrients",
  "🍳 Don't skip breakfast - it jumpstarts your metabolism",
  "😴 Good sleep improves hunger hormone regulation",
  "🏃 Regular activity helps regulate appetite naturally",
  "🍽️ Meal tracking helps you remember to eat throughout busy days",
  "🥤 Sometimes thirst is mistaken for hunger - hydrate first!",
  "🧠 Mindful eating helps you notice fullness cues better",
  "🎯 Aim for balance, not perfection, in your eating habits",
  "📱 This app is here to remind you - you deserve to eat well!",
  "⭐ Small, regular meals are better than forgetting to eat all day",
];

export function getRandomTip(): string {
  return FOOD_TIPS[Math.floor(Math.random() * FOOD_TIPS.length)];
}
