import AppBar from '@/components/AppBar';
import { useSettings } from '@/contexts/settings-context';
import { useEntries } from '@/hooks/useEntries';
import { calculateCostPerCalorie, generateCostInsights, getMonthlyBreakdown } from '@/services/costAnalysis';
import { analyzeFoodEffectiveness, calculateCurrentHungerScore, generateHungerInsights } from '@/services/hungerAnalysis';
import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, MD3DarkTheme, Provider as PaperProvider, ProgressBar, SegmentedButtons, Text } from 'react-native-paper';

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

export default function InsightsScreen() {
  const { entries } = useEntries();
  const { accentColor, getFontSize, colors, theme } = useSettings();
  const [activeTab, setActiveTab] = useState<'hunger' | 'cost'>('hunger');
  
  // Calculate insights
  const hungerInsights = useMemo(() => generateHungerInsights(entries), [entries]);
  const costInsights = useMemo(() => generateCostInsights(entries), [entries]);
  const currentHunger = useMemo(() => calculateCurrentHungerScore(entries), [entries]);
  const foodEffectiveness = useMemo(() => analyzeFoodEffectiveness(entries).slice(0, 5), [entries]);
  const monthlyBreakdown = useMemo(() => getMonthlyBreakdown(entries), [entries]);
  const costPerCalorie = useMemo(() => calculateCostPerCalorie(entries).slice(0, 5), [entries]);
  
  const hungerColor = 
    currentHunger.score <= 3 ? '#4CAF50' : 
    currentHunger.score <= 6 ? '#FFC107' : 
    currentHunger.score <= 8 ? '#FF9800' : '#F44336';

  return (
    <>
    <PaperProvider theme={darkTheme}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusBarSpacer} />
          <View style={styles.header}>
            <View style={{ flex: 1, maxWidth: '75%' }}>
              <Text style={[styles.title, { fontSize: getFontSize(28), color: colors.text }]}>
                🔥 Insights
              </Text>
              <Text style={[styles.subtitle, { fontSize: getFontSize(14), color: colors.textSecondary }]}>
                Understand your patterns
              </Text>
            </View>
            <View style={{ width: 80 }} />
          </View>

          {/* Tab Selector */}
          <SegmentedButtons
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            buttons={[
              { value: 'hunger', label: '🍽️ Hunger Patterns' },
              { value: 'cost', label: '💰 Food Costs' },
            ]}
            style={styles.tabs}
            theme={{ colors: { secondaryContainer: accentColor } }}
          />

          {activeTab === 'hunger' ? (
            <>
              {/* Current Hunger Score */}
              <Card style={[styles.card, { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: hungerColor }]}>
                <Card.Content>
                  <Text style={[styles.cardTitle, { fontSize: getFontSize(18), color: colors.text }]}>
                    Right Now
                  </Text>
                  <View style={styles.hungerScoreContainer}>
                    <View style={styles.hungerScoreCircle}>
                      <Text style={[styles.hungerScoreNumber, { fontSize: getFontSize(48), color: hungerColor }]}>
                        {currentHunger.score}
                      </Text>
                      <Text style={[styles.hungerScoreMax, { fontSize: getFontSize(16), color: colors.textSecondary }]}>
                        / 10
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.hungerStatus, { fontSize: getFontSize(20), color: colors.text, textTransform: 'capitalize' }]}>
                        {currentHunger.status.replace('-', ' ')}
                      </Text>
                      <Text style={[styles.hungerMessage, { fontSize: getFontSize(14), color: colors.textSecondary }]}>
                        {currentHunger.message}
                      </Text>
                      <ProgressBar 
                        progress={currentHunger.score / 10} 
                        color={hungerColor} 
                        style={[styles.hungerBar, { backgroundColor: colors.surfaceVariant }]} 
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>

              {/* Hunger Insights */}
              {hungerInsights.map((insight, idx) => (
                <Card key={idx} style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Card.Content>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.insightTitle, { fontSize: getFontSize(16), color: colors.text }]}>
                          {insight.title}
                        </Text>
                        <Text style={[styles.insightMessage, { fontSize: getFontSize(14), color: colors.textSecondary }]}>
                          {insight.message}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}

              {/* Food Effectiveness Leaderboard */}
              {foodEffectiveness.length > 0 && (
                <Card style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Card.Content>
                    <Text style={[styles.cardTitle, { fontSize: getFontSize(18), color: colors.text }]}>
                      🏆 Foods That Keep You Full
                    </Text>
                    <Text style={[styles.cardSubtitle, { fontSize: getFontSize(13), color: colors.textSecondary, marginBottom: 16 }]}>
                      Based on time between meals
                    </Text>
                    {foodEffectiveness.map((food, idx) => (
                      <View key={idx} style={[styles.leaderboardItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.leaderboardRank}>
                          <Text style={[styles.rankNumber, { fontSize: getFontSize(20), color: idx === 0 ? '#FFD700' : colors.textSecondary }]}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.foodName, { fontSize: getFontSize(15), color: colors.text }]}>
                            {food.foodName}
                          </Text>
                          <Text style={[styles.foodStats, { fontSize: getFontSize(12), color: colors.textSecondary }]}>
                            Keeps you full for {food.avgTimeBetweenMeals.toFixed(1)}h • Eaten {food.timesEaten}x
                          </Text>
                        </View>
                        <Chip
                          compact
                          style={[styles.effectivenessChip, { backgroundColor: `${accentColor}22` }]}
                          textStyle={{ color: accentColor, fontSize: getFontSize(11), fontWeight: '700' }}
                        >
                          {food.effectiveness.toFixed(1)}
                        </Chip>
                      </View>
                    ))}
                  </Card.Content>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Monthly Spending Overview */}
              <Card style={[styles.card, { backgroundColor: colors.surface }]}>
                <Card.Content>
                  <Text style={[styles.cardTitle, { fontSize: getFontSize(18), color: colors.text }]}>
                    📊 This Month
                  </Text>
                  <View style={styles.costOverview}>
                    <View style={styles.costMainStat}>
                      <Text style={[styles.costAmount, { fontSize: getFontSize(42), color: accentColor }]}>
                        ${monthlyBreakdown.total.toFixed(0)}
                      </Text>
                      <Text style={[styles.costLabel, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                        Total spent on food
                      </Text>
                    </View>
                    <View style={styles.costBreakdown}>
                      <View style={styles.costStat}>
                        <Text style={[styles.costStatValue, { fontSize: getFontSize(20), color: colors.text }]}>
                          ${monthlyBreakdown.avgPerDay.toFixed(2)}
                        </Text>
                        <Text style={[styles.costStatLabel, { fontSize: getFontSize(11), color: colors.textSecondary }]}>
                          Per day
                        </Text>
                      </View>
                      <View style={styles.costStat}>
                        <Text style={[styles.costStatValue, { fontSize: getFontSize(20), color: colors.text }]}>
                          ${monthlyBreakdown.avgPerMeal.toFixed(2)}
                        </Text>
                        <Text style={[styles.costStatLabel, { fontSize: getFontSize(11), color: colors.textSecondary }]}>
                          Per meal
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Home vs Takeout */}
                  {monthlyBreakdown.homeCooked > 0 && monthlyBreakdown.takeout > 0 && (
                    <View style={styles.comparison}>
                      <View style={[styles.comparisonBar, { backgroundColor: colors.surfaceVariant }]}>
                        <View 
                          style={[
                            styles.comparisonFill, 
                            { 
                              backgroundColor: '#4CAF50',
                              width: `${(monthlyBreakdown.homeCooked / monthlyBreakdown.total) * 100}%`,
                            }
                          ]} 
                        />
                      </View>
                      <View style={styles.comparisonLabels}>
                        <View style={styles.comparisonLabel}>
                          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                          <Text style={[styles.comparisonText, { fontSize: getFontSize(12), color: colors.text }]}>
                            Home: ${monthlyBreakdown.homeCooked.toFixed(0)}
                          </Text>
                        </View>
                        <View style={styles.comparisonLabel}>
                          <View style={[styles.legendDot, { backgroundColor: colors.surfaceVariant }]} />
                          <Text style={[styles.comparisonText, { fontSize: getFontSize(12), color: colors.text }]}>
                            Takeout: ${monthlyBreakdown.takeout.toFixed(0)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>

              {/* Cost Insights */}
              {costInsights.map((insight, idx) => (
                <Card key={idx} style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Card.Content>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.insightTitle, { fontSize: getFontSize(16), color: colors.text }]}>
                          {insight.title}
                        </Text>
                        <Text style={[styles.insightMessage, { fontSize: getFontSize(14), color: colors.textSecondary }]}>
                          {insight.message}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}

              {/* Cost Per Calorie */}
              {costPerCalorie.length > 0 && (
                <Card style={[styles.card, { backgroundColor: colors.surface }]}>
                  <Card.Content>
                    <Text style={[styles.cardTitle, { fontSize: getFontSize(18), color: colors.text }]}>
                      💵 Best Value Foods
                    </Text>
                    <Text style={[styles.cardSubtitle, { fontSize: getFontSize(13), color: colors.textSecondary, marginBottom: 16 }]}>
                      Cost per 100 calories
                    </Text>
                    {costPerCalorie.map((item, idx) => (
                      <View key={idx} style={[styles.leaderboardItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.leaderboardRank}>
                          <Text style={[styles.rankNumber, { fontSize: getFontSize(18), color: colors.textSecondary }]}>
                            {idx + 1}.
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.foodName, { fontSize: getFontSize(15), color: colors.text }]}>
                            {item.food}
                          </Text>
                          <Text style={[styles.foodStats, { fontSize: getFontSize(12), color: colors.textSecondary }]}>
                            {item.totalCalories.toFixed(0)} cal • ${item.totalSpent.toFixed(2)} total
                          </Text>
                        </View>
                        <Chip
                          compact
                          style={[styles.effectivenessChip, { backgroundColor: `${accentColor}22` }]}
                          textStyle={{ color: accentColor, fontSize: getFontSize(11), fontWeight: '700' }}
                        >
                          ${(item.costPerCalorie * 100).toFixed(2)}
                        </Chip>
                      </View>
                    ))}
                  </Card.Content>
                </Card>
              )}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
      <AppBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 122, paddingBottom: 100 },
  statusBarSpacer: { height: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontWeight: '500', marginTop: 2 },
  tabs: { marginBottom: 16 },
  card: { marginBottom: 16, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
  cardSubtitle: { fontStyle: 'italic' },
  hungerScoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12 },
  hungerScoreCircle: { alignItems: 'center' },
  hungerScoreNumber: { fontWeight: '900', lineHeight: 48 },
  hungerScoreMax: { fontWeight: '600', marginTop: -8 },
  hungerStatus: { fontWeight: '700', marginBottom: 4 },
  hungerMessage: { marginBottom: 8 },
  hungerBar: { height: 8, borderRadius: 4, marginTop: 4 },
  insightHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  insightEmoji: { fontSize: 32 },
  insightTitle: { fontWeight: '700', marginBottom: 4 },
  insightMessage: { lineHeight: 20 },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leaderboardRank: { width: 40 },
  rankNumber: { fontWeight: '700' },
  foodName: { fontWeight: '600', marginBottom: 2 },
  foodStats: { lineHeight: 16 },
  effectivenessChip: { height: 32, paddingVertical: 2 },
  costOverview: { marginTop: 12 },
  costMainStat: { alignItems: 'center', marginBottom: 20 },
  costAmount: { fontWeight: '900', lineHeight: 42 },
  costLabel: { fontWeight: '600', marginTop: 4 },
  costBreakdown: { flexDirection: 'row', gap: 16 },
  costStat: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 8 },
  costStatValue: { fontWeight: '700', marginBottom: 4 },
  costStatLabel: { fontWeight: '600', textTransform: 'uppercase' },
  comparison: { marginTop: 20 },
  comparisonBar: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  comparisonFill: { height: '100%' },
  comparisonLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  comparisonLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  comparisonText: { fontWeight: '600' },
});
