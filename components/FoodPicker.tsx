import { useSettings } from '@/contexts/settings-context';
import { FoodProduct, searchFood } from '@/services/openfoodfacts';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, Searchbar, Text } from 'react-native-paper';

interface FoodPickerProps {
  onSelect: (food: FoodProduct) => void;
}

function getNutriscoreStyle(grade: string) {
  const g = grade.toUpperCase();
  if (g === 'A') return { backgroundColor: '#2d7a3e' };
  if (g === 'B') return { backgroundColor: '#5e9e3e' };
  if (g === 'C') return { backgroundColor: '#f0c000' };
  if (g === 'D') return { backgroundColor: '#e67e22' };
  if (g === 'E') return { backgroundColor: '#e74c3c' };
  return {};
}

export default function FoodPicker({ onSelect }: FoodPickerProps) {
  const { accentColor } = useSettings();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  async function performSearch(text: string) {
    if (text.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const foods = await searchFood(text);
    setResults(foods);
    setLoading(false);
  }

  function handleSearch(text: string) {
    setQuery(text);
    
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    if (text.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    // Show loading immediately
    setLoading(true);
    
    // Set new timeout to search after 500ms of no typing
    const timeout = setTimeout(() => {
      performSearch(text);
    }, 500);
    
    setDebounceTimeout(timeout);
  }

  function handleSelect(food: FoodProduct) {
    onSelect(food);
    setQuery('');
    setResults([]);
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { color: accentColor }]}>
        🔍 Type what you ate (examples: banana, pizza, rice, chicken)
      </Text>
      <Searchbar
        placeholder="Type food name here..."
        onChangeText={handleSearch}
        value={query}
        style={styles.searchbar}
        loading={loading}
        iconColor={accentColor}
        placeholderTextColor="#aaa"
      />
      
      {query.length >= 2 && (
        <Card style={styles.resultsCard}>
          {results.length === 0 && !loading && (
            <View style={styles.customEntry}>
              <Text style={styles.customText}>Can't find "{query}"?</Text>
              <Button
                mode="contained"
                onPress={() => {
                  onSelect({
                    id: `custom-${Date.now()}`,
                    name: query,
                    nutriments: {
                      'energy-kcal_100g': 200,
                      proteins_100g: 10,
                      carbohydrates_100g: 25,
                      fat_100g: 5,
                      fiber_100g: 2,
                    },
                  } as FoodProduct);
                  setQuery('');
                  setResults([]);
                }}
                style={styles.customButton}
                icon="plus-circle"
              >
                Use "{query}" anyway
              </Button>
            </View>
          )}
          {results.length > 0 && (
            <ScrollView 
              style={styles.resultsList}
              nestedScrollEnabled={true}
            >
              {results.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultItem}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultContent}>
                    {item.image_url && (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.thumbnail}
                      />
                    )}
                    <View style={styles.resultText}>
                      <Text style={styles.foodName}>{item.name}</Text>
                      {item.brands && (
                        <Text style={styles.brandName}>{item.brands}</Text>
                      )}
                      <View style={styles.nutrients}>
                        {item.nutriments['energy-kcal_100g'] && (
                          <Chip compact icon="fire" style={styles.chip}>
                            {Math.round(item.nutriments['energy-kcal_100g'])} kcal
                          </Chip>
                        )}
                        {item.nutriscore_grade && (
                          <Chip
                            compact
                            style={[styles.chip, getNutriscoreStyle(item.nutriscore_grade)]}
                          >
                            {item.nutriscore_grade.toUpperCase()}
                          </Chip>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  searchbar: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
  },
  resultsCard: {
    marginTop: 8,
    backgroundColor: '#1e1e1e',
    maxHeight: 300,
  },
  customEntry: {
    padding: 16,
    alignItems: 'center',
  },
  customText: {
    color: '#bbb',
    fontSize: 15,
    marginBottom: 12,
  },
  customButton: {
    marginTop: 4,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  foodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  brandName: {
    color: '#bbb',
    fontSize: 13,
    marginTop: 2,
  },
  nutrients: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    height: 24,
    backgroundColor: '#2a2a2a',
  },
  instruction: { 
    fontSize: 15, 
    fontWeight: '700', 
    marginBottom: 12,
    lineHeight: 22,
  },
  nutriscoreA: { backgroundColor: '#2d7a3e' },
  nutriscoreB: { backgroundColor: '#5e9e3e' },
  nutriscoreC: { backgroundColor: '#f0c000' },
  nutriscoreD: { backgroundColor: '#e67e22' },
  nutriscoreE: { backgroundColor: '#e74c3c' },
});
