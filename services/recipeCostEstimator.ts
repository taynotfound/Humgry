/**
 * Ingredient price database (estimated average prices in USD)
 * These are rough estimates for common ingredients
 */
const INGREDIENT_PRICES: { [key: string]: number } = {
  // Proteins
  'chicken': 3.50,
  'chicken breast': 4.00,
  'chicken thigh': 3.00,
  'beef': 6.00,
  'ground beef': 5.00,
  'pork': 4.50,
  'bacon': 6.00,
  'salmon': 12.00,
  'tuna': 8.00,
  'shrimp': 10.00,
  'eggs': 0.30, // per egg
  'tofu': 2.50,
  
  // Dairy
  'milk': 0.15, // per cup
  'butter': 0.50,
  'cheese': 4.00,
  'cream': 0.30,
  'yogurt': 0.60,
  'cream cheese': 3.00,
  
  // Grains & Pasta
  'rice': 0.30,
  'pasta': 0.40,
  'bread': 0.30, // per slice
  'flour': 0.20,
  'oats': 0.25,
  'quinoa': 1.00,
  
  // Vegetables
  'onion': 0.50,
  'garlic': 0.20,
  'tomato': 0.75,
  'bell pepper': 1.50,
  'carrot': 0.30,
  'celery': 0.40,
  'potato': 0.40,
  'broccoli': 1.50,
  'spinach': 2.00,
  'lettuce': 2.00,
  'mushroom': 2.50,
  'zucchini': 1.00,
  'cucumber': 0.75,
  
  // Fruits
  'apple': 0.75,
  'banana': 0.25,
  'lemon': 0.50,
  'lime': 0.40,
  'orange': 0.60,
  'strawberry': 0.30,
  'blueberry': 0.50,
  
  // Pantry
  'olive oil': 0.30,
  'vegetable oil': 0.15,
  'sugar': 0.10,
  'salt': 0.05,
  'pepper': 0.10,
  'soy sauce': 0.20,
  'vinegar': 0.15,
  'honey': 0.40,
  'vanilla': 0.50,
  
  // Canned/Packaged
  'beans': 1.00,
  'chickpeas': 1.00,
  'coconut milk': 2.00,
  'tomato sauce': 1.50,
  'broth': 2.00,
  'stock': 2.00,
};

/**
 * Estimate cost of an ingredient based on common knowledge
 */
function estimateIngredientCost(ingredient: string, measure: string): number {
  const ingredientLower = ingredient.toLowerCase();
  
  // Direct match
  for (const [key, price] of Object.entries(INGREDIENT_PRICES)) {
    if (ingredientLower.includes(key)) {
      return price;
    }
  }
  
  // Fallback based on common categories
  if (ingredientLower.includes('spice') || ingredientLower.includes('seasoning')) {
    return 0.25;
  }
  if (ingredientLower.includes('herb')) {
    return 0.50;
  }
  if (ingredientLower.includes('sauce')) {
    return 1.50;
  }
  
  // Default estimate
  return 1.00;
}

/**
 * Calculate total estimated cost for a recipe
 */
export function estimateRecipeCost(ingredients: Array<{ ingredient: string; measure: string }>): number {
  let totalCost = 0;
  
  for (const item of ingredients) {
    const cost = estimateIngredientCost(item.ingredient, item.measure);
    totalCost += cost;
  }
  
  return Math.round(totalCost * 100) / 100; // Round to 2 decimals
}

/**
 * Estimate preparation time based on recipe complexity
 */
export function estimatePrepTime(
  ingredients: Array<{ ingredient: string; measure: string }>,
  instructions: string
): number {
  let baseTime = 15; // Base 15 minutes
  
  // Add time based on ingredient count
  baseTime += ingredients.length * 2;
  
  // Add time based on instruction complexity
  const instructionLower = instructions.toLowerCase();
  if (instructionLower.includes('marinate')) baseTime += 30;
  if (instructionLower.includes('refrigerate')) baseTime += 30;
  if (instructionLower.includes('bake')) baseTime += 25;
  if (instructionLower.includes('roast')) baseTime += 30;
  if (instructionLower.includes('slow cook')) baseTime += 120;
  if (instructionLower.includes('simmer')) baseTime += 20;
  if (instructionLower.includes('boil')) baseTime += 15;
  if (instructionLower.includes('fry')) baseTime += 10;
  if (instructionLower.includes('sauté')) baseTime += 10;
  
  return Math.min(baseTime, 180); // Cap at 3 hours
}

/**
 * Estimate servings based on ingredient quantities
 */
export function estimateServings(ingredients: Array<{ ingredient: string; measure: string }>): number {
  // Look for protein as indicator
  for (const item of ingredients) {
    const measure = item.measure.toLowerCase();
    const ingredient = item.ingredient.toLowerCase();
    
    // Meat portions
    if (ingredient.includes('chicken') || ingredient.includes('beef') || ingredient.includes('pork')) {
      if (measure.includes('lb') || measure.includes('pound')) {
        const pounds = parseFloat(measure) || 1;
        return Math.max(2, Math.round(pounds * 2)); // ~2 servings per lb
      }
    }
    
    // Pasta/rice
    if (ingredient.includes('pasta') || ingredient.includes('rice')) {
      if (measure.includes('cup')) {
        const cups = parseFloat(measure) || 1;
        return Math.max(2, Math.round(cups * 2)); // ~2 servings per cup dry
      }
    }
  }
  
  // Default based on ingredient count
  return ingredients.length < 5 ? 2 : ingredients.length < 10 ? 4 : 6;
}

/**
 * Calculate cost per serving
 */
export function calculateCostPerServing(totalCost: number, servings: number): number {
  return Math.round((totalCost / servings) * 100) / 100;
}

/**
 * Classify recipe by cost category
 */
export function classifyRecipeCost(totalCost: number): '$' | '$$' | '$$$' | '$$$$' {
  if (totalCost < 10) return '$';
  if (totalCost < 20) return '$$';
  if (totalCost < 35) return '$$$';
  return '$$$$';
}

/**
 * Generate cost insight for recipe
 */
export function generateRecipeCostInsight(
  totalCost: number,
  servings: number,
  estimatedTime: number
): {
  costPerServing: number;
  costCategory: '$' | '$$' | '$$$' | '$$$$';
  valueScore: number; // 0-10, higher is better value
  insight: string;
} {
  const costPerServing = calculateCostPerServing(totalCost, servings);
  const costCategory = classifyRecipeCost(totalCost);
  
  // Calculate value score (considers cost per serving and time)
  const costScore = Math.max(0, 10 - (costPerServing * 2));
  const timeScore = Math.max(0, 10 - (estimatedTime / 10));
  const valueScore = Math.round((costScore + timeScore) / 2);
  
  // Generate insight
  let insight = '';
  if (valueScore >= 8) {
    insight = 'Excellent value! Budget-friendly and quick to make.';
  } else if (valueScore >= 6) {
    insight = 'Good value for the quality.';
  } else if (valueScore >= 4) {
    insight = 'Moderate cost, worth it for special occasions.';
  } else {
    insight = 'Premium ingredients, plan ahead for budget.';
  }
  
  if (costPerServing < 3) {
    insight += ' Very economical per serving!';
  } else if (costPerServing > 8) {
    insight += ' High-end meal, perfect for entertaining.';
  }
  
  return {
    costPerServing,
    costCategory,
    valueScore,
    insight,
  };
}
