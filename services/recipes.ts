// TheMealDB API integration for recipe ideas
import { Recipe, Ingredient } from '../types';

export type { Recipe, Ingredient };

export async function getRandomRecipes(count: number = 6): Promise<Recipe[]> {
  try {
    // Fetch all random recipes in parallel for better performance
    const fetchPromises = Array.from({ length: count }, () =>
      fetch('https://www.themealdb.com/api/json/v1/1/random.php')
        .then(res => res.json())
        .then(data => data.meals?.[0] ? parseRecipe(data.meals[0]) : null)
        .catch(() => null)
    );
    
    const results = await Promise.all(fetchPromises);
    return results.filter((recipe): recipe is Recipe => recipe !== null);
  } catch (error) {
    console.error('TheMealDB random recipes error:', error);
    return [];
  }
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    
    if (!data.meals) return [];
    
    return data.meals.map((meal: any) => parseRecipe(meal));
  } catch (error) {
    console.error('TheMealDB search error:', error);
    return [];
  }
}

export async function getRecipesByCategory(category: string): Promise<Recipe[]> {
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`
    );
    const data = await response.json();
    
    if (!data.meals) return [];
    
    // Note: filter endpoint returns limited data, need to fetch full details
    return data.meals.slice(0, 6).map((meal: any) => ({
      id: meal.idMeal,
      name: meal.strMeal,
      category,
      area: '',
      instructions: '',
      thumbnail: meal.strMealThumb,
      ingredients: [],
      youtubeUrl: undefined,
      sourceUrl: `https://www.themealdb.com/meal/${meal.idMeal}`,
    }));
  } catch (error) {
    console.error('TheMealDB category error:', error);
    return [];
  }
}

function parseRecipe(meal: any): Recipe {
  const ingredients: Ingredient[] = [];
  
  // Extract ingredients (up to 20) with nullish guards
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal?.[`strIngredient${i}`];
    const measure = meal?.[`strMeasure${i}`];
    
    if (ingredient && typeof ingredient === 'string' && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure && typeof measure === 'string' ? measure.trim() : '',
      });
    }
  }
  
  return {
    id: meal?.idMeal ?? `recipe-${Date.now()}`,
    name: meal?.strMeal ?? 'Unknown Recipe',
    category: meal?.strCategory ?? '',
    area: meal?.strArea ?? '',
    instructions: meal?.strInstructions ?? '',
    thumbnail: meal?.strMealThumb ?? '',
    ingredients,
    youtubeUrl: meal?.strYoutube,
    sourceUrl: meal?.strSource ?? `https://www.themealdb.com/meal/${meal?.idMeal ?? ''}`,
  };
}

export const RECIPE_CATEGORIES = [
  'Breakfast',
  'Vegetarian',
  'Chicken',
  'Seafood',
  'Pasta',
  'Dessert',
  'Side',
  'Vegan',
];
