import AppBar from '@/components/AppBar';
import { useSettings } from '@/contexts/settings-context';
import { useEntries } from '@/hooks/useEntries';
import { getNotificationSettings, NotificationSettings, saveNotificationSettings, scheduleSmartNotifications } from '@/services/notifications';
import Constants from 'expo-constants';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Button, Card, MD3DarkTheme, Modal, Provider as PaperProvider, Portal, RadioButton, Text, TextInput } from 'react-native-paper';
import ColorPicker, { HueSlider, Panel1 } from 'reanimated-color-picker';

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

export default function SettingsScreen() {
  const { sleepStart, sleepEnd, setSleepHours, entries } = useEntries();
  const { textSize, highContrast, accentColor, theme, colors, setTextSize, setHighContrast, setAccentColor, setTheme, getFontSize, getColor, dailyCalorieGoal, setDailyCalorieGoal } = useSettings();
  const [tempSleepStart, setTempSleepStart] = useState(sleepStart);
  const [tempSleepEnd, setTempSleepEnd] = useState(sleepEnd);
  const [sleepStartModal, setSleepStartModal] = useState(false);
  const [sleepEndModal, setSleepEndModal] = useState(false);
  const [textSizeModal, setTextSizeModal] = useState(false);
  const [contrastModal, setContrastModal] = useState(false);
  const [colorModal, setColorModal] = useState(false);
  const [themeModal, setThemeModal] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: true,
    mealReminders: true,
    waterReminders: true,
    streakReminders: true,
    questReminders: true,
    challengeReminders: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    frequency: 'medium',
  });
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  async function loadNotificationSettings() {
    const settings = await getNotificationSettings();
    setNotificationSettings(settings);
  }

  async function updateNotificationSetting<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    await saveNotificationSettings(newSettings);
    await scheduleSmartNotifications();
  }

  const openWebsite = () => {
    Linking.openURL('https://taymaerz.de');
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your meal history and points? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Everything', 
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement clear all data
            Alert.alert('Success', 'All data cleared');
          }
        }
      ]
    );
  };

  async function saveSleepHours() {
    await setSleepHours(tempSleepStart, tempSleepEnd);
  }

  return (
    <>
    <PaperProvider theme={darkTheme}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusBarSpacer} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, maxWidth: '75%' }}>
              <Text style={[styles.title, { fontSize: getFontSize(28), color: colors.text }]}>⚙️ Settings</Text>
              <Text style={[styles.screenDescription, { fontSize: getFontSize(14), color: colors.textSecondary }]}>
                Adjust the app to work the way you want. All your changes are saved automatically.
              </Text>
            </View>
            <View style={{ width: 80 }} />
          </View>

          <Card style={styles.card}>
            <Card.Title title="🎨 Appearance" titleStyle={[styles.cardTitle, { fontSize: getFontSize(18) }]} />
            <Card.Content>
              <Text style={[styles.bodyText, { fontSize: getFontSize(15) }]}>
                Customize how the app looks to match your needs
              </Text>
              <Text style={[styles.helpText, { fontSize: getFontSize(13) }]}>
                These settings help make the app more comfortable to use. You can change them anytime.
              </Text>
              <View style={styles.appearanceOptions}>
                <TouchableOpacity onPress={() => setTextSizeModal(true)} activeOpacity={0.7}>
                  <View style={styles.optionRow}>
                    <View style={styles.optionLeft}>
                      <Text style={[styles.optionLabel, { fontSize: getFontSize(16), color: getColor('#fff', '#ffffff') }]}>Text Size</Text>
                      <Text style={[styles.optionDescription, { fontSize: getFontSize(13), color: getColor('#888', '#aaa') }]}>
                        {textSize === 'small' ? 'Smaller text uses less space' : textSize === 'large' ? 'Larger text is easier to read' : 'Standard text size'}
                      </Text>
                    </View>
                    <Text style={[styles.optionValue, { fontSize: getFontSize(15), color: getColor(accentColor, accentColor) }]}>{textSize === 'small' ? 'Small' : textSize === 'large' ? 'Large' : 'Normal'} →</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setContrastModal(true)} activeOpacity={0.7} style={styles.optionTouchable}>
                  <View style={styles.optionRow}>
                    <View style={styles.optionLeft}>
                      <Text style={[styles.optionLabel, { fontSize: getFontSize(16), color: getColor('#fff', '#ffffff') }]}>High Contrast</Text>
                      <Text style={[styles.optionDescription, { fontSize: getFontSize(13), color: getColor('#888', '#aaa') }]}>
                        {highContrast ? 'Colors are brighter and easier to see' : 'Colors are softer and more subtle'}
                      </Text>
                    </View>
                    <Text style={[styles.optionValue, { fontSize: getFontSize(15), color: getColor(accentColor, accentColor) }]}>{highContrast ? 'On' : 'Off'} →</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setColorModal(true)} activeOpacity={0.7} style={styles.optionTouchable}>
                  <View style={styles.optionRow}>
                    <View style={styles.optionLeft}>
                      <Text style={[styles.optionLabel, { fontSize: getFontSize(16), color: getColor('#fff', '#ffffff') }]}>Accent Color</Text>
                      <Text style={[styles.optionDescription, { fontSize: getFontSize(13), color: getColor('#888', '#aaa') }]}>
                        Choose the color used for highlights and buttons
                      </Text>
                    </View>
                    <View style={styles.colorPreview}>
                      <View style={[styles.colorDot, { backgroundColor: accentColor }]} />
                      <Text style={[styles.optionValue, { fontSize: getFontSize(15), color: getColor(accentColor, accentColor) }]}>→</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setThemeModal(true)} activeOpacity={0.7} style={styles.optionTouchable}>
                  <View style={styles.optionRow}>
                    <View style={styles.optionLeft}>
                      <Text style={[styles.optionLabel, { fontSize: getFontSize(16), color: getColor('#fff', '#ffffff') }]}>Theme</Text>
                      <Text style={[styles.optionDescription, { fontSize: getFontSize(13), color: getColor('#888', '#aaa') }]}>
                        Switch between dark and light mode
                      </Text>
                    </View>
                    <Text style={[styles.optionValue, { fontSize: getFontSize(15), color: getColor(accentColor, accentColor) }]}>
                      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'} →
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <Text style={[styles.helpText, { fontSize: getFontSize(13), marginTop: 16, marginBottom: 12 }]}>
                ⚠️ Light Mode is currently in beta. Some colors may not be optimized yet.
              </Text>
              <Text style={[styles.noteText, { fontSize: getFontSize(12) }]}>
                💡 Note: These settings are saved automatically when you change them.
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="🎯 Daily Calorie Goal" titleStyle={[styles.cardTitle, { fontSize: getFontSize(18) }]} />
            <Card.Content>
              <Text style={[styles.bodyText, { fontSize: getFontSize(15) }]}>
                Set your daily calorie budget to track your progress on the Track screen.
              </Text>
              <View style={styles.goalRow}>
                <TextInput
                  mode="outlined"
                  label="Daily Goal (kcal)"
                  value={dailyCalorieGoal.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 2000;
                    setDailyCalorieGoal(num);
                  }}
                  keyboardType="number-pad"
                  style={[styles.goalInput, { fontSize: getFontSize(16) }]}
                  outlineColor={colors.border}
                  activeOutlineColor={accentColor}
                  textColor={colors.text}
                  theme={{ colors: { ...darkTheme.colors, background: colors.surface } }}
                />
              </View>
              <Text style={[styles.helpText, { fontSize: getFontSize(13) }]}>
                💡 Typical ranges: 1500-2000 for weight loss, 2000-2500 for maintenance, 2500+ for weight gain
              </Text>
            </Card.Content>
          </Card>

          <Link href="/scorecard?settings=true" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Card style={[styles.linkCard, { borderLeftColor: accentColor }]}>
                <Card.Content>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, { fontSize: getFontSize(16), color: colors.text }]}>
                        🏆 Nutrition Score Targets
                      </Text>
                      <Text style={[styles.optionDescription, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                        Set custom goals for calories, protein, fiber, and daily budget
                      </Text>
                    </View>
                    <Text style={[styles.optionValue, { fontSize: getFontSize(15), color: accentColor }]}>→</Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          </Link>

          <Card style={styles.card}>
            <Card.Title title="🔔 Notifications" titleStyle={[styles.cardTitle, { fontSize: getFontSize(18) }]} />
            <Card.Content>
              <Text style={[styles.bodyText, { fontSize: getFontSize(15) }]}>
                Smart notifications to help you stay on track without being annoying.
              </Text>
              
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { fontSize: getFontSize(15), color: colors.text }]}>Enable Notifications</Text>
                  <Text style={[styles.settingDescription, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                    Turn all notifications on or off
                  </Text>
                </View>
                <Switch
                  value={notificationSettings.enabled}
                  onValueChange={(val) => updateNotificationSetting('enabled', val)}
                  trackColor={{ false: colors.border, true: accentColor }}
                  thumbColor={notificationSettings.enabled ? '#fff' : '#f4f3f4'}
                />
              </View>

              {notificationSettings.enabled && (
                <>
                  <View style={[styles.settingRow, { marginTop: 16 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingLabel, { fontSize: getFontSize(15), color: colors.text }]}>🍽️ Meal Reminders</Text>
                      <Text style={[styles.settingDescription, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                        Get reminded when it's time to eat
                      </Text>
                    </View>
                    <Switch
                      value={notificationSettings.mealReminders}
                      onValueChange={(val) => updateNotificationSetting('mealReminders', val)}
                      trackColor={{ false: colors.border, true: accentColor }}
                      thumbColor={notificationSettings.mealReminders ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingLabel, { fontSize: getFontSize(15), color: colors.text }]}>💧 Water Reminders</Text>
                      <Text style={[styles.settingDescription, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                        Stay hydrated throughout the day
                      </Text>
                    </View>
                    <Switch
                      value={notificationSettings.waterReminders}
                      onValueChange={(val) => updateNotificationSetting('waterReminders', val)}
                      trackColor={{ false: colors.border, true: accentColor }}
                      thumbColor={notificationSettings.waterReminders ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingLabel, { fontSize: getFontSize(15), color: colors.text }]}>🎮 Quest Reminders</Text>
                      <Text style={[styles.settingDescription, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                        Complete your daily quests
                      </Text>
                    </View>
                    <Switch
                      value={notificationSettings.questReminders}
                      onValueChange={(val) => updateNotificationSetting('questReminders', val)}
                      trackColor={{ false: colors.border, true: accentColor }}
                      thumbColor={notificationSettings.questReminders ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingLabel, { fontSize: getFontSize(15), color: colors.text }]}>🔥 Streak Reminders</Text>
                      <Text style={[styles.settingDescription, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                        Keep your daily streak alive
                      </Text>
                    </View>
                    <Switch
                      value={notificationSettings.streakReminders}
                      onValueChange={(val) => updateNotificationSetting('streakReminders', val)}
                      trackColor={{ false: colors.border, true: accentColor }}
                      thumbColor={notificationSettings.streakReminders ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingLabel, { fontSize: getFontSize(15), color: colors.text }]}>⚔️ Challenge Reminders</Text>
                      <Text style={[styles.settingDescription, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                        Get notified about active challenges
                      </Text>
                    </View>
                    <Switch
                      value={notificationSettings.challengeReminders}
                      onValueChange={(val) => updateNotificationSetting('challengeReminders', val)}
                      trackColor={{ false: colors.border, true: accentColor }}
                      thumbColor={notificationSettings.challengeReminders ? '#fff' : '#f4f3f4'}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.optionRow, { marginTop: 16 }]}
                    onPress={() => setShowNotificationModal(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      <Text style={[styles.optionLabel, { fontSize: getFontSize(16), color: colors.text }]}>Notification Frequency</Text>
                      <Text style={[styles.optionDescription, { fontSize: getFontSize(13), color: colors.textSecondary }]}>
                        {notificationSettings.frequency === 'low' ? 'Low - Fewer notifications' : 
                         notificationSettings.frequency === 'high' ? 'High - More frequent' : 
                         'Medium - Balanced'}
                      </Text>
                    </View>
                    <Text style={[styles.optionValue, { fontSize: getFontSize(15), color: accentColor }]}>
                      {notificationSettings.frequency === 'low' ? 'Low' : 
                       notificationSettings.frequency === 'high' ? 'High' : 
                       'Medium'} →
                    </Text>
                  </TouchableOpacity>

                  <View style={[styles.timeInfoBox, { backgroundColor: colors.surfaceVariant, marginTop: 16 }]}>
                    <Text style={[styles.timeInfoTitle, { fontSize: getFontSize(14), color: colors.text }]}>
                      🌙 Quiet Hours: {notificationSettings.quietHoursStart} - {notificationSettings.quietHoursEnd}
                    </Text>
                    <Text style={[styles.timeInfoText, { fontSize: getFontSize(12), color: colors.textSecondary }]}>
                      No notifications will be sent during these hours
                    </Text>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="😴 Sleep Hours" titleStyle={[styles.cardTitle, { fontSize: getFontSize(18) }]} />
            <Card.Content>
              <Text style={[styles.bodyText, { fontSize: getFontSize(15) }]}>
                Set your sleep schedule so the app won't send notifications during these hours.
              </Text>
              <Text style={[styles.helpText, { fontSize: getFontSize(13) }]}>
                Example: If you sleep from 22:00 (10 PM) to 07:00 (7 AM), tap each button below to set those times. The app will remember them.
              </Text>
              <View style={styles.timeRow}>
                <TouchableOpacity 
                  style={[styles.timeButton, { borderColor: accentColor }]} 
                  onPress={() => setSleepStartModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeEmoji}>🌙</Text>
                  <Text style={styles.timeValue}>{tempSleepStart}</Text>
                  <Text style={styles.timeSubLabel}>Sleep</Text>
                </TouchableOpacity>
                
                <View style={styles.timeArrow}>
                  <Text style={[styles.arrowText, { color: accentColor }]}>→</Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.timeButton, { borderColor: accentColor }]} 
                  onPress={() => setSleepEndModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timeEmoji}>☀️</Text>
                  <Text style={styles.timeValue}>{tempSleepEnd}</Text>
                  <Text style={styles.timeSubLabel}>Wake</Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

          <Card style={[styles.linkCard, { borderLeftColor: accentColor }]}>
            <Card.Content>
              <Link href="/about" asChild>
                <Button
                  mode="contained"
                  icon="information"
                  buttonColor={getColor(accentColor, accentColor)}
                  contentStyle={styles.linkButtonContent}
                >
                  ℹ️ About Humngry
                </Button>
              </Link>
              <Text style={[styles.linkDescription, { fontSize: getFontSize(13) }]}>
                Learn about the app, developer, and technologies used
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="💾 Your Data" titleStyle={[styles.cardTitle, { fontSize: getFontSize(18) }]} />
            <Card.Content>
              <View style={styles.dataInfo}>
                <Text style={[styles.bodyText, { fontSize: getFontSize(15) }]}>
                  • Total meals logged: {entries.length}{'\n'}
                  • All data stored locally on your device{'\n'}
                  • No cloud backup or sync
                </Text>
              </View>
              <Button
                mode="outlined"
                onPress={clearAllData}
                icon="delete"
                textColor="#ff6b6b"
                style={styles.dangerButton}
              >
                Clear All Data
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.versionCard}>
            <Card.Content>
              <Text style={[styles.versionText, { fontSize: getFontSize(14) }]}>
                Version {Constants.expoConfig?.version || '1.3.0'}
              </Text>
              <Text style={[styles.versionSubtext, { fontSize: getFontSize(12) }]}>
                Built with Expo • React Native • Material Design 3
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Text Size Modal */}
        <Portal>
          <Modal
            visible={textSizeModal}
            onDismiss={() => setTextSizeModal(false)}
            contentContainerStyle={[styles.modalContent, { borderColor: accentColor }]}
          >
            <Text style={[styles.modalTitle, { fontSize: getFontSize(22), color: accentColor }]}>📏 Choose Text Size</Text>
            <Text style={[styles.modalDescription, { fontSize: getFontSize(14) }]}>
              Select the text size that works best for you. This will change the size of text throughout the app.
            </Text>
            <RadioButton.Group onValueChange={async (value) => {
              await setTextSize(value as any);
            }} value={textSize}>
              <View style={styles.radioOption}>
                <RadioButton.Android value="small" color={accentColor} />
                <View style={styles.radioLabelContainer}>
                  <Text style={[styles.radioLabel, { fontSize: getFontSize(16) }]}>Small</Text>
                  <Text style={[styles.radioSubLabel, { fontSize: getFontSize(13) }]}>Compact and space-efficient</Text>
                </View>
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Android value="normal" color={accentColor} />
                <View style={styles.radioLabelContainer}>
                  <Text style={[styles.radioLabel, { fontSize: getFontSize(16) }]}>Normal</Text>
                  <Text style={[styles.radioSubLabel, { fontSize: getFontSize(13) }]}>Standard readability (Recommended)</Text>
                </View>
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Android value="large" color={accentColor} />
                <View style={styles.radioLabelContainer}>
                  <Text style={[styles.radioLabel, { fontSize: getFontSize(16) }]}>Large</Text>
                  <Text style={[styles.radioSubLabel, { fontSize: getFontSize(13) }]}>Easier to read</Text>
                </View>
              </View>
            </RadioButton.Group>
            <Text style={[styles.noteText, { fontSize: getFontSize(12) }]}>
              💡 Your choice is saved automatically and will apply throughout the app
            </Text>
            <Button
              mode="contained"
              onPress={() => setTextSizeModal(false)}
              buttonColor={accentColor}
              style={styles.modalButton}
              labelStyle={{ fontSize: getFontSize(15) }}
            >
              Done
            </Button>
          </Modal>
        </Portal>

        {/* High Contrast Modal */}
        <Portal>
          <Modal
            visible={contrastModal}
            onDismiss={() => setContrastModal(false)}
            contentContainerStyle={[styles.modalContent, { borderColor: accentColor }]}
          >
            <Text style={[styles.modalTitle, { fontSize: getFontSize(22), color: accentColor }]}>🎨 High Contrast Mode</Text>
            <Text style={[styles.modalDescription, { fontSize: getFontSize(14) }]}>
              High contrast mode makes colors brighter and text more visible against backgrounds.
            </Text>
            <RadioButton.Group onValueChange={async (value) => {
              await setHighContrast(value === 'true');
            }} value={highContrast.toString()}>
              <View style={styles.radioOption}>
                <RadioButton.Android value="true" color={accentColor} />
                <View style={styles.radioLabelContainer}>
                  <Text style={[styles.radioLabel, { fontSize: getFontSize(16) }]}>On</Text>
                  <Text style={[styles.radioSubLabel, { fontSize: getFontSize(13) }]}>Brighter colors, stronger contrast</Text>
                </View>
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Android value="false" color={accentColor} />
                <View style={styles.radioLabelContainer}>
                  <Text style={[styles.radioLabel, { fontSize: getFontSize(16) }]}>Off</Text>
                  <Text style={[styles.radioSubLabel, { fontSize: getFontSize(13) }]}>More subtle, easier on the eyes</Text>
                </View>
              </View>
            </RadioButton.Group>
            <Text style={[styles.noteText, { fontSize: getFontSize(12) }]}>
              💡 Your choice is saved automatically and applies throughout the app
            </Text>
            <Button
              mode="contained"
              onPress={() => setContrastModal(false)}
              buttonColor={accentColor}
              style={styles.modalButton}
              labelStyle={{ fontSize: getFontSize(15) }}
            >
              Done
            </Button>
          </Modal>
        </Portal>

        {/* Sleep Start Time Modal */}
        <Portal>
          <Modal
            visible={sleepStartModal}
            onDismiss={() => setSleepStartModal(false)}
            contentContainerStyle={styles.modalContent}
          >
            <Text style={styles.modalTitle}>🌙 Sleep Time</Text>
            <Text style={styles.modalDescription}>
              What time do you usually go to sleep? Enter the time in 24-hour format.
            </Text>
            <TextInput
              mode="outlined"
              value={tempSleepStart}
              onChangeText={setTempSleepStart}
              placeholder="22:00"
              style={styles.timeInputModal}
              outlineColor={accentColor}
              activeOutlineColor={accentColor}
              textColor="#fff"
            />
            <Text style={styles.helpText}>
              Use 24-hour format: 22:00 = 10 PM, 23:00 = 11 PM, 00:00 = midnight
            </Text>
            <Button
              mode="contained"
              onPress={async () => {
                await saveSleepHours();
                setSleepStartModal(false);
              }}
              buttonColor={getColor(accentColor, accentColor)}
              style={styles.modalButton}
            >
              Save
            </Button>
          </Modal>
        </Portal>

        {/* Sleep End Time Modal */}
        <Portal>
          <Modal
            visible={sleepEndModal}
            onDismiss={() => setSleepEndModal(false)}
            contentContainerStyle={[styles.modalContent, { borderColor: accentColor }]}
          >
            <Text style={styles.modalTitle}>☀️ Wake Time</Text>
            <Text style={styles.modalDescription}>
              What time do you usually wake up? Enter the time in 24-hour format.
            </Text>
            <TextInput
              mode="outlined"
              value={tempSleepEnd}
              onChangeText={setTempSleepEnd}
              placeholder="07:00"
              style={styles.timeInputModal}
              outlineColor={accentColor}
              activeOutlineColor={accentColor}
              textColor="#fff"
            />
            <Text style={[styles.helpText, { fontSize: getFontSize(13) }]}>
              Use 24-hour format: 07:00 = 7 AM, 08:00 = 8 AM, 09:00 = 9 AM
            </Text>
            <Button
              mode="contained"
              onPress={async () => {
                await saveSleepHours();
                setSleepEndModal(false);
              }}
              buttonColor={getColor(accentColor, accentColor)}
              style={styles.modalButton}
            >
              Save
            </Button>
          </Modal>
        </Portal>

        {/* Accent Color Picker Modal */}
        <Portal>
          <Modal
            visible={colorModal}
            onDismiss={() => setColorModal(false)}
            contentContainerStyle={[styles.modalContent, { borderColor: accentColor }]}
          >
            <Text style={[styles.modalTitle, { fontSize: getFontSize(22), color: accentColor }]}>🎨 Choose Accent Color</Text>
            <Text style={[styles.modalDescription, { fontSize: getFontSize(14) }]}>
              Select the color that will be used throughout the app for buttons, highlights, and interactive elements.
            </Text>
            <View style={styles.colorGrid}>
              {[
                { name: 'Purple', color: '#bb86fc' },
                { name: 'Crimson', color: '#690420' },
                { name: 'Magenta', color: '#b00b69' },
                { name: 'Green', color: '#069420' },
                { name: 'Brown', color: '#694200' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.color}
                  style={[
                    styles.colorOption,
                    accentColor === item.color && { ...styles.colorOptionSelected, borderColor: item.color },
                  ]}
                  onPress={async () => {
                    await setAccentColor(item.color);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorCircle, { backgroundColor: item.color }]}>
                    {accentColor === item.color && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.colorName, { fontSize: getFontSize(12) }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.modalSectionTitle, { fontSize: getFontSize(16), marginTop: 20 }]}>
              🎨 Color Wheel Picker
            </Text>
            <View style={styles.colorPickerContainer}>
              <ColorPicker
                value={accentColor}
                onComplete={(colors: { hex: string }) => setAccentColor(colors.hex)}
                style={{ width: 250 }}
              >
                <Panel1 />
                <HueSlider />
              </ColorPicker>
            </View>
            
            <Text style={[styles.modalSectionTitle, { fontSize: getFontSize(16), marginTop: 16 }]}>
              ✏️ Or Enter Hex Code
            </Text>
            <View style={styles.customColorRow}>
              <TextInput
                mode="outlined"
                label="Hex Code (e.g., #bb86fc)"
                value={accentColor}
                onChangeText={async (text) => {
                  if (text.match(/^#[0-9A-Fa-f]{6}$/)) {
                    await setAccentColor(text);
                  }
                }}
                style={[styles.customColorInput, { fontSize: getFontSize(14) }]}
                outlineColor={colors.border}
                activeOutlineColor={accentColor}
                textColor={colors.text}
                maxLength={7}
                theme={{ colors: { ...darkTheme.colors, background: colors.surface } }}
              />
              <View style={[styles.customColorPreview, { backgroundColor: accentColor, borderColor: colors.border }]} />
            </View>
            
            <Text style={[styles.noteText, { fontSize: getFontSize(12) }]}>
              💡 Your color choice is saved automatically and applies everywhere
            </Text>
            <Button
              mode="contained"
              onPress={() => setColorModal(false)}
              buttonColor={accentColor}
              style={styles.modalButton}
              labelStyle={{ fontSize: getFontSize(15) }}
            >
              Done
            </Button>
          </Modal>
        </Portal>

        {/* Theme Modal */}
        <Portal>
          <Modal
            visible={themeModal}
            onDismiss={() => setThemeModal(false)}
            contentContainerStyle={[styles.modalContent, { borderColor: accentColor }]}
          >
            <Text style={[styles.modalTitle, { fontSize: getFontSize(22), color: accentColor }]}>🎨 Choose Theme</Text>
            <Text style={[styles.modalDescription, { fontSize: getFontSize(14) }]}>
              Select whether you prefer dark mode or light mode. Dark mode is easier on the eyes in low light.
            </Text>
            <RadioButton.Group onValueChange={async (value) => await setTheme(value as 'dark' | 'light')} value={theme}>
              <View style={styles.radioOption}>
                <RadioButton.Android value="dark" color={accentColor} />
                <View style={styles.radioLabel}>
                  <Text style={[styles.radioLabelText, { fontSize: getFontSize(16) }]}>🌙 Dark Mode</Text>
                  <Text style={[styles.radioLabelDesc, { fontSize: getFontSize(13) }]}>Easier on the eyes, reduces blue light</Text>
                </View>
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Android value="light" color={accentColor} />
                <View style={styles.radioLabel}>
                  <Text style={[styles.radioLabelText, { fontSize: getFontSize(16) }]}>☀️ Light Mode</Text>
                  <Text style={[styles.radioLabelDesc, { fontSize: getFontSize(13) }]}>Better visibility in bright environments (Beta)</Text>
                </View>
              </View>
            </RadioButton.Group>
            <Text style={[styles.noteText, { fontSize: getFontSize(12), marginTop: 12 }]}>
              ⚠️ Light mode is in beta and some screens may not be fully optimized yet.
            </Text>
            <Button
              mode="contained"
              onPress={() => setThemeModal(false)}
              buttonColor={accentColor}
              style={styles.modalButton}
              labelStyle={{ fontSize: getFontSize(15) }}
            >
              Done
            </Button>
          </Modal>
        </Portal>
      </SafeAreaView>
      {/* Notification Frequency Modal */}
      <Portal>
        <Modal
          visible={showNotificationModal}
          onDismiss={() => setShowNotificationModal(false)}
          contentContainerStyle={[styles.modalContent, { borderColor: accentColor }]}
        >
          <Text style={[styles.modalTitle, { fontSize: getFontSize(22), color: accentColor }]}>
            🔔 Notification Frequency
          </Text>
          <Text style={[styles.modalDescription, { fontSize: getFontSize(14) }]}>
            Choose how often you'd like to receive notifications
          </Text>

          <RadioButton.Group 
            onValueChange={(value) => {
              updateNotificationSetting('frequency', value as 'low' | 'medium' | 'high');
              setShowNotificationModal(false);
            }} 
            value={notificationSettings.frequency}
          >
            <TouchableOpacity
              style={[
                styles.radioOption,
                { 
                  backgroundColor: notificationSettings.frequency === 'low' ? `${accentColor}20` : colors.surfaceVariant,
                  borderColor: notificationSettings.frequency === 'low' ? accentColor : 'transparent',
                  borderWidth: 2,
                }
              ]}
              onPress={() => {
                updateNotificationSetting('frequency', 'low');
                setShowNotificationModal(false);
              }}
            >
              <RadioButton.Android value="low" color={accentColor} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: getFontSize(16), fontWeight: '700' }}>
                  Low
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: getFontSize(13) }}>
                  Water: Every 4 hours • Quests: Once daily
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                { 
                  backgroundColor: notificationSettings.frequency === 'medium' ? `${accentColor}20` : colors.surfaceVariant,
                  borderColor: notificationSettings.frequency === 'medium' ? accentColor : 'transparent',
                  borderWidth: 2,
                }
              ]}
              onPress={() => {
                updateNotificationSetting('frequency', 'medium');
                setShowNotificationModal(false);
              }}
            >
              <RadioButton.Android value="medium" color={accentColor} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: getFontSize(16), fontWeight: '700' }}>
                  Medium (Recommended)
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: getFontSize(13) }}>
                  Water: Every 2 hours • Quests: Twice daily
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                { 
                  backgroundColor: notificationSettings.frequency === 'high' ? `${accentColor}20` : colors.surfaceVariant,
                  borderColor: notificationSettings.frequency === 'high' ? accentColor : 'transparent',
                  borderWidth: 2,
                }
              ]}
              onPress={() => {
                updateNotificationSetting('frequency', 'high');
                setShowNotificationModal(false);
              }}
            >
              <RadioButton.Android value="high" color={accentColor} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: getFontSize(16), fontWeight: '700' }}>
                  High
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: getFontSize(13) }}>
                  Water: Every hour • Quests: Multiple times daily
                </Text>
              </View>
            </TouchableOpacity>
          </RadioButton.Group>
        </Modal>
      </Portal>
    </PaperProvider>
      <AppBar />
    </>
  );
}

