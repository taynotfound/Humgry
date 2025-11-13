import AppBar from '@/components/AppBar';
import { useSettings } from '@/contexts/settings-context';
import { useEntries } from '@/hooks/useEntries';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useNutritionTargets } from '@/hooks/useNutritionTargets';
import { calculateLevel, generateDailyScoreCard, getWeeklyScoreSummary, type NutritionScore } from '@/services/nutritionScoreCard';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, IconButton, MD3DarkTheme, MD3LightTheme, Modal, Provider as PaperProvider, Portal, ProgressBar, Text, TextInput } from 'react-native-paper';

export default function ScoreCardScreen() {
  const { entries } = useEntries();
  const { progress, addXP, isLoading: progressLoading } = useGameProgress();
  const { targets, updateTargets, isLoading: targetsLoading } = useNutritionTargets();
  const { theme, colors } = useSettings();
  const [selectedScore, setSelectedScore] = useState<NutritionScore | null>(null);
  const [lastXPDate, setLastXPDate] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempTargets, setTempTargets] = useState({ calories: 2000, protein: 150, fiber: 25, budget: 20 });
  
  const dailyScore = useMemo(() => 
    generateDailyScoreCard(entries, targets),
    [entries, targets]
  );
  
  const weeklySummary = useMemo(() => 
    getWeeklyScoreSummary(entries, targets),
    [entries, targets]
  );
  
  const levelInfo = calculateLevel(progress.totalXP);
  
  // Sync temp targets when targets change
  useEffect(() => {
    setTempTargets(targets);
  }, [targets]);
  
  // Auto-award XP when score changes (once per day)
  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyScore.xpEarned > 0 && lastXPDate !== today) {
      addXP(dailyScore.xpEarned);
      setLastXPDate(today);
    }
  }, [dailyScore.xpEarned]);
  
  const paperTheme = theme === 'dark' 
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...colors } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...colors } };
  
  if (progressLoading || targetsLoading) {
    return (
      <PaperProvider theme={paperTheme}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" />
        </View>
      </PaperProvider>
    );
  }
  
  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header with Settings */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={[styles.headerTitle, { color: colors.text }]}>🏆 Score Card</Text>
            <IconButton
              icon="cog"
              size={24}
              onPress={() => setShowSettings(true)}
              iconColor={colors.text}
            />
          </View>
      
          {/* Level Card */}
          <Card style={[styles.levelCard, { backgroundColor: colors.surface }]} mode="elevated">
        <Card.Content>
          <View style={styles.levelHeader}>
            <View>
              <Text variant="headlineSmall" style={styles.levelText}>
                Level {levelInfo.level}
              </Text>
              <Text variant="bodyMedium" style={styles.titleText}>
                {levelInfo.title}
              </Text>
            </View>
            <Text variant="displaySmall">🏆</Text>
          </View>
          
          <View style={styles.xpContainer}>
            <Text variant="bodySmall">
              {levelInfo.currentXP} / {levelInfo.xpToNextLevel} XP
            </Text>
            <ProgressBar 
              progress={levelInfo.progress / 100} 
              style={styles.xpBar}
              color="#FFD700"
            />
          </View>
          
          {levelInfo.level >= 5 && (
            <Button
              mode="text"
              icon="share-variant"
              onPress={async () => {
                const { shareLevelUp } = await import('@/services/sharing');
                await shareLevelUp(levelInfo.level, levelInfo.title);
              }}
              compact
              style={{ marginTop: 8 }}
            >
              Share Level
            </Button>
          )}
        </Card.Content>
      </Card>
      
      {/* Today's Score */}
      <Card style={[styles.scoreCard, { backgroundColor: colors.surface }]} mode="elevated">
        <Card.Content>
          <View style={styles.todayHeader}>
            <Text variant="titleLarge" style={{ color: colors.text }}>Today's Score</Text>
            <View style={[styles.gradeCircle, { backgroundColor: colors.surfaceVariant }]}>
              <Text variant="headlineLarge" style={[styles.gradeText, { color: dailyScore.scores[0].color }]}>
                {dailyScore.overallGrade}
              </Text>
            </View>
          </View>
          
          <Text variant="headlineSmall" style={[styles.scoreNumber, { color: colors.text }]}>
            {dailyScore.overallScore}/100
          </Text>
          
          <View style={styles.xpEarned}>
            <Text variant="titleMedium" style={styles.xpText}>
              +{dailyScore.xpEarned} XP earned today
            </Text>
          </View>
          
          {dailyScore.overallScore >= 95 && (
            <Button
              mode="contained-tonal"
              icon="share-variant"
              onPress={async () => {
                const { sharePerfectDay } = await import('@/services/sharing');
                await sharePerfectDay(dailyScore.overallScore);
              }}
              style={{ marginTop: 12 }}
            >
              Share Perfect Day
            </Button>
          )}
        </Card.Content>
      </Card>
      
      {/* Nutrition Scores */}
      <View style={styles.scoresGrid}>
        {dailyScore.scores.map((score, index) => (
          <Card 
            key={score.category}
            style={[styles.categoryCard, { backgroundColor: colors.surface }]}
            mode="elevated"
            onPress={() => setSelectedScore(score)}
          >
            <Card.Content>
              <View style={styles.categoryHeader}>
                <Text variant="displaySmall">{score.emoji}</Text>
                <View style={[styles.gradeBadge, { backgroundColor: score.color }]}>
                  <Text style={styles.gradeBadgeText}>{score.grade}</Text>
                </View>
              </View>
              
              <Text variant="titleMedium" style={[styles.categoryTitle, { color: colors.text }]}>
                {score.category}
              </Text>
              
              <Text variant="bodyLarge" style={[styles.categoryValue, { color: colors.text }]}>
                {score.current} / {score.target}{' '}
                {score.category === 'Budget' ? '$' : score.category === 'Protein' || score.category === 'Fiber' ? 'g' : 'cal'}
              </Text>
              
              <ProgressBar 
                progress={score.percentage / 100} 
                style={styles.progressBar}
                color={score.color}
              />
              
              <View style={styles.trendRow}>
                <Text variant="bodySmall">{score.percentage}%</Text>
                <Text variant="bodySmall">
                  {score.trend === 'up' ? '📈' : score.trend === 'down' ? '📉' : '➡️'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
      
      {/* Achievements */}
      {dailyScore.achievements.length > 0 && (
        <Card style={[styles.achievementsCard, { backgroundColor: colors.surface }]} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              🎉 Today's Achievements
            </Text>
            <View style={styles.achievementsRow}>
              {dailyScore.achievements.map((achievement, i) => (
                <Chip key={i} style={[styles.achievementChip, { backgroundColor: colors.surfaceVariant }]}>
                  {achievement}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}
      
      {/* Streaks */}
      {dailyScore.streaks.length > 0 && (
        <Card style={[styles.streaksCard, { backgroundColor: colors.surface }]} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              🔥 Active Streaks
            </Text>
            {dailyScore.streaks.map((streak, i) => (
              <View key={i} style={styles.streakRow}>
                <Text variant="bodyLarge">{streak.emoji}</Text>
                <Text variant="bodyMedium" style={[styles.streakName, { color: colors.text }]}>
                  {streak.name}
                </Text>
                <Text variant="titleMedium" style={[styles.streakCount, { color: colors.text }]}>
                  {streak.count} days
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
      
      {/* Weekly Summary */}
      <Card style={[styles.weeklyCard, { backgroundColor: colors.surface }]} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
            📊 This Week
          </Text>
          
          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStat}>
              <Text variant="headlineMedium" style={{ color: colors.text }}>{weeklySummary.weekAverage}</Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Average Score</Text>
            </View>
            
            <View style={styles.weeklyStat}>
              <Text variant="headlineMedium" style={{ color: colors.text }}>{weeklySummary.totalXP}</Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Total XP</Text>
            </View>
            
            <View style={styles.weeklyStat}>
              <Text variant="headlineMedium" style={{ color: weeklySummary.improvement >= 0 ? '#4CAF50' : '#F44336' }}>
                {weeklySummary.improvement > 0 ? '+' : ''}{weeklySummary.improvement}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Improvement</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Score Detail Modal */}
      <Portal>
        <Modal 
          visible={selectedScore !== null} 
          onDismiss={() => setSelectedScore(null)}
          contentContainerStyle={styles.modal}
        >
          {selectedScore && (
            <Card>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <Text variant="displaySmall">{selectedScore.emoji}</Text>
                  <IconButton icon="close" onPress={() => setSelectedScore(null)} />
                </View>
                
                <Text variant="headlineSmall">{selectedScore.category}</Text>
                
                <View style={styles.modalGrade}>
                  <View style={[styles.gradeBadge, { backgroundColor: selectedScore.color }]}>
                    <Text style={styles.gradeBadgeText}>{selectedScore.grade}</Text>
                  </View>
                  <Text variant="titleLarge" style={styles.modalScore}>
                    {selectedScore.percentage}%
                  </Text>
                </View>
                
                <Text variant="bodyLarge" style={styles.modalCurrent}>
                  {selectedScore.current} / {selectedScore.target}{' '}
                  {selectedScore.category === 'Budget' ? '$' : 
                   selectedScore.category === 'Protein' || selectedScore.category === 'Fiber' ? 'g' : 'cal'}
                </Text>
                
                <ProgressBar 
                  progress={selectedScore.percentage / 100} 
                  style={styles.modalProgressBar}
                  color={selectedScore.color}
                />
                
                <Text variant="bodyMedium" style={styles.modalMessage}>
                  {selectedScore.message}
                </Text>
                
                <Button 
                  mode="contained" 
                  onPress={() => setSelectedScore(null)}
                  style={styles.modalButton}
                >
                  Got it!
                </Button>
              </Card.Content>
            </Card>
          )}
        </Modal>
        
        {/* Settings Modal */}
        <Modal 
          visible={showSettings} 
          onDismiss={() => setShowSettings(false)}
          contentContainerStyle={styles.modal}
        >
          <Card>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Text variant="headlineSmall">⚙️ Nutrition Targets</Text>
                <IconButton icon="close" onPress={() => setShowSettings(false)} />
              </View>
              
              <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                Set your daily nutrition goals. Your Score Card will track your progress against these targets.
              </Text>
              
              <View style={{ gap: 12 }}>
                <View>
                  <Text variant="labelLarge" style={{ marginBottom: 4, color: colors.text }}>🔥 Calories (kcal)</Text>
                  <TextInput
                    mode="outlined"
                    value={tempTargets.calories.toString()}
                    onChangeText={(text) => setTempTargets({ ...tempTargets, calories: parseInt(text) || 2000 })}
                    keyboardType="number-pad"
                    style={{ backgroundColor: colors.surface }}
                  />
                </View>
                
                <View>
                  <Text variant="labelLarge" style={{ marginBottom: 4, color: colors.text }}>💪 Protein (g)</Text>
                  <TextInput
                    mode="outlined"
                    value={tempTargets.protein.toString()}
                    onChangeText={(text) => setTempTargets({ ...tempTargets, protein: parseInt(text) || 150 })}
                    keyboardType="number-pad"
                    style={{ backgroundColor: colors.surface }}
                  />
                </View>
                
                <View>
                  <Text variant="labelLarge" style={{ marginBottom: 4, color: colors.text }}>🥗 Fiber (g)</Text>
                  <TextInput
                    mode="outlined"
                    value={tempTargets.fiber.toString()}
                    onChangeText={(text) => setTempTargets({ ...tempTargets, fiber: parseInt(text) || 25 })}
                    keyboardType="number-pad"
                    style={{ backgroundColor: colors.surface }}
                  />
                </View>
                
                <View>
                  <Text variant="labelLarge" style={{ marginBottom: 4, color: colors.text }}>💰 Daily Budget ($)</Text>
                  <TextInput
                    mode="outlined"
                    value={tempTargets.budget.toString()}
                    onChangeText={(text) => setTempTargets({ ...tempTargets, budget: parseInt(text) || 20 })}
                    keyboardType="number-pad"
                    style={{ backgroundColor: colors.surface }}
                  />
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setTempTargets(targets);
                    setShowSettings(false);
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => {
                    updateTargets(tempTargets);
                    setShowSettings(false);
                  }}
                  style={{ flex: 1 }}
                >
                  Save
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
        </ScrollView>
      </SafeAreaView>
      <AppBar />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingTop: 122,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  levelCard: {
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelText: {
    fontWeight: 'bold',
  },
  titleText: {
    color: '#666',
    marginTop: 4,
  },
  xpContainer: {
    marginTop: 8,
  },
  xpBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  scoreCard: {
    marginBottom: 16,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    fontWeight: 'bold',
  },
  scoreNumber: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  xpEarned: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  xpText: {
    color: '#856404',
    textAlign: 'center',
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    width: '48%',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gradeBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  categoryTitle: {
    marginBottom: 4,
  },
  categoryValue: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  achievementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementChip: {
    backgroundColor: '#E8F5E9',
    height: 32,
    paddingVertical: 4,
  },
  streaksCard: {
    marginBottom: 16,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  streakName: {
    flex: 1,
  },
  streakCount: {
    fontWeight: 'bold',
  },
  weeklyCard: {
    marginBottom: 16,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyStat: {
    alignItems: 'center',
  },
  modal: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalGrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  modalScore: {
    fontWeight: 'bold',
  },
  modalCurrent: {
    marginTop: 16,
    marginBottom: 12,
  },
  modalProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  modalMessage: {
    marginBottom: 20,
    color: '#666',
  },
  modalButton: {
    marginTop: 16,
    minHeight: 48,
  },
});
