import AppBar from '@/components/AppBar';
import AppFooter from '@/components/AppFooter';
import { useSettings } from '@/contexts/settings-context';
import { useEntries } from '@/hooks/useEntries';
import { useGameProgress } from '@/hooks/useGameProgress';
import {
  getChallengesWithProgress,
  getRecommendedChallenges,
  getUserChallengeStats,
  type Challenge,
  type ChallengeProgress
} from '@/services/socialChallenges';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, IconButton, MD3DarkTheme, MD3LightTheme, Modal, Provider as PaperProvider, Portal, ProgressBar, SegmentedButtons, Text } from 'react-native-paper';

type ChallengeWithProgress = Challenge & ChallengeProgress;

export default function ChallengesScreen() {
  const { entries } = useEntries();
  const { progress, completeChallenge, isLoading } = useGameProgress();
  const { theme, colors } = useSettings();
  const [filter, setFilter] = useState('all');
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeWithProgress | null>(null);
  const [hasCheckedCompletion, setHasCheckedCompletion] = useState(false);
  
  const challengesWithProgress = useMemo(() => 
    getChallengesWithProgress(entries),
    [entries]
  );
  
  const userStats = useMemo(() => 
    getUserChallengeStats(entries, progress.completedChallenges, progress.totalXP),
    [entries, progress.completedChallenges, progress.totalXP]
  );
  
  const recommended = useMemo(() => 
    getRecommendedChallenges(entries),
    [entries]
  );
  
  const filteredChallenges = useMemo(() => {
    switch (filter) {
      case 'active':
        return challengesWithProgress.filter(c => c.percentage > 0 && !c.completed);
      case 'completed':
        return challengesWithProgress.filter(c => c.completed);
      case 'daily':
        return challengesWithProgress.filter(c => c.type === 'daily');
      case 'weekly':
        return challengesWithProgress.filter(c => c.type === 'weekly');
      default:
        return challengesWithProgress;
    }
  }, [challengesWithProgress, filter]);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };
  
  const paperTheme = theme === 'dark' 
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...colors } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...colors } };
  
  // Auto-complete challenges (only check once per load)
  useEffect(() => {
    if (hasCheckedCompletion || isLoading) return;
    
    const checkCompletions = async () => {
      for (const challenge of challengesWithProgress) {
        if (challenge.completed && !progress.completedChallenges.includes(challenge.id)) {
          await completeChallenge(challenge.id, challenge.xpReward);
          
          // Send notification
          try {
            const { scheduleChallengeCompleteNotification } = await import('@/services/notifications');
            await scheduleChallengeCompleteNotification(challenge.title, challenge.xpReward);
          } catch (e) {
            console.log('Could not send notification', e);
          }
          
          // Show celebration
          Alert.alert(
            '🎉 Challenge Completed!',
            `You completed "${challenge.title}" and earned ${challenge.xpReward} XP!`,
            [{ text: 'Awesome!', style: 'default' }]
          );
        }
      }
      setHasCheckedCompletion(true);
    };
    
    checkCompletions();
  }, [challengesWithProgress, progress.completedChallenges, hasCheckedCompletion, isLoading]);
  
  if (isLoading) {
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
          {/* User Stats Card */}
          <Card style={[styles.statsCard, { backgroundColor: colors.surface }]} mode="elevated">
        <Card.Content>
          <View style={styles.statsHeader}>
            <Text variant="titleLarge" style={{ color: colors.text }}>🏅 Your Stats</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
              <Text variant="headlineMedium" style={styles.statValue}>
                {userStats.totalCompleted}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Completed</Text>
            </View>
            
            <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
              <Text variant="headlineMedium" style={styles.statValue}>
                {userStats.currentStreak}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Week Streak</Text>
            </View>
            
            <View style={[styles.statItem, { backgroundColor: colors.surfaceVariant }]}>
              <Text variant="headlineMedium" style={styles.statValue}>
                {userStats.totalXPEarned}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Total XP</Text>
            </View>
          </View>
          
          {userStats.achievements.length > 0 && (
            <View style={[styles.achievementsSection, { borderTopColor: colors.border }]}>
              <Text variant="bodyMedium" style={[styles.achievementsTitle, { color: colors.text }]}>
                Achievements
              </Text>
              <View style={styles.achievementsRow}>
                {userStats.achievements.map((achievement, i) => (
                  <Chip key={i} style={styles.achievementChip}>
                    {achievement}
                  </Chip>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
      
      {/* Recommended Challenges */}
      {recommended.length > 0 && (
        <Card style={[styles.recommendedCard, { backgroundColor: colors.surface }]} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              ⭐ Recommended for You
            </Text>
            {recommended.map((challenge) => {
              const progress = challengesWithProgress.find(c => c.id === challenge.id);
              return (
                <TouchableOpacity
                  key={challenge.id}
                  onPress={() => setSelectedChallenge(progress || null)}
                >
                  <View style={[styles.miniChallengeCard, { borderBottomColor: colors.border }]}>
                    <Text variant="titleMedium" style={{ color: colors.text }}>{challenge.emoji} {challenge.title}</Text>
                    {progress && (
                      <View style={styles.miniProgress}>
                        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{progress.percentage}%</Text>
                        <ProgressBar 
                          progress={progress.percentage / 100} 
                          style={styles.miniProgressBar}
                          color="#6200ee"
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card.Content>
        </Card>
      )}
      
      {/* Filter Buttons */}
      <SegmentedButtons
        value={filter}
        onValueChange={setFilter}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
        ]}
        style={styles.filterButtons}
      />
      
      {/* Challenges List */}
      {filteredChallenges.map((challenge) => (
        <Card 
          key={challenge.id} 
          style={[styles.challengeCard, { backgroundColor: colors.surface }]}
          mode="elevated"
          onPress={() => setSelectedChallenge(challenge)}
        >
          <Card.Content>
            <View style={styles.challengeHeader}>
              <View style={styles.challengeTitleRow}>
                <Text variant="displaySmall">{challenge.emoji}</Text>
                <View style={styles.challengeTitleContainer}>
                  <Text variant="titleMedium">{challenge.title}</Text>
                  <View style={styles.challengeMeta}>
                    <Chip 
                      compact 
                      style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}
                      textStyle={{ color: '#fff', fontSize: 10 }}
                    >
                      {challenge.difficulty.toUpperCase()}
                    </Chip>
                    <Chip compact style={styles.typeChip}>
                      {challenge.type}
                    </Chip>
                  </View>
                </View>
              </View>
              
              {challenge.completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
              )}
            </View>
            
            <Text variant="bodyMedium" style={styles.challengeDescription}>
              {challenge.description}
            </Text>
            
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text variant="bodySmall">
                  {challenge.current} / {challenge.target} {challenge.goal.unit}
                </Text>
                <Text variant="bodySmall" style={styles.xpReward}>
                  +{challenge.xpReward} XP
                </Text>
              </View>
              
              <ProgressBar 
                progress={challenge.percentage / 100} 
                style={styles.progressBar}
                color={challenge.completed ? '#4CAF50' : '#6200ee'}
              />
              
              <Text variant="bodySmall" style={[styles.participants, { color: colors.textSecondary, marginTop: 8 }]}>
                {challenge.completed ? '✅ Completed' : `${challenge.percentage}% complete`}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}
      
      {/* Challenge Detail Modal */}
      <Portal>
        <Modal 
          visible={selectedChallenge !== null} 
          onDismiss={() => setSelectedChallenge(null)}
          contentContainerStyle={styles.modal}
        >
          {selectedChallenge && (
            <Card>
              <Card.Content>
                <View style={styles.modalHeader}>
                  <Text variant="displayMedium">{selectedChallenge.emoji}</Text>
                  <IconButton icon="close" onPress={() => setSelectedChallenge(null)} />
                </View>
                
                <Text variant="headlineSmall">{selectedChallenge.title}</Text>
                
                <View style={styles.modalMeta}>
                  <Chip 
                    style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(selectedChallenge.difficulty) }]}
                    textStyle={{ color: '#fff' }}
                  >
                    {selectedChallenge.difficulty.toUpperCase()}
                  </Chip>
                  <Chip>{selectedChallenge.type}</Chip>
                  <Chip icon="star">+{selectedChallenge.xpReward} XP</Chip>
                </View>
                
                <Text variant="bodyLarge" style={styles.modalDescription}>
                  {selectedChallenge.description}
                </Text>
                
                <Card style={styles.progressCard}>
                  <Card.Content>
                    <Text variant="titleMedium">Your Progress</Text>
                    <Text variant="headlineMedium" style={styles.progressNumber}>
                      {selectedChallenge.current} / {selectedChallenge.target} {selectedChallenge.goal.unit}
                    </Text>
                    <ProgressBar 
                      progress={selectedChallenge.percentage / 100} 
                      style={styles.modalProgressBar}
                      color={selectedChallenge.completed ? '#4CAF50' : '#6200ee'}
                    />
                    <Text variant="titleLarge" style={styles.percentageText}>
                      {selectedChallenge.percentage}%
                    </Text>
                    
                    {selectedChallenge.completed && (
                      <View style={styles.completedSection}>
                        <Text variant="titleMedium" style={styles.completedMessage}>
                          🎉 Challenge Completed!
                        </Text>
                        <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                          +{selectedChallenge.xpReward} XP earned
                        </Text>
                        <Button
                          mode="contained-tonal"
                          icon="share-variant"
                          onPress={async () => {
                            const { shareChallengeComplete } = await import('@/services/sharing');
                            await shareChallengeComplete(
                              selectedChallenge.title,
                              selectedChallenge.xpReward
                            );
                          }}
                          style={{ marginTop: 12 }}
                        >
                          Share Achievement
                        </Button>
                      </View>
                    )}
                  </Card.Content>
                </Card>
                
                <Text variant="bodySmall" style={[styles.participants, { color: colors.textSecondary }]}>
                  💡 Track your personal progress and earn XP rewards
                </Text>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
        </ScrollView>
      </SafeAreaView>
      <AppBar />
      <AppFooter />
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
    paddingTop: 125,
    paddingBottom: 60,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  achievementsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  achievementsTitle: {
    marginBottom: 8,
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
  recommendedCard: {
    marginBottom: 16,
    backgroundColor: '#FFF9C4',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  miniChallengeCard: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  miniProgress: {
    marginTop: 4,
  },
  miniProgressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  filterButtons: {
    marginBottom: 16,
  },
  challengeCard: {
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  challengeTitleContainer: {
    flex: 1,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  difficultyChip: {
    height: 28,
  },
  typeChip: {
    height: 28,
    backgroundColor: '#E3F2FD',
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeDescription: {
    marginBottom: 12,
    color: '#666',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpReward: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  participants: {
    color: '#666',
  },
  modal: {
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  modalDescription: {
    marginBottom: 16,
    color: '#666',
  },
  progressCard: {
    backgroundColor: '#f5f5f5',
    marginBottom: 16,
  },
  progressNumber: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  modalProgressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 12,
  },
  percentageText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#6200ee',
  },
  completedSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    alignItems: 'center',
  },
  completedMessage: {
    color: '#4CAF50',
    marginBottom: 4,
  },
});
