import { BarChart } from '@/components/Charts';
import AppBar from '@/components/AppBar';
import { useSettings } from '@/contexts/settings-context';
import { useEntries } from '@/hooks/useEntries';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Card, MD3DarkTheme, MD3LightTheme, Provider as PaperProvider, ProgressBar, Text } from 'react-native-paper';

// Memoized animated card for better performance
const AnimatedCard = memo(({ children, style, delay = 0, colors }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Card style={[style, { backgroundColor: colors.surface }]}>{children}</Card>
    </Animated.View>
  );
});

export default function StatsScreen() {
  const { entries, points } = useEntries();
  const { accentColor, getFontSize, getColor, theme, colors, dailyCalorieGoal } = useSettings();
  
  // Animation values for main container
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Performance optimizations:
  // 1. useMemo for all expensive calculations (prevents recalculation on every render)
  // 2. Limited iterations in loops (max 365 days for streaks)
  // 3. Memoized chart data separately
  // 4. React.memo on Chart components
  // 5. Animated components for smooth UX
  
  // Memoize expensive calculations
  const stats = useMemo(() => {
    const streak = Math.min(7, Math.floor(points / 50));
    const nextBadge = (Math.floor(points / 50) + 1) * 50;
    const progress = (points % 50) / 50;
    
    // Calculate today's stats
    const today = new Date().toDateString();
    const todayEntries = entries.filter(e => new Date(e.time).toDateString() === today);
    const totalCalories = todayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
    const totalProtein = todayEntries.reduce((sum, e) => sum + (e.protein || 0), 0);
    
    // Calculate weekly stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekEntries = entries.filter(e => new Date(e.time) > weekAgo);
    const weeklyAvgCalories = weekEntries.length > 0 ? Math.round(weekEntries.reduce((sum, e) => sum + (e.calories || 0), 0) / 7) : 0;
    
    // Most common eating hour
    const hourCounts: { [key: number]: number } = {};
    entries.forEach(e => {
      const hour = new Date(e.time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostCommonHour = Object.keys(hourCounts).length > 0
      ? parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0])
      : 12;
    
    // Calculate current streak (consecutive days with entries)
    let currentStreak = 0;
    let checkDate = new Date();
    let iterations = 0;
    while (iterations < 365) { // Safety limit
      const hasEntry = entries.some(e => 
        new Date(e.time).toDateString() === checkDate.toDateString()
      );
      if (!hasEntry && currentStreak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        iterations++;
        continue;
      }
      if (!hasEntry) break;
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      iterations++;
    }
    
    // Find longest streak ever (optimized)
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = [...new Set(entries.map(e => new Date(e.time).toDateString()))].sort();
    for (let i = 0; i < sortedDates.length && i < 365; i++) { // Limit iterations
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return {
      streak,
      progress,
      todayEntries,
      totalCalories,
      totalProtein,
      weekEntries,
      weeklyAvgCalories,
      mostCommonHour,
      currentStreak,
      longestStreak,
    };
  }, [entries, points]);
  
  // Memoize chart data to prevent recalculation
  const weeklyCalorieData = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayEntries = entries.filter(e => 
        new Date(e.time).toDateString() === date.toDateString()
      );
      const calories = dayEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
      return {
        label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        value: calories,
      };
    });
  }, [entries]);
  
  const mealFrequencyData = useMemo(() => {
    return [6, 9, 12, 15, 18, 21].map(hour => {
      const count = entries.filter(e => {
        const entryHour = new Date(e.time).getHours();
        return entryHour >= hour && entryHour < hour + 3;
      }).length;
      return {
        label: `${hour}:00`,
        value: count,
      };
    });
  }, [entries]);
  
  // Destructure stats
  const {
    streak,
    progress,
    todayEntries,
    totalCalories,
    totalProtein,
    weekEntries,
    weeklyAvgCalories,
    mostCommonHour,
    currentStreak,
    longestStreak,
  } = stats;
  
  // Dynamic theme based on user preference
  const paperTheme = useMemo(() => {
    const baseTheme = theme === 'dark' ? MD3DarkTheme : MD3LightTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: accentColor,
        background: colors.background,
        surface: colors.surface,
        surfaceVariant: colors.surfaceVariant,
      },
    };
  }, [theme, accentColor, colors]);
  
  return (
    <>
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.statusBarSpacer} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, maxWidth: '75%' }}>
                <Text style={[styles.title, { fontSize: getFontSize(28), color: colors.text }]}>📊 Your Stats</Text>
                <Text style={[styles.screenDescription, { fontSize: getFontSize(14), color: colors.textSecondary }]}>
                  Track your progress and see how you're doing. Every meal counts!
                </Text>
              </View>
              <View style={{ width: 80 }} />
            </View>
            
            <AnimatedCard style={styles.card} delay={0} colors={colors}>
              <Card.Content>
                <View style={[styles.pointsDisplay, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.bigPoints, { fontSize: getFontSize(56), color: accentColor }]}>{points}</Text>
                  <Text style={[styles.pointsLabel, { fontSize: getFontSize(16), color: colors.textSecondary }]}>Total Points</Text>
                </View>
                
                <View style={styles.badgesSection}>
                  <Text style={[styles.badgesSectionTitle, { color: colors.text }]}>🏆 Achievements</Text>
                  <View style={styles.badgesGrid}>
                    {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                      <View key={level} style={[styles.badgeItem, { backgroundColor: colors.surfaceVariant }, level <= streak && styles.badgeItemEarned]}>
                        <Text style={styles.badgeEmoji}>
                          {level <= streak ? '🏆' : '⭐'}
                        </Text>
                        <Text style={[styles.badgeLevel, { color: colors.textSecondary }, level <= streak && styles.badgeLevelEarned]}>
                          {level}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                
                <View style={styles.progressSection}>
                  <Text style={[styles.hint, { fontSize: getFontSize(13), color: colors.textSecondary }]}>Progress to next badge</Text>
                  <ProgressBar progress={progress} color={accentColor} style={styles.progressBar} />
                  <Text style={[styles.hint, { fontSize: getFontSize(13), color: colors.textSecondary }]}>{points % 50} / 50 points</Text>
                </View>
              </Card.Content>
            </AnimatedCard>
            
            <View style={styles.statsRow}>
              <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Card.Content>
                  <Text style={styles.statEmoji}>🍽️</Text>
                  <Text style={[styles.statValue, { fontSize: getFontSize(32), color: colors.text }]}>{todayEntries.length}</Text>
                  <Text style={[styles.statLabel, { fontSize: getFontSize(12), color: colors.textSecondary }]}>Today</Text>
                </Card.Content>
              </Card>
              
              <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Card.Content>
                  <Text style={styles.statEmoji}>🔥</Text>
                  <Text style={[styles.statValue, { fontSize: getFontSize(32), color: colors.text }]}>{Math.round(totalCalories)}</Text>
                  <Text style={[styles.statLabel, { fontSize: getFontSize(12), color: colors.textSecondary }]}>kcal Today</Text>
                </Card.Content>
              </Card>
              
              <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Card.Content>
                  <Text style={styles.statEmoji}>💪</Text>
                  <Text style={[styles.statValue, { fontSize: getFontSize(32), color: colors.text }]}>{Math.round(totalProtein)}g</Text>
                  <Text style={[styles.statLabel, { fontSize: getFontSize(12), color: colors.textSecondary }]}>Protein</Text>
                </Card.Content>
              </Card>
            </View>

            {/* Daily Calorie Budget */}
            <AnimatedCard style={styles.card} delay={50} colors={colors}>
              <Card.Content>
                {(() => {
                  const percentage = Math.min(100, (totalCalories / dailyCalorieGoal) * 100);
                  const remaining = Math.max(0, dailyCalorieGoal - totalCalories);
                  
                  const budgetColor = percentage < 70 ? '#069420' : 
                                      percentage < 90 ? accentColor : 
                                      percentage < 100 ? '#fbbf24' : '#b00b69';

                  return (
                    <>
                      <View style={styles.budgetHeader}>
                        <Text style={[styles.budgetLabel, { fontSize: getFontSize(14), color: colors.text }]}>
                          🎯 Daily Budget
                        </Text>
                        <Text style={[styles.budgetPercentage, { fontSize: getFontSize(14), color: budgetColor }]}>
                          {Math.round(percentage)}%
                        </Text>
                      </View>
                      
                      <View style={styles.budgetMain}>
                        <Text style={[styles.budgetCalories, { fontSize: getFontSize(42), color: budgetColor }]}>
                          {Math.round(totalCalories)}
                        </Text>
                        <Text style={[styles.budgetGoal, { fontSize: getFontSize(18), color: colors.textSecondary }]}>
                          / {dailyCalorieGoal} kcal
                        </Text>
                      </View>

                      <ProgressBar progress={percentage / 100} color={budgetColor} style={styles.budgetProgressBar} />

                      <Text style={[styles.budgetRemaining, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                        {percentage < 100 
                          ? `🔥 ${Math.round(remaining)} kcal remaining` 
                          : `⚠️ ${Math.round(totalCalories - dailyCalorieGoal)} kcal over budget`
                        }
                      </Text>
                    </>
                  );
                })()}
              </Card.Content>
            </AnimatedCard>

            {/* Streak Stats */}
            <View style={styles.statsRow}>
              <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Card.Content>
                  <Text style={styles.statEmoji}>🔥</Text>
                  <Text style={[styles.statValue, { fontSize: getFontSize(32), color: colors.text }]}>{currentStreak}</Text>
                  <Text style={[styles.statLabel, { fontSize: getFontSize(12), color: colors.textSecondary }]}>Day Streak</Text>
                </Card.Content>
              </Card>
              
              <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Card.Content>
                  <Text style={styles.statEmoji}>🏆</Text>
                  <Text style={[styles.statValue, { fontSize: getFontSize(32), color: colors.text }]}>{longestStreak}</Text>
                  <Text style={[styles.statLabel, { fontSize: getFontSize(12), color: colors.textSecondary }]}>Best Streak</Text>
                </Card.Content>
              </Card>
              
              <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Card.Content>
                  <Text style={styles.statEmoji}>📊</Text>
                  <Text style={[styles.statValue, { fontSize: getFontSize(32), color: colors.text }]}>{weekEntries.length}</Text>
                  <Text style={[styles.statLabel, { fontSize: getFontSize(12), color: colors.textSecondary }]}>This Week</Text>
                </Card.Content>
              </Card>
            </View>

            {/* Timing Insights */}
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
              <Card.Title title="⏰ Eating Patterns" titleStyle={[styles.cardTitle, { fontSize: getFontSize(18), color: colors.text }]} />
              <Card.Content>
                <View style={styles.insightRow}>
                  <View style={styles.insightItem}>
                    <Text style={[styles.insightLabel, { fontSize: getFontSize(13), color: colors.textSecondary }]}>Most Active Hour</Text>
                    <Text style={[styles.insightValue, { fontSize: getFontSize(24), color: accentColor }]}>
                      {mostCommonHour > 12 ? `${mostCommonHour - 12}PM` : mostCommonHour === 12 ? '12PM' : `${mostCommonHour}AM`}
                    </Text>
                  </View>
                  <View style={[styles.insightDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.insightItem}>
                    <Text style={[styles.insightLabel, { fontSize: getFontSize(13), color: colors.textSecondary }]}>Daily Avg Cal</Text>
                    <Text style={[styles.insightValue, { fontSize: getFontSize(24), color: accentColor }]}>
                      {weeklyAvgCalories}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Title title="📅 Recent Activity" titleStyle={[styles.cardTitle, { color: colors.text }]} />
            <Card.Content>
              <View style={styles.calendarRow}>
                {[...Array(7)].map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  const hasEntry = entries.some(e => 
                    new Date(e.time).toDateString() === date.toDateString()
                  );
                  return (
                    <View key={i} style={styles.dayBox}>
                      <Text style={[styles.dayLabel, { fontSize: getFontSize(13), color: colors.textSecondary }]}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]}</Text>
                      <View style={[styles.dayDot, { backgroundColor: colors.border }, hasEntry && { ...styles.dayDotActive, backgroundColor: accentColor }]} />
                    </View>
                  );
                })}
              </View>
            </Card.Content>
          </Card>

          {/* Weekly Calorie Trend Chart */}
          <AnimatedCard style={styles.card} delay={100} colors={colors}>
            <Card.Title title="📈 Weekly Calorie Trend" titleStyle={[styles.cardTitle, { color: colors.text }]} />
            <Card.Content>
              <BarChart
                data={weeklyCalorieData}
                accentColor={accentColor}
                height={180}
                fontSize={getFontSize(11)}
                theme={theme}
              />
              <Text style={[styles.chartNote, { fontSize: getFontSize(12), color: colors.textSecondary }]}>
                📊 Your daily calorie intake over the past week
              </Text>
            </Card.Content>
          </AnimatedCard>

          {/* Meal Frequency Chart */}
          <AnimatedCard style={styles.card} delay={200} colors={colors}>
            <Card.Title title="🍽️ Meal Frequency by Hour" titleStyle={[styles.cardTitle, { color: colors.text }]} />
            <Card.Content>
              <BarChart
                data={mealFrequencyData}
                accentColor={accentColor}
                height={160}
                fontSize={getFontSize(10)}
                theme={theme}
              />
              <Text style={[styles.chartNote, { fontSize: getFontSize(12), color: colors.textSecondary }]}>
                🕐 When you eat most throughout the day
              </Text>
            </Card.Content>
          </AnimatedCard>

          <Card style={[styles.funCard, { borderLeftColor: accentColor, backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.funText, { color: colors.text }]}>
                {points >= 350 ? "🏆 You're a meal tracking champion!" :
                 points >= 200 ? "🌟 Amazing consistency!" :
                 points >= 100 ? "🎉 You're on fire!" :
                 points >= 50 ? "💪 Keep it up!" :
                 "🚀 Start your tracking journey!"}
              </Text>
            </Card.Content>
          </Card>
          </ScrollView>
        </Animated.View>
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
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12, letterSpacing: -0.5 },
  screenDescription: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  card: { marginBottom: 16, borderRadius: 12, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  pointsDisplay: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  bigPoints: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 4,
  },
  statEmoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: '700' },
  badge: { fontSize: 20 },
  progressSection: { marginTop: 8 },
  progressBar: { marginVertical: 8, height: 8, borderRadius: 4 },
  hint: { fontSize: 12 },
  badgesSection: {
    marginTop: 0,
  },
  badgesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  badgesGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  badgeItem: {
    width: 45,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeItemEarned: {
    backgroundColor: '#2a1a3a',
    borderColor: '#4ade80',
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeLevel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  badgeLevelEarned: {
    color: '#4ade80',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 4,
  },
  dayBox: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dayDotActive: {
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightLabel: {
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  insightValue: {
    fontWeight: '800',
    textAlign: 'center',
  },
  insightDivider: {
    width: 1,
    height: 40,
  },
  funCard: { borderLeftWidth: 4, borderRadius: 12, elevation: 4 },
  funText: { fontSize: 16, textAlign: 'center', fontWeight: '600', lineHeight: 24 },
  chartNote: { fontSize: 12, fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  budgetPercentage: {
    fontWeight: '900',
    fontSize: 16,
  },
  budgetMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  budgetCalories: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  budgetGoal: {
    fontWeight: '600',
  },
  budgetProgressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 12,
  },
  budgetRemaining: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
