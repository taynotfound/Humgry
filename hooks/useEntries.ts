import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type MealEntry = {
  id: string;
  what: string;
  amount: 'small' | 'medium' | 'large';
  time: string; // ISO
  fullness?: number; // 1-5
  nextEatAt?: string; // ISO
  // Nutritional data from OpenFoodFacts
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  image_url?: string;
  brands?: string;
  foodId?: string;
  // New features
  rating?: number; // 1-5 stars
  notes?: string; // Personal notes
  mood?: string; // Emoji mood: 😋 😐 😞
  tags?: string[]; // Breakfast, Lunch, Dinner, Snack, etc.
  // Hunger & Cost tracking
  hungerBefore?: number; // 1-5 scale, how hungry before eating
  hungerAfter?: number; // 1-5 scale, how hungry after eating (rarely used)
  cost?: number; // Cost in currency
  costCategory?: '$' | '$$' | '$$$' | '$$$$'; // Quick cost indicator
};

const ENTRIES_KEY = 'humngry:entries';
const POINTS_KEY = 'humngry:points';
const SLEEP_START_KEY = 'humngry:sleep_start';
const SLEEP_END_KEY = 'humngry:sleep_end';

export function useEntries() {
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [sleepStart, setSleepStart] = useState<string>('22:00'); // 10 PM
  const [sleepEnd, setSleepEnd] = useState<string>('07:00'); // 7 AM

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ENTRIES_KEY);
        const p = await AsyncStorage.getItem(POINTS_KEY);
        const ss = await AsyncStorage.getItem(SLEEP_START_KEY);
        const se = await AsyncStorage.getItem(SLEEP_END_KEY);
        if (raw) setEntries(JSON.parse(raw));
        if (p) setPoints(Number(p));
        if (ss) setSleepStart(ss);
        if (se) setSleepEnd(se);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  async function persist(all: MealEntry[]) {
    setEntries(all);
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(all));
  }

  async function addEntry(partial: Partial<MealEntry>) {
    const entry: MealEntry = {
      id: `${Date.now()}`,
      what: partial.what || 'Unknown',
      amount: (partial.amount as any) || 'medium',
      time: (partial.time || new Date()).toString(),
      fullness: partial.fullness ?? 3,
      nextEatAt: (partial.nextEatAt || new Date()).toString(),
      calories: partial.calories,
      protein: partial.protein,
      carbs: partial.carbs,
      fat: partial.fat,
      fiber: partial.fiber,
      image_url: partial.image_url,
      brands: partial.brands,
      foodId: partial.foodId,
      rating: partial.rating,
      notes: partial.notes,
      mood: partial.mood,
      tags: partial.tags,
      hungerBefore: partial.hungerBefore,
      hungerAfter: partial.hungerAfter,
      cost: partial.cost,
      costCategory: partial.costCategory,
    };
    const all = [entry, ...entries];
    await persist(all);
    // award points
    const pts = points + 10;
    setPoints(pts);
    await AsyncStorage.setItem(POINTS_KEY, String(pts));
    return entry;
  }

  async function updateEntry(id: string, updates: Partial<MealEntry>) {
    const all = entries.map(e => e.id === id ? { ...e, ...updates } : e);
    await persist(all);
  }

  async function deleteEntry(id: string) {
    const all = entries.filter(e => e.id !== id);
    await persist(all);
  }

  async function setSleepHours(start: string, end: string) {
    setSleepStart(start);
    setSleepEnd(end);
    await AsyncStorage.setItem(SLEEP_START_KEY, start);
    await AsyncStorage.setItem(SLEEP_END_KEY, end);
  }

  return { entries, addEntry, updateEntry, deleteEntry, points, sleepStart, sleepEnd, setSleepHours };
}

export default useEntries;
