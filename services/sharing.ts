import { Share } from 'react-native';

/**
 * Share achievement to social media
 */
export async function shareAchievement(
  title: string,
  description: string,
  emoji: string = '🎉'
): Promise<void> {
  try {
    const message = `${emoji} ${title}\n\n${description}\n\n#Humngry #HealthGoals`;
    
    const result = await Share.share({
      message,
      title: `${emoji} ${title}`,
    });
    
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log('Shared with activity type:', result.activityType);
      } else {
        console.log('Shared successfully');
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing:', error);
  }
}

/**
 * Share level up milestone
 */
export async function shareLevelUp(level: number, title: string): Promise<void> {
  await shareAchievement(
    `Level ${level} Unlocked!`,
    `I just reached Level ${level} (${title}) in Humngry! 🎮`,
    '🆙'
  );
}

/**
 * Share challenge completion
 */
export async function shareChallengeComplete(
  challengeName: string,
  xpEarned: number
): Promise<void> {
  await shareAchievement(
    'Challenge Completed!',
    `I just completed "${challengeName}" and earned ${xpEarned} XP! 💪`,
    '⚔️'
  );
}

/**
 * Share perfect score day
 */
export async function sharePerfectDay(score: number): Promise<void> {
  await shareAchievement(
    'Perfect Score Day!',
    `I scored ${score}/100 on my nutrition goals today! All categories hit! 🎯`,
    '🏆'
  );
}

/**
 * Share streak milestone
 */
export async function shareStreak(days: number, streakType: string): Promise<void> {
  await shareAchievement(
    `${days}-Day Streak!`,
    `I've maintained my ${streakType} streak for ${days} consecutive days! 🔥`,
    '🔥'
  );
}

/**
 * Share weekly summary
 */
export async function shareWeeklySummary(
  avgScore: number,
  totalXP: number,
  improvement: number
): Promise<void> {
  const improvementText = improvement > 0 
    ? `📈 Improved by ${improvement} points!` 
    : improvement < 0 
      ? `Working on improvement next week!`
      : `Maintained consistent performance!`;
  
  await shareAchievement(
    'Weekly Summary',
    `This week:\n• Average Score: ${avgScore}/100\n• Total XP: ${totalXP}\n${improvementText}`,
    '📊'
  );
}

/**
 * Generate shareable text for achievements
 */
export function generateShareText(type: 'level' | 'challenge' | 'score' | 'streak', data: any): string {
  switch (type) {
    case 'level':
      return `🆙 Level ${data.level} Unlocked!\n\nI just reached Level ${data.level} (${data.title}) in Humngry! 🎮\n\n#Humngry #HealthGoals`;
    
    case 'challenge':
      return `⚔️ Challenge Completed!\n\nI just completed "${data.name}" and earned ${data.xp} XP! 💪\n\n#Humngry #FitnessChallenge`;
    
    case 'score':
      return `🏆 Perfect Score Day!\n\nI scored ${data.score}/100 on my nutrition goals today! All categories hit! 🎯\n\n#Humngry #NutritionGoals`;
    
    case 'streak':
      return `🔥 ${data.days}-Day Streak!\n\nI've maintained my ${data.type} streak for ${data.days} consecutive days!\n\n#Humngry #Consistency`;
    
    default:
      return `🎉 Achievement Unlocked in Humngry!\n\n#Humngry #HealthGoals`;
  }
}
