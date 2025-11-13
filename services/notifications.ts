import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface NotificationSettings {
  enabled: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  streakReminders: boolean;
  questReminders: boolean;
  challengeReminders: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "08:00"
  frequency: 'low' | 'medium' | 'high';
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  mealReminders: true,
  waterReminders: true,
  streakReminders: true,
  questReminders: true,
  challengeReminders: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  frequency: 'medium',
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const saved = await AsyncStorage.getItem('humngry.notificationSettings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
    return DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  try {
    await AsyncStorage.setItem('humngry.notificationSettings', JSON.stringify(settings));
  } catch (e) {
    console.log('Error saving notification settings', e);
  }
}

function isQuietHours(settings: NotificationSettings): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = settings.quietHoursStart.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;

  const [endHour, endMinute] = settings.quietHoursEnd.split(':').map(Number);
  const endTime = endHour * 60 + endMinute;

  // Handle overnight quiet hours
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }
  return currentTime >= startTime && currentTime < endTime;
}

export async function initNotifications() {
  // Skip notifications on web - expo-notifications has localStorage issues on web
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return;
  }
  
  // Dynamic import to avoid loading expo-notifications on web
  const Notifications = await import('expo-notifications');
  const Device = await import('expo-device');
  
  try {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Notifications permission not granted');
      }
    }
    // Set notification handler for foreground notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.log('initNotifications error', e);
  }
}

export async function scheduleMealNotification({ when, title, body }: { when: Date; title: string; body: string }) {
  // Skip on web
  if (Platform.OS === 'web') {
    console.log('Notification scheduled (web placeholder):', { when, title });
    return;
  }

  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.mealReminders) {
    return;
  }

  // Check if it's during quiet hours
  if (isQuietHours(settings)) {
    console.log('Skipping notification during quiet hours');
    return;
  }
  
  // Dynamic import
  const Notifications = await import('expo-notifications');
  
  try {
    const trigger = when.getTime() - Date.now();
    if (trigger <= 0) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' as any },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.floor(trigger / 1000)), repeats: false },
    });
  } catch (e) {
    console.log('scheduleMealNotification error', e);
  }
}

export async function scheduleSmartNotifications() {
  if (Platform.OS === 'web') return;

  const settings = await getNotificationSettings();
  if (!settings.enabled) return;

  const Notifications = await import('expo-notifications');
  
  try {
    // Cancel all existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const lastLoggedStr = await AsyncStorage.getItem('humngry.lastMealLogged');
    const lastLogged = lastLoggedStr ? new Date(lastLoggedStr) : null;

    // Frequency settings
    const intervals = {
      low: { water: 4 * 60 * 60 * 1000, quest: 24 * 60 * 60 * 1000, streak: 24 * 60 * 60 * 1000 },
      medium: { water: 2 * 60 * 60 * 1000, quest: 12 * 60 * 60 * 1000, streak: 24 * 60 * 60 * 1000 },
      high: { water: 1 * 60 * 60 * 1000, quest: 6 * 60 * 60 * 1000, streak: 12 * 60 * 60 * 1000 },
    };

    const freq = intervals[settings.frequency];

    // Water reminders
    if (settings.waterReminders) {
      const waterTime = new Date(now.getTime() + freq.water);
      if (!isQuietHours(settings)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Hydration Check',
            body: 'Time to drink some water! Stay hydrated throughout the day.',
            sound: 'default' as any,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.floor(freq.water / 1000),
            repeats: true,
          },
        });
      }
    }

    // Quest reminders
    if (settings.questReminders) {
      const questTime = new Date(now.getTime() + freq.quest);
      if (!isQuietHours(settings)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎮 Daily Quest Check',
            body: "Don't forget to complete your daily quests and earn points!",
            sound: 'default' as any,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.floor(freq.quest / 1000),
            repeats: true,
          },
        });
      }
    }

    // Streak reminders (only if they haven't logged today)
    if (settings.streakReminders && lastLogged) {
      const today = now.toDateString();
      const lastLoggedDay = lastLogged.toDateString();
      
      if (today !== lastLoggedDay) {
        // Send reminder at 8 PM if they haven't logged today
        const reminderTime = new Date(now);
        reminderTime.setHours(20, 0, 0, 0);
        
        if (reminderTime.getTime() > now.getTime() && !isQuietHours(settings)) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🔥 Keep Your Streak!',
              body: "Don't forget to log your meals today to maintain your streak!",
              sound: 'default' as any,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminderTime,
            },
          });
        }
      }
    }
    
    // Challenge reminders (morning motivation)
    if (settings.challengeReminders && !isQuietHours(settings)) {
      const morningTime = new Date(now);
      morningTime.setHours(9, 0, 0, 0);
      
      if (morningTime.getTime() > now.getTime()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⚔️ Daily Challenge',
            body: "Check out today's challenges and earn XP!",
            sound: 'default' as any,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: morningTime,
          },
        });
      }
    }
  } catch (e) {
    console.log('Error scheduling smart notifications', e);
  }
}

export async function scheduleChallengeCompleteNotification(challengeName: string, xpEarned: number) {
  if (Platform.OS === 'web') return;
  
  try {
    const Notifications = await import('expo-notifications');
    const settings = await getNotificationSettings();
    
    if (!settings.enabled || !settings.challengeReminders || isQuietHours(settings)) {
      return;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Challenge Complete!',
        body: `You completed "${challengeName}" and earned ${xpEarned} XP!`,
        sound: 'default' as any,
        data: { type: 'challenge_complete' },
      },
      trigger: null, // Send immediately
    });
  } catch (e) {
    console.log('Error scheduling challenge notification', e);
  }
}

export default {
  initNotifications,
  scheduleMealNotification,
  scheduleSmartNotifications,
  scheduleChallengeCompleteNotification,
  getNotificationSettings,
  saveNotificationSettings,
};
