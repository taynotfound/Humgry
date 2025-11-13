import AppBar from '@/components/AppBar';
import FoodPicker from '@/components/FoodPicker';
import { useSettings } from '@/contexts/settings-context';
import { MealEntry, useEntries } from '@/hooks/useEntries';
import { initNotifications, scheduleMealNotification, scheduleSmartNotifications } from '@/services/notifications';
import { FoodProduct, calculateNextMealTime, getRandomTip } from '@/services/openfoodfacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Animated, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, IconButton, MD3DarkTheme, Modal, Provider as PaperProvider, Portal, SegmentedButtons, Text, TextInput } from 'react-native-paper';

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    background: '#0b0b0b',
    surface: '#1a1a1a',
    surfaceVariant: '#2a2a2a',
  },
};

export default function HomeScreen() {
  const { entries, addEntry, points } = useEntries();
  const { accentColor, getFontSize, getColor, colors, theme, dailyCalorieGoal } = useSettings();
  const [selectedFood, setSelectedFood] = useState<FoodProduct | null>(null);
  const [amount, setAmount] = useState<'small' | 'medium' | 'large'>('medium');
  const [fullness, setFullness] = useState('');
  const [tip, setTip] = useState(getRandomTip());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [celebrationAnim] = useState(new Animated.Value(0));
  
  // More Options
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [customTime, setCustomTime] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mood, setMood] = useState('');
  const [rating, setRating] = useState(0);
  const [hungerBefore, setHungerBefore] = useState(0);
  const [cost, setCost] = useState('');
  const [costCategory, setCostCategory] = useState<'$' | '$$' | '$$$' | '$$$$' | ''>('');

  const availableTags = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Takeout', 'Home-cooked', 'Healthy', 'Cheat Meal'];
  const moodOptions = ['😋', '😊', '😐', '😞', '🤤'];

  useEffect(() => {
    initNotifications();
    scheduleSmartNotifications();
    
    // Rotate tip every 30 seconds
    const interval = setInterval(() => setTip(getRandomTip()), 30000);
    
    // Check if first time user
    checkFirstTime();
    
    // Load water count for today
    loadWaterCount();
    
    return () => clearInterval(interval);
  }, []);

  async function checkFirstTime() {
    const hasSeenCalc = await AsyncStorage.getItem('humngry.hasSeenCalcInfo');
    if (!hasSeenCalc) {
      setShowCalcModal(true);
      await AsyncStorage.setItem('humngry.hasSeenCalcInfo', 'true');
    }
  }

  async function loadWaterCount() {
    const today = new Date().toDateString();
    const storedDate = await AsyncStorage.getItem('humngry.waterDate');
    const storedCount = await AsyncStorage.getItem('humngry.waterCount');
    
    if (storedDate === today && storedCount) {
      setWaterGlasses(parseInt(storedCount));
    } else if (storedDate !== today) {
      // New day, reset
      setWaterGlasses(0);
      await AsyncStorage.setItem('humngry.waterDate', today);
      await AsyncStorage.setItem('humngry.waterCount', '0');
    }
  }

  async function addWater() {
    const newCount = waterGlasses + 1;
    setWaterGlasses(newCount);
    await AsyncStorage.setItem('humngry.waterCount', String(newCount));
    
    // Celebration animation
    Animated.sequence([
      Animated.timing(celebrationAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function quickAddFood(foodName: string, calories: number) {
    const quickFood: FoodProduct = {
      id: `quick-${Date.now()}`,
      name: foodName,
      nutriments: {
        'energy-kcal_100g': calories,
        proteins_100g: 10,
        carbohydrates_100g: 25,
        fat_100g: 5,
      },
    };
    setSelectedFood(quickFood);
    setShowQuickAdd(false);
  }

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  async function handleSubmit() {
    if (!selectedFood) return;

    const mealTime = showMoreOptions ? customTime : new Date();
    
    // Calculate calories and macros based on amount
    const multiplier = amount === 'small' ? 0.7 : amount === 'large' ? 1.3 : 1;
    const calories = (selectedFood.nutriments['energy-kcal_100g'] || 0) * multiplier;
    const protein = (selectedFood.nutriments.proteins_100g || 0) * multiplier;
    const carbs = (selectedFood.nutriments.carbohydrates_100g || 0) * multiplier;
    const fat = (selectedFood.nutriments.fat_100g || 0) * multiplier;
    const fiber = (selectedFood.nutriments.fiber_100g || 0) * multiplier;

    const fullnessValue = fullness ? parseInt(fullness) : 3; // Default to 3 if not selected

    const nextEatAt = calculateNextMealTime({
      calories,
      protein,
      carbs,
      fat,
      fiber,
      amount,
      fullness: fullnessValue,
      timeOfDay: mealTime,
    });

    const entry: Partial<MealEntry> = {
      what: selectedFood.name,
      brands: selectedFood.brands,
      amount,
      fullness: fullnessValue,
      time: mealTime.toISOString(),
      nextEatAt: nextEatAt.toISOString(),
      calories,
      protein,
      carbs,
      fat,
      fiber,
      image_url: selectedFood.image_url,
      foodId: selectedFood.id,
      notes: notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      mood: mood || undefined,
      rating: rating > 0 ? rating : undefined,
      hungerBefore: hungerBefore > 0 ? hungerBefore : undefined,
      cost: cost ? parseFloat(cost) : undefined,
      costCategory: costCategory || undefined,
    };

    await addEntry(entry);
    await AsyncStorage.setItem('humngry.lastMealLogged', mealTime.toISOString());
    await scheduleMealNotification({
      when: nextEatAt,
      title: '🍽️ Time to eat?',
      body: `You might be hungry again! Check in and see how you feel.`,
    });
    await scheduleSmartNotifications();

    // Show success animation with celebration
    setShowSuccess(true);
    Animated.sequence([
      Animated.spring(celebrationAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 300,
        delay: 1500,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => setShowSuccess(false), 2000);

    // Reset form
    setSelectedFood(null);
    setAmount('medium');
    setFullness('');
    setShowMoreOptions(false);
    setCustomTime(new Date());
    setNotes('');
    setSelectedTags([]);
    setMood('');
    setRating(0);
    setHungerBefore(0);
    setCost('');
    setCostCategory('');
    setTip(getRandomTip());
  }

  return (
    <PaperProvider theme={darkTheme}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.statusBarSpacer} />
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1, maxWidth: '75%' }}>
                <Text style={[styles.title, { color: colors.text }]}>🍽️ Humngry</Text>
                <Text style={[styles.tagline, { color: colors.textSecondary }]}>Track your meals simply</Text>
              </View>
              <View style={{ width: 80 }} />
            </View>

            {/* Stats Row Below Title */}
            {entries.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <View style={[styles.quickStats, { backgroundColor: colors.card, borderColor: `${accentColor}33`, flex: 1 }]}>
                  <Text style={[styles.quickStatLabel, { fontSize: getFontSize(11), color: colors.textTertiary }]}>Today</Text>
                  <Text style={[styles.quickStatValue, { fontSize: getFontSize(20), color: colors.text }]}>{entries.filter(e => 
                    new Date(e.time).toDateString() === new Date().toDateString()
                  ).length} 🍽️</Text>
                  <Text style={[styles.quickStatPoints, { fontSize: getFontSize(12), color: accentColor }]}>{points} pts</Text>
                </View>
                <View style={[styles.quickStats, { backgroundColor: colors.card, borderColor: colors.success + '33', flex: 1 }]}>
                  <Text style={[styles.quickStatLabel, { fontSize: getFontSize(11), color: colors.textTertiary }]}>Badges</Text>
                  <Text style={[styles.quickStatValue, { fontSize: getFontSize(20), color: colors.text }]}>🏆</Text>
                  <Text style={[styles.quickStatPoints, { fontSize: getFontSize(12), color: colors.success }]}>
                    {Math.min(7, Math.floor(points / 50))}/7
                  </Text>
                </View>
              </View>
            )}

            {/* Next Meal Time - Prominent Display */}
            {entries.length > 0 && entries[0].nextEatAt && (
              <Card style={[styles.nextMealCard, { borderColor: accentColor }]}>
                <Card.Content style={styles.nextMealContent}>
                  <Text style={[styles.nextMealLabel, { fontSize: getFontSize(13) }]}>⏰ Next Meal Around</Text>
                  <Text style={[styles.nextMealTime, { fontSize: getFontSize(36), color: accentColor }]}>
                    {new Date(entries[0].nextEatAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={[styles.nextMealSubtext, { fontSize: getFontSize(12) }]}>
                    Based on your last meal at {new Date(entries[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Card.Content>
              </Card>
            )}

          </View>

          {/* Quick Actions Row - Improved */}
          <View style={styles.quickActionsRow}>
            <View style={[styles.quickActionCard, styles.waterCard, { borderColor: waterGlasses >= 8 ? '#069420' : accentColor, backgroundColor: colors.card }]}>
              <Text style={styles.quickActionEmoji}>💧</Text>
              <Text style={[styles.quickActionValue, { fontSize: getFontSize(18), color: waterGlasses >= 8 ? '#069420' : colors.text }]}>
                {waterGlasses}/8
              </Text>
              <Text style={[styles.quickActionLabel, { fontSize: getFontSize(11), color: colors.textSecondary, marginBottom: 6 }]}>
                Water Glasses
              </Text>
              <View style={styles.waterButtons}>
                <TouchableOpacity
                  style={[styles.waterButton, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => {
                    if (waterGlasses > 0) {
                      const newCount = waterGlasses - 1;
                      setWaterGlasses(newCount);
                      AsyncStorage.setItem('humngry.waterCount', newCount.toString());
                      AsyncStorage.setItem('humngry.waterDate', new Date().toDateString());
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.text, fontSize: getFontSize(16), fontWeight: '700' }}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.waterButton, { backgroundColor: accentColor }]}
                  onPress={addWater}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: theme === 'dark' ? '#000' : '#fff', fontSize: getFontSize(16), fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.quickActionCard, { borderColor: accentColor, backgroundColor: colors.card }]}
              onPress={() => setShowQuickAdd(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickActionEmoji}>⚡</Text>
              <Text style={[styles.quickActionLabel, { fontSize: getFontSize(12), color: colors.text, marginTop: 8, fontWeight: '600' }]}>
                Quick Add
              </Text>
              <Text style={[styles.quickActionSubtext, { fontSize: getFontSize(10), color: colors.textSecondary, marginTop: 4 }]}>
                Fast logging
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tip Card - Separated for better visibility */}
          <TouchableOpacity onPress={() => setTip(getRandomTip())} activeOpacity={0.7} style={{ marginBottom: 16 }}>
            <Card style={[styles.tipCardMain, { borderLeftColor: accentColor, backgroundColor: colors.card }]}>
              <Card.Content style={styles.tipCardContent}>
                <View style={styles.tipIconContainer}>
                  <Text style={styles.tipIcon}>💡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tipTitle, { fontSize: getFontSize(12), color: accentColor }]}>Daily Tip</Text>
                  <Text style={[styles.tipTextMain, { fontSize: getFontSize(14), color: colors.text }]}>{tip}</Text>
                  <Text style={[styles.tipHintMain, { fontSize: getFontSize(10), color: colors.textTertiary }]}>Tap for another tip</Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Success Banner */}
          {showSuccess && (
            <Animated.View
              style={{
                transform: [{
                  scale: celebrationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.1],
                  }),
                }],
                opacity: celebrationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
              }}
            >
              <Card style={styles.successCard}>
                <Card.Content>
                  <Text style={styles.successText}>✨ Meal logged! +10 points 🎉</Text>
                </Card.Content>
              </Card>
            </Animated.View>
          )}

          <Card style={styles.card}>
            <Card.Title title="🍴 Log Your Meal" titleStyle={styles.cardTitle} />
            <Card.Content>
              <FoodPicker onSelect={setSelectedFood} />

              {selectedFood && (
                <View style={styles.selectedFood}>
                  <Chip icon="check" style={[styles.selectedChip, { backgroundColor: accentColor }]} textStyle={[styles.chipText, { fontSize: getFontSize(14) }]}>
                    {selectedFood.name}
                  </Chip>
                  {(selectedFood.nutriments['energy-kcal_100g'] || selectedFood.nutriments.proteins_100g) && (
                    <View style={styles.nutritionRow}>
                      {selectedFood.nutriments['energy-kcal_100g'] && (
                        <Chip compact icon="fire" style={styles.infoChip}>
                          {Math.round(selectedFood.nutriments['energy-kcal_100g'])} kcal
                        </Chip>
                      )}
                      {selectedFood.nutriments.proteins_100g && (
                        <Chip compact style={styles.infoChip}>
                          🥩 {Math.round(selectedFood.nutriments.proteins_100g)}g
                        </Chip>
                      )}
                    </View>
                  )}
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.label, { fontSize: getFontSize(15) }]}>⚖️ Portion Size</Text>
                <SegmentedButtons
                  value={amount}
                  onValueChange={(v) => setAmount(v as any)}
                  buttons={[
                    { value: 'small', label: '100g 🥄' },
                    { value: 'medium', label: '250g 🍽️' },
                    { value: 'large', label: '500g 🍖' },
                  ]}
                  style={styles.segmented}
                  theme={{ colors: { secondaryContainer: accentColor } }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { fontSize: getFontSize(15) }]}>😊 How Full? (Optional)</Text>
                <View style={styles.fullnessGrid}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.fullnessButton, 
                        fullness === String(level) && { ...styles.fullnessButtonActive, borderColor: accentColor, backgroundColor: `${accentColor}22` }
                      ]}
                      onPress={() => setFullness(String(level))}
                    >
                      <Text style={styles.fullnessEmoji}>
                        {level === 1 ? '😋' : level === 2 ? '🙂' : level === 3 ? '😐' : level === 4 ? '😊' : '😌'}
                      </Text>
                      <Text style={[styles.fullnessNumber, { fontSize: getFontSize(13) }]}>{level}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* More Options Toggle */}
              <TouchableOpacity
                style={[styles.moreOptionsToggle, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
                onPress={() => setShowMoreOptions(!showMoreOptions)}
                activeOpacity={0.7}
              >
                <Text style={[styles.moreOptionsText, { fontSize: getFontSize(15), color: colors.text }]}>
                  ⚙️ More Options
                </Text>
                <Text style={[styles.chevron, { color: accentColor }]}>
                  {showMoreOptions ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {/* More Options Content */}
              {showMoreOptions && (
                <View style={[styles.moreOptionsContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {/* Custom Time */}
                  <View style={styles.optionGroup}>
                    <Text style={[styles.optionLabel, { fontSize: getFontSize(15), color: colors.text }]}>
                      🕐 Meal Time
                    </Text>
                    <Text style={[styles.optionHint, { fontSize: getFontSize(12), color: colors.textSecondary }]}>
                      Log a meal from the past
                    </Text>
                    <View style={styles.timeSelector}>
                      <TouchableOpacity
                        style={[styles.timeQuickButton, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => {
                          const time = new Date();
                          time.setHours(time.getHours() - 1);
                          setCustomTime(time);
                        }}
                      >
                        <Text style={[styles.timeQuickText, { fontSize: getFontSize(13), color: colors.text }]}>1h ago</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.timeQuickButton, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => {
                          const time = new Date();
                          time.setHours(time.getHours() - 2);
                          setCustomTime(time);
                        }}
                      >
                        <Text style={[styles.timeQuickText, { fontSize: getFontSize(13), color: colors.text }]}>2h ago</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.timeQuickButton, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => {
                          const time = new Date();
                          time.setHours(time.getHours() - 3);
                          setCustomTime(time);
                        }}
                      >
                        <Text style={[styles.timeQuickText, { fontSize: getFontSize(13), color: colors.text }]}>3h ago</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.timeQuickButton, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => setCustomTime(new Date())}
                      >
                        <Text style={[styles.timeQuickText, { fontSize: getFontSize(13), color: colors.text }]}>Now</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.selectedTimeText, { fontSize: getFontSize(13), color: accentColor, marginTop: 8 }]}>
                      Selected: {customTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {customTime.toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Tags */}
                  <View style={styles.optionGroup}>
                    <Text style={[styles.optionLabel, { fontSize: getFontSize(15), color: colors.text }]}>
                      🏷️ Tags
                    </Text>
                    <View style={styles.tagsContainer}>
                      {availableTags.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={[
                            styles.tagChip,
                            { 
                              backgroundColor: selectedTags.includes(tag) ? accentColor : colors.surfaceVariant,
                              borderColor: selectedTags.includes(tag) ? accentColor : colors.border,
                            }
                          ]}
                          onPress={() => toggleTag(tag)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.tagText,
                            { 
                              fontSize: getFontSize(12),
                              color: selectedTags.includes(tag) ? (theme === 'dark' ? '#000' : '#fff') : colors.text,
                            }
                          ]}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Mood */}
                  <View style={styles.optionGroup}>
                    <Text style={[styles.optionLabel, { fontSize: getFontSize(15), color: colors.text }]}>
                      😊 How did it taste?
                    </Text>
                    <View style={styles.moodContainer}>
                      {moodOptions.map((moodEmoji) => (
                        <TouchableOpacity
                          key={moodEmoji}
                          style={[
                            styles.moodButton,
                            { 
                              backgroundColor: mood === moodEmoji ? `${accentColor}33` : colors.surfaceVariant,
                              borderColor: mood === moodEmoji ? accentColor : colors.border,
                            }
                          ]}
                          onPress={() => setMood(mood === moodEmoji ? '' : moodEmoji)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.moodEmoji}>{moodEmoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Rating */}
                  <View style={styles.optionGroup}>
                    <Text style={[styles.optionLabel, { fontSize: getFontSize(15), color: colors.text }]}>
                      ⭐ Rating
                    </Text>
                    <View style={styles.ratingContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setRating(rating === star ? 0 : star)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.starIcon}>
                            {star <= rating ? '⭐' : '☆'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Hunger Before */}
                  <View style={styles.optionGroup}>
                    <Text style={[styles.optionLabel, { fontSize: getFontSize(15), color: colors.text }]}>
                      🍽️ How hungry were you?
                    </Text>
                    <Text style={[styles.optionHint, { fontSize: getFontSize(12), color: colors.textSecondary }]}>
                      Helps us learn which foods keep you full
                    </Text>
                    <View style={styles.hungerScale}>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.hungerButton,
                            { 
                              backgroundColor: hungerBefore === level ? `${accentColor}33` : colors.surfaceVariant,
                              borderColor: hungerBefore === level ? accentColor : colors.border,
                            }
                          ]}
                          onPress={() => setHungerBefore(level)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.hungerEmoji}>
                            {level === 1 ? '😐' : level === 2 ? '🙂' : level === 3 ? '😋' : level === 4 ? '🤤' : '😩'}
                          </Text>
                          <Text style={[styles.hungerLabel, { fontSize: getFontSize(10), color: colors.text }]}>
                            {level === 1 ? 'Not' : level === 2 ? 'A bit' : level === 3 ? 'Hungry' : level === 4 ? 'Very' : 'Starving'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Cost Tracking */}
                  <View style={styles.optionGroup}>
                    <Text style={[styles.optionLabel, { fontSize: getFontSize(15), color: colors.text }]}>
                      💰 Meal Cost (Optional)
                    </Text>
                    <View style={styles.costSelector}>
                      {(['$', '$$', '$$$', '$$$$'] as const).map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.costButton,
                            { 
                              backgroundColor: costCategory === cat ? accentColor : colors.surfaceVariant,
                              borderColor: costCategory === cat ? accentColor : colors.border,
                            }
                          ]}
                          onPress={() => {
                            setCostCategory(costCategory === cat ? '' : cat);
                            if (!cost) {
                              const estimates = { '$': '5', '$$': '12', '$$$': '25', '$$$$': '50' };
                              setCost(estimates[cat]);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.costText,
                            { 
                              fontSize: getFontSize(16),
                              color: costCategory === cat ? (theme === 'dark' ? '#000' : '#fff') : colors.text,
                            }
                          ]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      mode="outlined"
                      value={cost}
                      onChangeText={setCost}
                      placeholder="Exact amount (e.g., 8.50)"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="decimal-pad"
                      style={[styles.costInput, { backgroundColor: colors.background, marginTop: 8 }]}
                      outlineColor={colors.border}
                      activeOutlineColor={accentColor}
                      textColor={colors.text}
                      left={<TextInput.Affix text="$" />}
                    />
                  </View>

                  {/* Notes */}
                  <View style={styles.optionGroup}>
                    <Text style={[styles.optionLabel, { fontSize: getFontSize(15), color: colors.text }]}>
                      📝 Notes
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Add notes about this meal..."
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      numberOfLines={3}
                      style={[styles.notesInput, { backgroundColor: colors.background }]}
                      outlineColor={colors.border}
                      activeOutlineColor={accentColor}
                      textColor={colors.text}
                    />
                  </View>
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={!selectedFood}
                style={styles.submitButton}
                icon="check-circle"
                buttonColor={accentColor}
                labelStyle={{ fontSize: getFontSize(16) }}
              >
                Save Meal
              </Button>
            </Card.Content>
          </Card>

          {/* Calculation Info Button - Bottom of screen */}
          <TouchableOpacity onPress={() => setShowCalcModal(true)} activeOpacity={0.7}>
            <Card style={[styles.infoButtonCard, { borderLeftColor: accentColor }]}>
              <Card.Content style={styles.infoButtonContent}>
                <Text style={[styles.infoButtonText, { fontSize: getFontSize(14), color: accentColor }]}>
                  📊 How We Calculate Your Next Meal
                </Text>
                <IconButton icon="chevron-right" iconColor={accentColor} size={20} style={styles.infoButtonIcon} />
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={{ height: 8 }} />
        </ScrollView>

        {/* Calculation Info Modal */}
        <Portal>
          <Modal
            visible={showCalcModal}
            onDismiss={() => setShowCalcModal(false)}
            contentContainerStyle={[styles.modalContent, { borderColor: accentColor }]}
          >
            <Text style={[styles.modalTitle, { fontSize: getFontSize(20), color: accentColor }]}>
              📊 How We Calculate Your Next Meal
            </Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalText, { fontSize: getFontSize(14) }]}>
                We use several factors to estimate when you might be hungry again:
              </Text>
              
              <Text style={[styles.modalSectionTitle, { fontSize: getFontSize(15) }]}>🔥 Calories</Text>
              <Text style={[styles.modalText, { fontSize: getFontSize(13) }]}>
                Higher calories = longer time until hungry. More energy takes longer to use up.
              </Text>

              <Text style={[styles.modalSectionTitle, { fontSize: getFontSize(15) }]}>💪 Protein & Fiber</Text>
              <Text style={[styles.modalText, { fontSize: getFontSize(13) }]}>
                Keep you full longer by slowing digestion and stabilizing blood sugar.
              </Text>

              <Text style={[styles.modalSectionTitle, { fontSize: getFontSize(15) }]}>⚖️ Portion Size</Text>
              <Text style={[styles.modalText, { fontSize: getFontSize(13) }]}>
                • Small: ×0.7 (70% of normal){'\n'}
                • Medium: ×1.0 (100% baseline){'\n'}
                • Large: ×1.3 (130% more filling)
              </Text>

              <Text style={[styles.modalSectionTitle, { fontSize: getFontSize(15) }]}>😊 Fullness Rating</Text>
              <Text style={[styles.modalText, { fontSize: getFontSize(13) }]}>
                Adjusts timing by ±30 minutes based on how full you feel right now.
              </Text>

              <Text style={[styles.modalSectionTitle, { fontSize: getFontSize(15) }]}>🕐 Time of Day</Text>
              <Text style={[styles.modalText, { fontSize: getFontSize(13) }]}>
                • Breakfast: 3-4 hours{'\n'}
                • Lunch: 4-5 hours{'\n'}
                • Dinner: 5-6 hours
              </Text>

              <Text style={[styles.modalNote, { fontSize: getFontSize(12) }]}>
                💡 These are estimates based on typical digestion patterns. Everyone's body is different! Use these as gentle reminders, not strict rules.
              </Text>
            </ScrollView>
            
            <Button
              mode="contained"
              onPress={() => setShowCalcModal(false)}
              buttonColor={accentColor}
              style={styles.modalButton}
              labelStyle={{ fontSize: getFontSize(15) }}
            >
              Got it!
            </Button>
          </Modal>

          {/* Quick Add Modal */}
          <Modal
            visible={showQuickAdd}
            onDismiss={() => setShowQuickAdd(false)}
            contentContainerStyle={[styles.quickAddModal, { borderColor: accentColor, backgroundColor: colors.surface }]}
          >
            <Text style={[styles.quickAddTitle, { fontSize: getFontSize(20), color: accentColor }]}>
              ⚡ Quick Add
            </Text>
            <Text style={[styles.modalText, { fontSize: getFontSize(13), textAlign: 'center', marginBottom: 16 }]}>
              Tap a common food to quickly log it
            </Text>
            
            <View style={styles.quickAddGrid}>
              <TouchableOpacity
                style={[styles.quickAddButton, { borderColor: `${accentColor}55` }]}
                onPress={() => quickAddFood('Banana', 105)}
              >
                <Text style={styles.quickAddEmoji}>🍌</Text>
                <Text style={[styles.quickAddName, { fontSize: getFontSize(14) }]}>Banana</Text>
                <Text style={[styles.quickAddCals, { fontSize: getFontSize(12) }]}>~105 cal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAddButton, { borderColor: `${accentColor}55` }]}
                onPress={() => quickAddFood('Apple', 95)}
              >
                <Text style={styles.quickAddEmoji}>🍎</Text>
                <Text style={[styles.quickAddName, { fontSize: getFontSize(14) }]}>Apple</Text>
                <Text style={[styles.quickAddCals, { fontSize: getFontSize(12) }]}>~95 cal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAddButton, { borderColor: `${accentColor}55` }]}
                onPress={() => quickAddFood('Coffee', 5)}
              >
                <Text style={styles.quickAddEmoji}>☕</Text>
                <Text style={[styles.quickAddName, { fontSize: getFontSize(14) }]}>Coffee</Text>
                <Text style={[styles.quickAddCals, { fontSize: getFontSize(12) }]}>~5 cal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAddButton, { borderColor: `${accentColor}55` }]}
                onPress={() => quickAddFood('Yogurt', 150)}
              >
                <Text style={styles.quickAddEmoji}>🥛</Text>
                <Text style={[styles.quickAddName, { fontSize: getFontSize(14) }]}>Yogurt</Text>
                <Text style={[styles.quickAddCals, { fontSize: getFontSize(12) }]}>~150 cal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAddButton, { borderColor: `${accentColor}55` }]}
                onPress={() => quickAddFood('Sandwich', 350)}
              >
                <Text style={styles.quickAddEmoji}>🥪</Text>
                <Text style={[styles.quickAddName, { fontSize: getFontSize(14) }]}>Sandwich</Text>
                <Text style={[styles.quickAddCals, { fontSize: getFontSize(12) }]}>~350 cal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAddButton, { borderColor: `${accentColor}55` }]}
                onPress={() => quickAddFood('Salad', 200)}
              >
                <Text style={styles.quickAddEmoji}>🥗</Text>
                <Text style={[styles.quickAddName, { fontSize: getFontSize(14) }]}>Salad</Text>
                <Text style={[styles.quickAddCals, { fontSize: getFontSize(12) }]}>~200 cal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAddButton, { borderColor: `${accentColor}55` }]}
                onPress={() => quickAddFood('Protein Bar', 200)}
              >
                <Text style={styles.quickAddEmoji}>🍫</Text>
                <Text style={[styles.quickAddName, { fontSize: getFontSize(14) }]}>Protein Bar</Text>
                <Text style={[styles.quickAddCals, { fontSize: getFontSize(12) }]}>~200 cal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAddButton, { borderColor: `${accentColor}55` }]}
                onPress={() => quickAddFood('Snack', 150)}
              >
                <Text style={styles.quickAddEmoji}>🍪</Text>
                <Text style={[styles.quickAddName, { fontSize: getFontSize(14) }]}>Snack</Text>
                <Text style={[styles.quickAddCals, { fontSize: getFontSize(12) }]}>~150 cal</Text>
              </TouchableOpacity>
            </View>
            
            <Button
              mode="outlined"
              onPress={() => setShowQuickAdd(false)}
              style={styles.modalButton}
              labelStyle={{ fontSize: getFontSize(15), color: accentColor }}
              textColor={accentColor}
            >
              Cancel
            </Button>
          </Modal>
        </Portal>
      </SafeAreaView>
      <AppBar />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 122, paddingBottom: 100 },
  statusBarSpacer: { height: 24 },
  header: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
  tagline: { fontSize: 13, fontWeight: '500' },
  screenDescription: { fontSize: 13, lineHeight: 18, marginTop: 8, maxWidth: '85%' },
  quickStats: { 
    padding: 12, 
    borderRadius: 12, 
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
  },
  quickStatLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  quickStatValue: { fontSize: 20, fontWeight: '800' },
  quickStatPoints: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  nextMealCard: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 6,
    borderWidth: 2,
  },
  nextMealContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  nextMealLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextMealTime: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  nextMealSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  successCard: { 
    marginBottom: 16, 
    borderRadius: 12, 
    borderWidth: 2,
  },
  successText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  tipCard: { borderLeftWidth: 4, borderRadius: 12, marginBottom: 16 },
  tipText: { fontSize: 15, lineHeight: 22, marginBottom: 4 },
  tipHint: { fontSize: 11, fontStyle: 'italic' },
  infoButtonCard: {
    borderLeftWidth: 4,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  infoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  infoButtonIcon: {
    margin: 0,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
    borderWidth: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  modalNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    lineHeight: 18,
  },
  modalButton: {
    marginTop: 16,
  },
  card: { marginBottom: 16, borderRadius: 12, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  selectedFood: { marginTop: 12, marginBottom: 8 },
  label: { fontSize: 16, marginBottom: 8, fontWeight: '700' },
  selectedChip: { marginBottom: 8 },
  chipText: { fontWeight: '700' },
  nutritionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  infoChip: { height: 32, paddingVertical: 2 },
  formGroup: { marginTop: 24 },
  helpText: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  helpTextInline: { fontSize: 13, marginTop: 4, marginBottom: 8, lineHeight: 18 },
  segmented: { marginBottom: 8, marginTop: 8 },
  examplesBox: { 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 12,
    borderLeftWidth: 3,
  },
  examplesTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  exampleText: { fontSize: 13, lineHeight: 20, marginBottom: 4 },
  fullnessGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  fullnessButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
  },
  fullnessButtonActive: {},
  fullnessEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  fullnessNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  submitButton: { marginTop: 24, borderRadius: 8, paddingVertical: 4 },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    minHeight: 120,
  },
  waterCard: {
    flex: 1.2,
  },
  quickActionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionValue: {
    fontWeight: '800',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  quickActionSubtext: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  waterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  tipCardMain: {
    borderLeftWidth: 4,
    borderRadius: 12,
    elevation: 3,
  },
  tipCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 24,
  },
  tipTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tipTextMain: {
    lineHeight: 20,
    marginBottom: 4,
    fontWeight: '500',
  },
  tipHintMain: {
    fontStyle: 'italic',
  },
  quickAddModal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  quickAddTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  quickAddButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  quickAddEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  quickAddName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickAddCals: {
    fontSize: 12,
  },
  moreOptionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  moreOptionsText: {
    fontWeight: '600',
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
  },
  moreOptionsContent: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  optionGroup: {
    gap: 8,
  },
  optionLabel: {
    fontWeight: '700',
  },
  optionHint: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  timeQuickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeQuickText: {
    fontWeight: '600',
  },
  selectedTimeText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontWeight: '600',
  },
  moodContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  starIcon: {
    fontSize: 32,
  },
  notesInput: {
    marginTop: 4,
  },
  hungerScale: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  hungerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  hungerEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  hungerLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  costSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  costButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  costText: {
    fontWeight: '700',
  },
  costInput: {
    height: 48,
  },
});

