import { useSettings } from '@/contexts/settings-context';
import { MealEntry } from '@/hooks/useEntries';
import { format } from 'date-fns';
import React from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';

interface MealComparisonModalProps {
  visible: boolean;
  meals: MealEntry[];
  onClose: () => void;
}

export default function MealComparisonModal({ visible, meals, onClose }: MealComparisonModalProps) {
  const { colors, getFontSize, accentColor } = useSettings();

  const getWinner = (key: keyof MealEntry) => {
    if (!meals.length) return null;
    return meals.reduce((prev, current) => {
      const prevValue = prev[key] as number || 0;
      const currentValue = current[key] as number || 0;
      return currentValue > prevValue ? current : prev;
    });
  };

  const proteinWinner = getWinner('protein');
  const calorieLowest = meals.reduce((prev, current) => {
    const prevCal = prev.calories || Infinity;
    const currentCal = current.calories || Infinity;
    return currentCal < prevCal ? current : prev;
  }, meals[0]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text, fontSize: getFontSize(20) }]}>
              ⚖️ Meal Comparison
            </Text>
            <IconButton icon="close" size={24} iconColor={colors.text} onPress={onClose} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {meals.length < 2 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: getFontSize(14) }]}>
                Select at least 2 meals to compare
              </Text>
            ) : (
              <>
                {meals.map((meal) => (
                  <Card key={meal.id} style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
                    <Card.Content>
                      <Text style={[styles.mealName, { color: colors.text, fontSize: getFontSize(16) }]}>
                        {meal.what}
                      </Text>
                      <Text style={[styles.mealTime, { color: colors.textSecondary, fontSize: getFontSize(12) }]}>
                        {format(new Date(meal.time), 'MMM d, h:mm a')}
                      </Text>
                      
                      <View style={styles.statsRow}>
                        <View style={styles.stat}>
                          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: getFontSize(12) }]}>
                            Calories
                          </Text>
                          <Text style={[
                            styles.statValue,
                            { 
                              color: meal.id === calorieLowest.id ? '#4ade80' : colors.text,
                              fontSize: getFontSize(18)
                            }
                          ]}>
                            {meal.calories ? Math.round(meal.calories) : 'N/A'}
                            {meal.id === calorieLowest.id && ' 🏆'}
                          </Text>
                        </View>
                        
                        <View style={styles.stat}>
                          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: getFontSize(12) }]}>
                            Protein
                          </Text>
                          <Text style={[
                            styles.statValue,
                            { 
                              color: proteinWinner?.id === meal.id ? '#4ade80' : colors.text,
                              fontSize: getFontSize(18)
                            }
                          ]}>
                            {meal.protein ? Math.round(meal.protein) : 'N/A'}g
                            {proteinWinner?.id === meal.id && ' 🏆'}
                          </Text>
                        </View>
                        
                        <View style={styles.stat}>
                          <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: getFontSize(12) }]}>
                            Portion
                          </Text>
                          <Text style={[styles.statValue, { color: colors.text, fontSize: getFontSize(18) }]}>
                            {meal.amount === 'small' ? '100g' : meal.amount === 'large' ? '500g' : '250g'}
                          </Text>
                        </View>
                      </View>

                      {meal.rating && (
                        <View style={styles.ratingRow}>
                          <Text style={[styles.ratingText, { color: colors.textSecondary, fontSize: getFontSize(13) }]}>
                            {'⭐'.repeat(meal.rating)} ({meal.rating}/5)
                          </Text>
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                ))}

                <Card style={[styles.summaryCard, { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}>
                  <Card.Content>
                    <Text style={[styles.summaryTitle, { color: colors.text, fontSize: getFontSize(16) }]}>
                      💡 Summary
                    </Text>
                    <Text style={[styles.summaryText, { color: colors.text, fontSize: getFontSize(14) }]}>
                      • Lowest calories: {calorieLowest.what} ({calorieLowest.calories ? Math.round(calorieLowest.calories) : 'N/A'} kcal)
                    </Text>
                    <Text style={[styles.summaryText, { color: colors.text, fontSize: getFontSize(14) }]}>
                      • Highest protein: {proteinWinner?.what} ({proteinWinner?.protein ? Math.round(proteinWinner.protein) : 'N/A'}g)
                    </Text>
                  </Card.Content>
                </Card>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 40,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  mealName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  mealTime: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff22',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
  },
  ratingRow: {
    marginTop: 8,
  },
  ratingText: {
    fontWeight: '600',
  },
  summaryCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  summaryTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryText: {
    marginBottom: 4,
    lineHeight: 20,
  },
});
