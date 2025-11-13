// TheMealDB API integration for recipe ideas
export interface Recipe {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  thumbnail: string;
  ingredients: Array<{ ingredient: string; measure: string }>;
  youtubeUrl?: string;
  sourceUrl: string;
  estimatedCost?: number; // Estimated cost to make
  estimatedTime?: number; // Minutes to prepare
  servings?: number; // Number of servings
}

export async function getRandomRecipes(count: number = 6): Promise<Recipe[]> {
  try {
    const recipes: Recipe[] = [];
    
    // Fetch random recipes
    for (let i = 0; i < count; i++) {
      const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
      const data = await response.json();
      
      if (data.meals && data.meals[0]) {
        const meal = data.meals[0];
        recipes.push(parseRecipe(meal));
      }
    }
    
    return recipes;
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
  const ingredients: Array<{ ingredient: string; measure: string }> = [];
  
  // Extract ingredients (up to 20)
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure ? measure.trim() : '',
      });
    }
  }
  
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory || '',
    area: meal.strArea || '',
    instructions: meal.strInstructions || '',
    thumbnail: meal.strMealThumb || '',
    ingredients,
    youtubeUrl: meal.strYoutube,
    sourceUrl: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
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
