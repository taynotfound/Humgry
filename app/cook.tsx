import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
  Image,
  StatusBar,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton, Text, Surface } from 'react-native-paper';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useSettings } from '../contexts/settings-context';
import { CookingStep } from '../types';
import { useEntries } from '../hooks/useEntries';

export default function CookScreen() {
  const params = useLocalSearchParams();
  const { colors, accentColor } = useSettings();
  const { addEntry } = useEntries();
  const [steps, setSteps] = useState<CookingStep[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  const flatListRef = useRef<FlatList>(null);

  const recipeName = (params.recipeName as string) || 'Recipe';
  const servings = parseInt((params.servings as string) || '4', 10);
  const instructions = (params.instructions as string) || '';
  const ingredientsParam = (params.ingredients as string) || '';
  const [isReady, setIsReady] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [showCompletion, setShowCompletion] = useState(false);
  
  const ingredients = ingredientsParam ? JSON.parse(ingredientsParam) : [];

  // Keep screen awake (no orientation lock)
  useEffect(() => {
    const setup = async () => {
      await activateKeepAwakeAsync();
    };
    setup();

    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => {
      deactivateKeepAwake();
      subscription?.remove();
    };
  }, []);

  // Parse instructions into steps
  useEffect(() => {
    if (!instructions) return;

    const stepTexts = instructions
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedSteps: CookingStep[] = stepTexts.map((instruction, index) => ({
      stepNumber: index + 1,
      instruction,
      completed: false,
    }));

    setSteps(parsedSteps);
  }, [instructions]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  const handleExit = useCallback(() => {
    router.back();
  }, []);

  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  const toggleIngredient = useCallback((index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleStartCooking = useCallback(() => {
    setIsReady(true);
  }, []);

  const handleFinish = useCallback(() => {
    router.back();
  }, []);

  const handleFinishAndLog = useCallback(async () => {
    // Log the meal
    await addEntry({
      what: recipeName,
      amount: servings <= 2 ? 'small' : servings <= 4 ? 'medium' : 'large',
      time: new Date().toISOString(),
      fullness: 4, // Assume satisfied after cooking
      tags: ['Home Cooked', 'Recipe'],
      rating: 5, // Default to 5 stars for completed recipe
      notes: `Cooked using recipe with ${ingredients.length} ingredients`,
    });
    
    router.back();
  }, [recipeName, servings, ingredients.length, addEntry]);

  const renderItem = useCallback(
    ({ item, index }: { item: CookingStep; index: number }) => {
      // Completion screen as last item
      if (index === steps.length) {
        return (
          <View style={[styles.stepCard, { backgroundColor: colors.surface }]}>
            <Text
              style={{
                color: accentColor,
                fontSize: 42,
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              🎉 Well Done!
            </Text>
            
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                textAlign: 'center',
                marginBottom: 32,
                opacity: 0.8,
              }}
            >
              You've completed cooking {recipeName}
            </Text>

            <View style={styles.completionButtons}>
              <Pressable
                onPress={handleFinish}
                style={[
                  styles.completionButton,
                  { backgroundColor: colors.surface, borderColor: accentColor, borderWidth: 2 },
                ]}
              >
                <Text
                  style={{
                    color: accentColor,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Finish
                </Text>
              </Pressable>

              <Pressable
                onPress={handleFinishAndLog}
                style={[
                  styles.completionButton,
                  { backgroundColor: accentColor },
                ]}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Finish & Log Meal
                </Text>
              </Pressable>
            </View>
          </View>
        );
      }

      // Regular step
      return (
        <View style={[styles.stepCard, { backgroundColor: colors.surface }]}>
          {/* Step Number */}
          <Text
            style={{
              color: accentColor,
              fontSize: 28,
              fontWeight: '700',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Step {item.stepNumber} of {steps.length}
          </Text>

          {/* Instruction Text */}
          <Text
            style={{
              color: colors.text,
              fontSize: 20,
              lineHeight: 32,
              fontWeight: '500',
              textAlign: 'center',
            }}
          >
            {item.instruction}
          </Text>
        </View>
      );
    },
    [steps.length, colors, accentColor, recipeName, handleFinish, handleFinishAndLog]
  );

  // Ready to cook screen
  if (!isReady && ingredients.length > 0) {
    const allChecked = ingredients.length === checkedIngredients.size;
    
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar hidden={false} />
        
        <Surface style={styles.exitButton} elevation={4}>
          <IconButton
            icon="close"
            size={28}
            iconColor={colors.text}
            onPress={handleExit}
          />
        </Surface>

        <View style={styles.readyContainerVertical}>
          <Text
            style={{
              color: accentColor,
              fontSize: 32,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Ready to cook?
          </Text>
          
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 24,
              opacity: 0.7,
            }}
          >
            Check off your ingredients • {checkedIngredients.size}/{ingredients.length}
          </Text>

          <FlatList
            data={ingredients}
            keyExtractor={(_, index) => `ingredient-${index}`}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => toggleIngredient(index)}
                  style={[
                    styles.ingredientItemHorizontal,
                    {
                      backgroundColor: checkedIngredients.has(index)
                        ? accentColor + '22'
                        : colors.surface,
                      borderColor: checkedIngredients.has(index)
                        ? accentColor
                        : colors.surfaceVariant,
                    },
                  ]}
                >
                  <View style={[
                    styles.checkboxSmall,
                    {
                      borderColor: checkedIngredients.has(index) ? accentColor : colors.textSecondary,
                      backgroundColor: checkedIngredients.has(index) ? accentColor : 'transparent',
                    },
                  ]}>
                    {checkedIngredients.has(index) && (
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>✓</Text>
                    )}
                  </View>
                  
                  <View style={styles.ingredientTextContainer}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: '500',
                        textDecorationLine: checkedIngredients.has(index) ? 'line-through' : 'none',
                        opacity: checkedIngredients.has(index) ? 0.6 : 1,
                      }}
                    >
                      {item.ingredient}
                    </Text>
                    {item.measure && (
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 14,
                          marginTop: 2,
                        }}
                      >
                        {item.measure}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
            />

          <Pressable
            onPress={handleStartCooking}
            disabled={!allChecked}
            style={[
              styles.startButtonFixed,
              {
                backgroundColor: allChecked ? accentColor : colors.surfaceVariant,
                opacity: allChecked ? 1 : 0.5,
              },
            ]}
          >
            <Text
              style={{
                color: allChecked ? '#fff' : colors.textSecondary,
                fontSize: 18,
                fontWeight: '700',
              }}
            >
              {allChecked ? "🧑‍🍳 Let's Cook!" : `Check all (${checkedIngredients.size}/${ingredients.length})`}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (steps.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar hidden />
        {showControls && (
          <Surface style={styles.exitButton} elevation={4}>
            <IconButton icon="close" size={32} onPress={handleExit} />
          </Surface>
        )}
        <Pressable style={styles.emptyState} onPress={toggleControls}>
          <Text variant="bodyLarge" style={{ color: colors.text, textAlign: 'center' }}>
            No cooking instructions available.
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar hidden={false} />
      
      {/* Exit Button */}
      <Surface style={styles.exitButton} elevation={4}>
        <IconButton
          icon="close"
          size={28}
          iconColor={colors.text}
          onPress={handleExit}
        />
      </Surface>

      {/* Scrollable Steps */}
      <FlatList
        ref={flatListRef}
        data={[...steps, { stepNumber: steps.length + 1, instruction: '', completed: false }]}
        renderItem={renderItem}
        keyExtractor={(item, index) => `step-${index}`}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingTop: 80, paddingBottom: 40, paddingHorizontal: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exitButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  stepCard: {
    padding: 24,
    marginBottom: 16,
    borderRadius: 16,
    minHeight: 200,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  readyContainerVertical: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ingredientItemHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  checkboxSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientTextContainer: {
    flex: 1,
  },
  startButtonFixed: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionButtons: {
    gap: 12,
  },
  completionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
