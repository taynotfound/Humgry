import AppBar from '@/components/AppBar';
import AppFooter from '@/components/AppFooter';
import { useSettings } from '@/contexts/settings-context';
import { estimatePrepTime, estimateRecipeCost, estimateServings, generateRecipeCostInsight } from '@/services/recipeCostEstimator';
import { getRandomRecipes, getRecipesByCategory, Recipe, searchRecipes } from '@/services/recipes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  RadioButton,
  Searchbar,
  Text
} from 'react-native-paper';

export default function RecipesScreen() {
  const { accentColor, getFontSize, colors, theme } = useSettings();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [baseServings, setBaseServings] = useState<number>(2);
  const [servings, setServings] = useState<number>(2);
  const [baseTotalCost, setBaseTotalCost] = useState<number>(0);
  const [showMealPlanDialog, setShowMealPlanDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMealTime, setSelectedMealTime] = useState('breakfast');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [savedFavoriteRecipes, setSavedFavoriteRecipes] = useState<Recipe[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = [
    'Breakfast',
    'Vegetarian',
    'Seafood',
    'Chicken',
    'Beef',
    'Pasta',
    'Dessert',
    'Vegan',
  ];

  useEffect(() => {
    loadRandomRecipes();
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const savedIds = await AsyncStorage.getItem('humngry.favoriteRecipes');
      const savedRecipes = await AsyncStorage.getItem('humngry.favoriteRecipeDetails');
      if (savedIds) {
        setFavorites(new Set(JSON.parse(savedIds)));
      }
      if (savedRecipes) {
        setSavedFavoriteRecipes(JSON.parse(savedRecipes));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (recipeId: string, recipe?: Recipe) => {
    const newFavorites = new Set(favorites);
    let newSavedRecipes = [...savedFavoriteRecipes];
    
    if (newFavorites.has(recipeId)) {
      // Remove from favorites
      newFavorites.delete(recipeId);
      newSavedRecipes = newSavedRecipes.filter(r => r.id !== recipeId);
    } else {
      // Add to favorites
      newFavorites.add(recipeId);
      if (recipe && !newSavedRecipes.find(r => r.id === recipeId)) {
        newSavedRecipes.push(recipe);
      }
    }
    
    setFavorites(newFavorites);
    setSavedFavoriteRecipes(newSavedRecipes);
    
    try {
      await AsyncStorage.setItem('humngry.favoriteRecipes', JSON.stringify(Array.from(newFavorites)));
      await AsyncStorage.setItem('humngry.favoriteRecipeDetails', JSON.stringify(newSavedRecipes));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const displayedRecipes = showFavoritesOnly ? savedFavoriteRecipes : recipes;

  const loadRandomRecipes = async () => {
    setLoading(true);
    setSelectedCategory(null);
    setSearchQuery('');
    const randomRecipes = await getRandomRecipes(6);
    setRecipes(randomRecipes);
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      loadRandomRecipes();
      return;
    }
    setLoading(true);
    setSelectedCategory(null);
    const results = await searchRecipes(query);
    setRecipes(results);
    setLoading(false);
  };

  const handleCategorySelect = async (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      loadRandomRecipes();
      return;
    }
    setLoading(true);
    setSearchQuery('');
    setSelectedCategory(category);
    const results = await getRecipesByCategory(category);
    setRecipes(results);
    setLoading(false);
  };

  const openRecipe = (recipe: Recipe) => {
    // Calculate cost estimates when opening recipe
    if (!recipe.estimatedCost && recipe.ingredients) {
      recipe.estimatedCost = estimateRecipeCost(recipe.ingredients);
      recipe.estimatedTime = estimatePrepTime(recipe.ingredients, recipe.instructions);
      recipe.servings = estimateServings(recipe.ingredients);
    }
    const initialServings = recipe.servings || (recipe.ingredients ? estimateServings(recipe.ingredients) : 2);
    setBaseServings(initialServings);
    setServings(initialServings);
    setBaseTotalCost(recipe.estimatedCost || (recipe.ingredients ? estimateRecipeCost(recipe.ingredients) : 0));
    setSelectedRecipe(recipe);
    setShowModal(true);
  };

  const copyIngredientsToClipboard = async () => {
    if (!selectedRecipe || !selectedRecipe.ingredients) return;
    const factor = servings / Math.max(1, baseServings);
    const lines = selectedRecipe.ingredients.map((ing) => `${scaleMeasure(ing.measure, factor)} ${ing.ingredient}`.trim());
    await Clipboard.setStringAsync(lines.join('\n'));
    alert('✅ Ingredients copied to clipboard');
  };

  const addIngredientsToShoppingList = async () => {
    if (!selectedRecipe || !selectedRecipe.ingredients) return;
    const factor = servings / Math.max(1, baseServings);
    const items = selectedRecipe.ingredients.map((ing) => ({
      id: `${selectedRecipe.id}-${ing.ingredient}`,
      ingredient: ing.ingredient,
      measure: scaleMeasure(ing.measure, factor),
      recipeId: selectedRecipe.id,
      recipeName: selectedRecipe.name,
      checked: false,
      addedAt: Date.now(),
    }));
    try {
      const existing = await AsyncStorage.getItem('humngry.shoppingList');
      const list = existing ? JSON.parse(existing) : [];
      const dedup = new Map(list.map((i: any) => [i.id, i]));
      for (const it of items) dedup.set(it.id, it);
      const next = Array.from(dedup.values());
      await AsyncStorage.setItem('humngry.shoppingList', JSON.stringify(next));
      alert(`🛒 Added ${items.length} ingredients to shopping list`);
    } catch (e) {
      console.error('Failed to add shopping list items', e);
      alert('❌ Failed to add to shopping list');
    }
  };

  const openSource = (url: string) => {
    Linking.openURL(url);
  };

  const handleAddToMealPlan = () => {
    setShowMealPlanDialog(true);
  };

  const confirmAddToMealPlan = async () => {
    if (!selectedRecipe) return;
    
    try {
      // Load existing meal plan
      const existingPlan = await AsyncStorage.getItem('humngry.mealPlan');
      const mealPlan = existingPlan ? JSON.parse(existingPlan) : {};
      
      // Add recipe to the selected day and meal time with full details including ingredients
      if (!mealPlan[selectedDay]) {
        mealPlan[selectedDay] = {};
      }
      mealPlan[selectedDay][selectedMealTime] = {
        id: selectedRecipe.id,
        name: selectedRecipe.name,
        thumbnail: selectedRecipe.thumbnail,
        category: selectedRecipe.category,
        area: selectedRecipe.area,
        ingredients: selectedRecipe.ingredients || [],
        instructions: selectedRecipe.instructions || '',
        youtubeUrl: selectedRecipe.youtubeUrl || '',
      };
      
      // Save updated meal plan
      await AsyncStorage.setItem('humngry.mealPlan', JSON.stringify(mealPlan));
      
      setShowMealPlanDialog(false);
      alert(`✅ ${selectedRecipe.name} added to ${selectedDay}'s ${selectedMealTime}!`);
    } catch (error) {
      console.error('Error saving meal plan:', error);
      alert('❌ Failed to save meal plan');
    }
  };

  // Helpers to scale ingredient measures by servings
  const parseQuantity = (measure: string): { qty: number; rest: string } | null => {
    const m = measure.trim().match(/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(.*)$/);
    if (!m) return null;
    const numStr = m[1];
    const rest = m[2] || '';
    const parts = numStr.split(' ');
    let total = 0;
    for (const p of parts) {
      if (/^\d+\/\d+$/.test(p)) {
        const [a, b] = p.split('/').map(Number);
        if (b !== 0) total += a / b;
      } else {
        const n = parseFloat(p);
        if (!isNaN(n)) total += n;
      }
    }
    if (total === 0) return null;
    return { qty: total, rest };
  };

  const formatQty = (n: number): string => {
    const rounded = Math.round(n * 100) / 100;
    if (Math.abs(rounded - Math.round(rounded)) < 0.05) return String(Math.round(rounded));
    return rounded.toString();
  };

  const scaleMeasure = (measure: string, factor: number): string => {
    const parsed = parseQuantity(measure);
    if (!parsed) return measure;
    const newQty = parsed.qty * factor;
    return `${formatQty(newQty)} ${parsed.rest}`.trim();
  };

  const costForServings = (baseCost: number, baseSrv: number, srv: number): { total: number; per: number } => {
    const per = Math.round(((baseSrv > 0 ? baseCost / baseSrv : baseCost)) * 100) / 100;
    const total = Math.round((per * srv) * 100) / 100;
    return { total, per: Math.round((total / Math.max(1, srv)) * 100) / 100 };
  };

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>      
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusBarSpacer} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, maxWidth: '75%' }}>
              <Text style={[styles.title, { color: colors.text }]}>🍳 Recipe Ideas</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Get inspired! Cooking helps you eat better and more regularly.
              </Text>
              <Text style={[styles.screenDescription, { color: colors.textTertiary }]}>
                Browse recipes by category or search for something specific. Tap any recipe to see full instructions and ingredients.
              </Text>
            </View>
            <View style={{ width: 80 }} />
          </View>

          <Searchbar
            placeholder="Search recipes..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: colors.surface }]}
            inputStyle={{ color: colors.text, fontSize: getFontSize(15) }}
            iconColor={accentColor}
            placeholderTextColor={colors.textTertiary}
          />

          <View style={styles.categories}>
            {categories.map((category) => (
              <Chip
                key={category}
                selected={selectedCategory === category}
                onPress={() => handleCategorySelect(category)}
                style={[
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedCategory === category && { backgroundColor: accentColor },
                ]}
                textStyle={{
                  color: selectedCategory === category ? (theme === 'dark' ? '#000' : '#fff') : colors.text,
                  fontSize: getFontSize(13),
                }}
                selectedColor={accentColor}
              >
                {category}
              </Chip>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <Button
              mode="outlined"
              onPress={loadRandomRecipes}
              style={[styles.randomButton, { borderColor: colors.border, flex: 1 }]}
              icon="shuffle"
              textColor={accentColor}
              labelStyle={{ fontSize: getFontSize(14) }}
            >
              🎲 Random
            </Button>
            <Button
              mode={showFavoritesOnly ? "contained" : "outlined"}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={[styles.randomButton, { borderColor: colors.border, flex: 1 }]}
              icon="heart"
              textColor={showFavoritesOnly ? '#fff' : accentColor}
              buttonColor={showFavoritesOnly ? accentColor : undefined}
              labelStyle={{ fontSize: getFontSize(14) }}
            >
              {showFavoritesOnly ? `Favorites (${savedFavoriteRecipes.length})` : 'Show Favorites'}
            </Button>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={[styles.loadingText, { fontSize: getFontSize(16), color: colors.textTertiary }]}>Finding delicious recipes...</Text>
            </View>
          ) : showFavoritesOnly && savedFavoriteRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text, fontSize: getFontSize(24) }]}>❤️</Text>
              <Text style={[styles.emptyText, { color: colors.text, fontSize: getFontSize(18), marginTop: 12 }]}>No favorites yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary, fontSize: getFontSize(14), textAlign: 'center', marginTop: 8 }]}>
                Tap the heart icon on any recipe to save it here
              </Text>
            </View>
          ) : displayedRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>😕 No recipes found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Try a different search or category</Text>
            </View>
          ) : (
            <View style={styles.recipesGrid}>
              {displayedRecipes.map((recipe) => (
                <Card key={recipe.id} style={[styles.recipeCard, { backgroundColor: colors.card }]}>
                  {recipe.thumbnail && (
                    <View style={{ position: 'relative' }}>
                      <Image
                        source={{ uri: recipe.thumbnail }}
                        style={styles.recipeImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={[
                          styles.favoriteButton,
                          { 
                            backgroundColor: favorites.has(recipe.id) ? accentColor : 'rgba(0,0,0,0.6)',
                          }
                        ]}
                        onPress={() => toggleFavorite(recipe.id, recipe)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.favoriteIcon}>
                          {favorites.has(recipe.id) ? '❤️' : '🤍'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Card.Content style={styles.recipeContent}>
                    <Text style={[styles.recipeName, { color: colors.text }]} numberOfLines={2}>
                      {recipe.name}
                    </Text>
                    
                    {/* Cost & Time Info */}
                    {recipe.ingredients && recipe.ingredients.length > 0 && (() => {
                      const cost = recipe.estimatedCost || estimateRecipeCost(recipe.ingredients);
                      const time = recipe.estimatedTime || estimatePrepTime(recipe.ingredients, recipe.instructions);
                      const servings = recipe.servings || estimateServings(recipe.ingredients);
                      const costInsight = generateRecipeCostInsight(cost, servings, time);
                      
                      return (
                        <View style={styles.costTimeRow}>
                          <Chip
                            compact
                            mode="flat"
                            style={[styles.costChip, { backgroundColor: colors.surfaceVariant }]}
                            textStyle={[styles.chipText, { color: colors.text, fontSize: getFontSize(10) }]}
                            icon="currency-usd"
                          >
                            {costInsight.costCategory} • ${costInsight.costPerServing.toFixed(2)}/serving
                          </Chip>
                          <Chip
                            compact
                            mode="flat"
                            style={[styles.timeChip, { backgroundColor: colors.surfaceVariant }]}
                            textStyle={[styles.chipText, { color: colors.text, fontSize: getFontSize(10) }]}
                            icon="clock-outline"
                          >
                            ~{time}min
                          </Chip>
                        </View>
                      );
                    })()}
                    
                    <View style={styles.tagsRow}>
                      <Chip
                        mode="flat"
                        style={[styles.categoryChip, { backgroundColor: `${accentColor}22` }]}
                        textStyle={[styles.chipText, { color: accentColor, fontSize: getFontSize(11) }]}
                      >
                        {recipe.category}
                      </Chip>
                      {recipe.area && (
                        <Chip
                          mode="flat"
                          style={[styles.areaChip, { backgroundColor: colors.surfaceVariant }]}
                          textStyle={[styles.chipText, { color: colors.text, fontSize: getFontSize(11) }]}
                          icon="earth"
                        >
                          {recipe.area}
                        </Chip>
                      )}
                    </View>
                    <Button
                      mode="contained"
                      onPress={() => openRecipe(recipe)}
                      style={styles.viewButton}
                      buttonColor={accentColor}
                      icon="book-open"
                      labelStyle={{ fontSize: getFontSize(13) }}
                      textColor={theme === 'dark' ? '#000' : '#fff'}
                    >
                      View Recipe
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}

          {!loading && recipes.length > 0 && (
            <Button
              mode="outlined"
              onPress={loadRandomRecipes}
              style={[styles.bottomRandomButton, { borderColor: colors.border }]}
              icon="shuffle"
              textColor={accentColor}
              labelStyle={{ fontSize: getFontSize(15) }}
            >
              🎲 Get More Random Recipes
            </Button>
          )}
        </ScrollView>

        <Modal
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <IconButton
                icon="close"
                iconColor={colors.text}
                size={28}
                onPress={() => setShowModal(false)}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={2}>
                {selectedRecipe?.name}
              </Text>
              <IconButton
                icon={selectedRecipe && favorites.has(selectedRecipe.id) ? 'heart' : 'heart-outline'}
                iconColor={favorites.has(selectedRecipe?.id || '') ? accentColor : colors.text}
                size={24}
                onPress={() => selectedRecipe && toggleFavorite(selectedRecipe.id, selectedRecipe)}
              />
              <IconButton
                icon="open-in-new"
                iconColor={accentColor}
                size={24}
                onPress={() => selectedRecipe && openSource(selectedRecipe.sourceUrl)}
              />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedRecipe?.thumbnail && (
                <Image
                  source={{ uri: selectedRecipe.thumbnail }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.modalInfo}>
                <Chip
                  icon="tag"
                  style={[styles.modalChip, { backgroundColor: colors.surface }]}
                  textStyle={[styles.modalChipText, { color: colors.text }]}
                >
                  {selectedRecipe?.category}
                </Chip>
                {selectedRecipe?.area && (
                  <Chip
                    icon="earth"
                    style={[styles.modalChip, { backgroundColor: colors.surface }]}
                    textStyle={[styles.modalChipText, { color: colors.text }]}
                  >
                    {selectedRecipe.area}
                  </Chip>
                )}
              </View>

              {selectedRecipe?.ingredients && selectedRecipe.ingredients.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { fontSize: getFontSize(18), color: colors.text }]}>🥘 Ingredients</Text>
                  <View style={[styles.servingsRow, { borderColor: colors.border }]}> 
                    <Text style={{ color: colors.textSecondary, fontSize: getFontSize(14), fontWeight: '700' }}>Servings</Text>
                    <View style={styles.servingsControls}>
                      <TouchableOpacity
                        onPress={() => setServings(Math.max(1, servings - 1))}
                        style={[styles.servingsBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: colors.text, fontSize: getFontSize(18), fontWeight: '800' }}>−</Text>
                      </TouchableOpacity>
                      <Text style={{ color: colors.text, fontSize: getFontSize(16), fontWeight: '800', minWidth: 28, textAlign: 'center' }}>
                        {servings}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setServings(Math.min(20, servings + 1))}
                        style={[styles.servingsBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: colors.text, fontSize: getFontSize(18), fontWeight: '800' }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Quick presets */}
                  <View style={styles.servingPresetRow}>
                    {[2, 4, 6].map((n) => (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setServings(n)}
                        style={[styles.servingPresetBtn, { backgroundColor: servings === n ? `${accentColor}33` : colors.surfaceVariant, borderColor: servings === n ? accentColor : colors.border }]}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: colors.text, fontWeight: '700' }}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {(() => {
                      const { total, per } = costForServings(baseTotalCost, baseServings, servings);
                      const time = selectedRecipe?.estimatedTime || 0;
                      return (
                        <>
                          <Chip compact style={{ backgroundColor: colors.surfaceVariant }} textStyle={{ color: colors.text }} icon="currency-usd">
                            ~${per.toFixed(2)}/serv • ~${total.toFixed(2)} total
                          </Chip>
                          {time > 0 && (
                            <Chip compact style={{ backgroundColor: colors.surfaceVariant }} textStyle={{ color: colors.text }} icon="clock-outline">
                              ~{time} min
                            </Chip>
                          )}
                        </>
                      );
                    })()}
                  </View>
                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, paddingHorizontal: 16 }}>
                    <Button
                      mode="outlined"
                      onPress={copyIngredientsToClipboard}
                      icon="content-copy"
                      textColor={accentColor}
                      style={{ borderColor: colors.border, flex: 1 }}
                      labelStyle={{ fontSize: getFontSize(13) }}
                    >
                      Copy ingredients
                    </Button>
                    
                  </View>

                  <View style={styles.ingredientsList}>
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <View key={idx} style={styles.ingredientItem}>
                        <Text style={[styles.ingredientBullet, { color: accentColor }]}>•</Text>
                        <Text style={[styles.ingredientText, { fontSize: getFontSize(15), color: colors.textSecondary }]}>
                          {scaleMeasure(ing.measure, servings / Math.max(1, baseServings))} {ing.ingredient}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {selectedRecipe?.instructions && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { fontSize: getFontSize(18), color: colors.text }]}>👨‍🍳 Instructions</Text>
                  <View style={styles.instructionsList}>
                    {selectedRecipe.instructions
                      .split(/\r?\n/)
                      .filter(step => step.trim().length > 0)
                      .filter(step => !/^\d+$/.test(step.trim())) // Remove lines that are just numbers
                      .filter(step => !/^step\s+\d+$/i.test(step.trim())) // Remove "step 1", "step 2", etc.
                      .map((step, idx) => (
                        <View key={idx} style={styles.instructionStep}>
                          <View style={[styles.stepNumber, { backgroundColor: accentColor }]}>
                            <Text style={[styles.stepNumberText, { fontSize: getFontSize(16), color: theme === 'dark' ? '#000' : '#fff' }]}>{idx + 1}</Text>
                          </View>
                          <Text style={[styles.instructionText, { fontSize: getFontSize(15), color: colors.textSecondary }]}>{step.trim()}</Text>
                        </View>
                      ))}
                  </View>
                </View>
              )}

              {selectedRecipe?.youtubeUrl && (
                <Button
                  mode="contained"
                  onPress={() => selectedRecipe && Linking.openURL(selectedRecipe.youtubeUrl!)}
                  style={styles.youtubeButton}
                  buttonColor="#ff0000"
                  icon="youtube"
                  labelStyle={[styles.youtubeButtonLabel, { fontSize: getFontSize(15) }]}
                  textColor='#ffffff'
                >
                  📺 Watch Video Tutorial
                </Button>
              )}

              <Button
                mode="contained"
                onPress={handleAddToMealPlan}
                style={[styles.addToPlanButton, { marginTop: 16 }]}
                buttonColor={accentColor}
                icon="calendar-plus"
                labelStyle={{ fontSize: getFontSize(15) }}
                textColor={theme === 'dark' ? '#000' : '#fff'}
              >
                📅 Add to Meal Plan
              </Button>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Add to Meal Plan Modal */}
        <Modal
          visible={showMealPlanDialog}
          onRequestClose={() => setShowMealPlanDialog(false)}
          animationType="slide"
          transparent={true}
        >
          <View style={[styles.dialogOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <View style={[styles.dialogContainer, { backgroundColor: colors.surface }]}>
              <View style={[styles.dialogHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dialogTitle, { color: colors.text, fontSize: getFontSize(18) }]}>
                  Add to Meal Plan
                </Text>
                <IconButton
                  icon="close"
                  iconColor={colors.text}
                  size={24}
                  onPress={() => setShowMealPlanDialog(false)}
                />
              </View>

              <ScrollView style={styles.dialogContent} showsVerticalScrollIndicator={false}>
                <Text style={{ color: colors.text, fontSize: getFontSize(16), fontWeight: '700', marginBottom: 16 }}>
                  📅 Select Day
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={{ marginBottom: 24 }}
                  contentContainerStyle={{ paddingRight: 20 }}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSelectedDay(day)}
                      style={[
                        styles.dayButton,
                        {
                          backgroundColor: selectedDay === day ? accentColor : colors.surfaceVariant,
                          borderColor: selectedDay === day ? accentColor : colors.border,
                        }
                      ]}
                    >
                      <Text style={{
                        color: selectedDay === day ? (theme === 'dark' ? '#000' : '#fff') : colors.text,
                        fontSize: getFontSize(14),
                        fontWeight: selectedDay === day ? '700' : '600',
                      }}>
                        {day.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={{ color: colors.text, fontSize: getFontSize(16), fontWeight: '700', marginBottom: 12 }}>
                  🍽️ Meal Time
                </Text>
                <RadioButton.Group onValueChange={value => setSelectedMealTime(value)} value={selectedMealTime}>
                  <TouchableOpacity
                    style={[
                      styles.radioOption, 
                      { 
                        backgroundColor: selectedMealTime === 'breakfast' ? `${accentColor}20` : colors.surfaceVariant,
                        borderColor: selectedMealTime === 'breakfast' ? accentColor : 'transparent',
                        borderWidth: 2,
                      }
                    ]}
                    onPress={() => setSelectedMealTime('breakfast')}
                  >
                    <RadioButton.Android value="breakfast" color={accentColor} />
                    <Text style={{ color: colors.text, fontSize: getFontSize(15), fontWeight: '600' }}>🌅 Breakfast</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.radioOption, 
                      { 
                        backgroundColor: selectedMealTime === 'lunch' ? `${accentColor}20` : colors.surfaceVariant,
                        borderColor: selectedMealTime === 'lunch' ? accentColor : 'transparent',
                        borderWidth: 2,
                      }
                    ]}
                    onPress={() => setSelectedMealTime('lunch')}
                  >
                    <RadioButton.Android value="lunch" color={accentColor} />
                    <Text style={{ color: colors.text, fontSize: getFontSize(15), fontWeight: '600' }}>☀️ Lunch</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.radioOption, 
                      { 
                        backgroundColor: selectedMealTime === 'dinner' ? `${accentColor}20` : colors.surfaceVariant,
                        borderColor: selectedMealTime === 'dinner' ? accentColor : 'transparent',
                        borderWidth: 2,
                      }
                    ]}
                    onPress={() => setSelectedMealTime('dinner')}
                  >
                    <RadioButton.Android value="dinner" color={accentColor} />
                    <Text style={{ color: colors.text, fontSize: getFontSize(15), fontWeight: '600' }}>🌙 Dinner</Text>
                  </TouchableOpacity>
                </RadioButton.Group>
              </ScrollView>

              <View style={[styles.dialogActions, { borderTopColor: colors.border }]}>
                <Button
                  onPress={() => setShowMealPlanDialog(false)}
                  textColor={colors.textSecondary}
                  labelStyle={{ fontSize: getFontSize(14) }}
                  style={{ marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmAddToMealPlan}
                  buttonColor={accentColor}
                  labelStyle={{ fontSize: getFontSize(14), fontWeight: '700' }}
                  textColor={theme === 'dark' ? '#000' : '#fff'}
                >
                  Add to Plan
                </Button>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
      <AppBar />
      <AppFooter />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 125,
    paddingBottom: 60,
  },
  statusBarSpacer: { height: 24 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  screenDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  randomButton: {
    marginBottom: 24,
    minHeight: 44,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
  },
  recipesGrid: {
    gap: 16,
  },
  recipeCard: {
    marginBottom: 16,
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  recipeContent: {
    paddingTop: 12,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
    minHeight: 48,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  categoryChip: {
    height: 32,
    paddingVertical: 2,
  },
  areaChip: {
    height: 32,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  recipeCategory: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recipeArea: {
    fontSize: 13,
    marginBottom: 12,
  },
  viewButton: {
    marginTop: 8,
    minHeight: 44,
  },
  bottomRandomButton: {
    marginTop: 24,
    marginBottom: 16,
    minHeight: 48,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  modalContent: {
    paddingBottom: 32,
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalInfo: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    flexWrap: 'wrap',
  },
  modalChip: {},
  modalChipText: {
    fontWeight: '600',
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ingredientBullet: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 2,
  },
  ingredientText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  instructionsList: {
    gap: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  servingPresetRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  servingPresetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  youtubeButton: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  youtubeButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addToPlanButton: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 2,
    minWidth: 70,
    minHeight: 48,
    alignItems: 'center',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    minHeight: 56,
  },
  dialogOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dialogContent: {
    padding: 24,
    maxHeight: 450,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  costTimeRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  costChip: {
    height: 32,
    paddingVertical: 2,
  },
  timeChip: {
    height: 32,
    paddingVertical: 2,
  },
});