// Note: Styles will be dynamically adjusted by getFontSize() in components
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 122, paddingBottom: 100 },
  statusBarSpacer: { height: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16, letterSpacing: -0.5 },
  card: { marginBottom: 16, borderRadius: 12, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '600',
  },
  divider: { marginVertical: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  bodyText: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 24,
  },
  developerSection: {
    alignItems: 'center',
  },
  developerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  developerBio: {
    color: '#bbb',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  websiteButton: {
    marginTop: 8,
  },
  versionCard: {
    backgroundColor: '#1a1a1a',
    marginTop: 16,
    borderRadius: 12,
  },
  versionText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  versionSubtext: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '700',
  },
  timeInput: {
    backgroundColor: '#0b0b0b',
  },
  timeHint: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
  helpText: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  saveButton: {
    marginTop: 16,
    minHeight: 48,
  },
  appearanceOptions: {
    marginTop: 16,
  },
  optionTouchable: {
    marginTop: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  optionLeft: {
    flex: 1,
    marginRight: 12,
  },
  optionDescription: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  goalRow: {
    marginTop: 16,
  },
  goalInput: {
    backgroundColor: '#1a1a1a',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  timeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  timeValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  timeSubLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  timeArrow: {
    paddingHorizontal: 16,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '700',
  },
  optionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  linkCard: {
    backgroundColor: '#1a1a1a',
    marginBottom: 16,
    borderRadius: 12,
    elevation: 4,
    borderLeftWidth: 4,
  },
  linkButtonContent: {
    paddingVertical: 4,
  },
  linkDescription: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  dataInfo: {
    marginBottom: 16,
  },
  dangerButton: {
    marginTop: 8,
    borderColor: '#ff6b6b',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioLabel: {
    flex: 1,
    marginLeft: 8,
  },
  radioLabelText: {
    color: '#ddd',
    fontSize: 16,
    fontWeight: '600',
  },
  radioLabelDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  radioLabelContainer: {
    flex: 1,
    marginLeft: 8,
  },
  radioSubLabel: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  modalDescription: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  noteText: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  modalButton: {
    marginTop: 16,
  },
  timeInputModal: {
    backgroundColor: '#1a1a1a',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700',
  },
  screenDescription: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    marginTop: -8,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 16,
  },
  colorOption: {
    width: '23%',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    backgroundColor: '#2a2a2a',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  checkmark: {
    color: '#000',
    fontSize: 20,
    fontWeight: '900',
  },
  colorName: {
    color: '#ddd',
    fontSize: 10,
    textAlign: 'center',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#fff',
  },
  customColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  customColorInput: {
    flex: 1,
  },
  customColorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
  },
  colorPickerContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  settingLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    lineHeight: 18,
  },
  timeInfoBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#bb86fc',
  },
  timeInfoTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  timeInfoText: {
    lineHeight: 16,
  },
});
