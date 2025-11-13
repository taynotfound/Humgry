// Centralized type definitions for Humngry app

// Recipe types
export interface Ingredient {
  ingredient: string;
  measure: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  thumbnail: string;
  ingredients: Ingredient[];
  youtubeUrl?: string;
  sourceUrl: string;
  estimatedCost?: number;
  estimatedTime?: number;
  servings?: number;
}

// OpenFoodFacts types
export interface Nutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
}

export interface FoodProduct {
  id: string;
  name: string;
  brands?: string;
  image_url?: string;
  nutriments: Nutriments;
  serving_size?: string;
  nutriscore_grade?: string;
}

// Meal entry types
export interface MealEntry {
  id: string;
  timestamp: string;
  foodName: string;
  amount: 'small' | 'medium' | 'large';
  fullness: number;
  nextMealTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// Shopping list types
export interface ShoppingListItem {
  id: string;
  ingredient: string;
  measure: string;
  recipeName: string;
  checked: boolean;
  addedAt: string;
}

// Cooking mode types
export interface CookingStep {
  stepNumber: number;
  instruction: string;
  completed: boolean;
  timerSeconds?: number;
}

export interface CookingSession {
  recipeId: string;
  recipeName: string;
  servings: number;
  steps: CookingStep[];
  currentStepIndex: number;
  startedAt: string;
}

// Settings types
export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  accentColor: string;
  notificationsEnabled: boolean;
  sleepStart: string;
  sleepEnd: string;
  dailyCalorieTarget?: number;
  dailyProteinTarget?: number;
}

// Type guards
export function isValidNutriments(nutriments: any): nutriments is Nutriments {
  return nutriments && typeof nutriments === 'object';
}

export function isValidRecipe(recipe: any): recipe is Recipe {
  return (
    recipe &&
    typeof recipe.id === 'string' &&
    typeof recipe.name === 'string' &&
    Array.isArray(recipe.ingredients)
  );
}

export function isValidFoodProduct(product: any): product is FoodProduct {
  return (
    product &&
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    isValidNutriments(product.nutriments)
  );
}
