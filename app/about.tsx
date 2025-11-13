import { useSettings } from '@/contexts/settings-context';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Linking, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, MD3DarkTheme, Provider as PaperProvider, Text } from 'react-native-paper';

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    background: '#0b0b0b',
    surface: '#1a1a1a',
  },
};

export default function AboutScreen() {
  const router = useRouter();
  const { accentColor, getFontSize } = useSettings();

  const openWebsite = () => {
    Linking.openURL('https://taymaerz.de');
  };

  return (
    <PaperProvider theme={darkTheme}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusBarSpacer} />
          
          <View style={styles.header}>
            <Button
              mode="text"
              onPress={() => router.back()}
              icon="arrow-left"
              textColor={accentColor}
              style={styles.backButton}
              labelStyle={{ fontSize: getFontSize(15) }}
            >
              Back to Settings
            </Button>
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={styles.appIcon}
            />
            <Text style={styles.title}>ℹ️ About Humngry</Text>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.aboutText}>
                🍽️ Welcome to Humngry!
              </Text>
              
              <Text style={styles.bodyText}>
                This app is designed for people who sometimes forget to eat. It uses clear, predictable patterns and explicit instructions.
              </Text>
              
              <Divider style={styles.divider} />
              
              <Text style={[styles.sectionTitle, { color: accentColor }]}>💡 Who is this for:</Text>
              <Text style={styles.bodyText}>
                • People who forget to eat during the day{'\n'}
                • People who need clear structure and reminders{'\n'}
                • People who want to understand their hunger patterns{'\n'}
                • Anyone who needs friendly reminders to refuel
              </Text>
              
              <Divider style={styles.divider} />
              
              <Text style={[styles.sectionTitle, { color: accentColor }]}>💡 How it works:</Text>
              <Text style={styles.bodyText}>
                1. Search for what you ate (pizza, apple, chicken, etc.){'\n'}
                2. Pick the portion size with specific examples{'\n'}
                3. Optionally rate your fullness (or skip this step){'\n'}
                4. App calculates when a "normal" person would eat again{'\n'}
                5. Get a notification reminder at that time{'\n'}
                6. Track your progress and earn badges!
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="👨‍💻 Developer" titleStyle={styles.cardTitle} />
            <Card.Content>
              <View style={styles.developerSection}>
                <Text style={styles.developerName}>Tay März</Text>
                <Text style={styles.developerBio}>
                  Created with ❤️ to help people maintain healthy eating habits
                </Text>
                <Button
                  mode="contained"
                  onPress={openWebsite}
                  style={styles.websiteButton}
                  icon="web"
                  buttonColor={accentColor}
                  labelStyle={{ fontSize: getFontSize(15) }}
                >
                  Visit taymaerz.de
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => Linking.openURL('https://ko-fi.com/M4M33OQLQ')}
                  style={[styles.kofiButton, { borderColor: accentColor }]}
                  icon="coffee"
                  textColor={accentColor}
                  buttonColor="transparent"
                  labelStyle={{ fontSize: getFontSize(15) }}
                >
                  ☕ Support on Ko-fi
                </Button>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="📦 Updates & Source" titleStyle={styles.cardTitle} />
            <Card.Content>
              <View style={styles.linksSection}>
                <Button
                  mode="contained-tonal"
                  onPress={() => Linking.openURL('https://github.com/taynotfound/Humgry/releases')}
                  style={styles.linkButton}
                  icon="download"
                  buttonColor={`${accentColor}33`}
                  textColor={accentColor}
                  labelStyle={{ fontSize: getFontSize(15) }}
                >
                  📥 Download Latest Release
                </Button>
                <Button
                  mode="contained-tonal"
                  onPress={() => Linking.openURL('https://github.com/taynotfound/Humgry')}
                  style={styles.linkButton}
                  icon="github"
                  buttonColor={`${accentColor}33`}
                  textColor={accentColor}
                  labelStyle={{ fontSize: getFontSize(15) }}
                >
                  💻 View on GitHub
                </Button>
                <Text style={styles.updateText}>
                  Check for updates and view the source code on GitHub. All releases are available as APK downloads.
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="🔒 Data & Privacy" titleStyle={styles.cardTitle} />
            <Card.Content>
              <Text style={styles.bodyText}>
                🔒 All your data stays on your device{'\n'}
                📱 No account required{'\n'}
                🌐 Food data from OpenFoodFacts (open database){'\n'}
                ⚡ No tracking, no ads, no data collection
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="🛠️ Technologies Used" titleStyle={styles.cardTitle} />
            <Card.Content>
              <View style={styles.techSection}>
                <Text style={[styles.techCategory, { color: accentColor }]}>Framework & Platform</Text>
                <Text style={styles.techItem}>• React Native 0.81 - Cross-platform mobile development</Text>
                <Text style={styles.techItem}>• Expo SDK 54 - Development & deployment platform</Text>
                <Text style={styles.techItem}>• TypeScript - Type-safe JavaScript</Text>
                
                <Text style={[styles.techCategory, { color: accentColor }]}>UI & Design</Text>
                <Text style={styles.techItem}>• React Native Paper - Material Design 3 components</Text>
                <Text style={styles.techItem}>• Custom theming with dark mode optimized for readability</Text>
                
                <Text style={[styles.techCategory, { color: accentColor }]}>Data & APIs</Text>
                <Text style={styles.techItem}>• OpenFoodFacts API - 2M+ food products database</Text>
                <Text style={styles.techItem}>• TheMealDB API - Recipe inspiration & instructions</Text>
                <Text style={styles.techItem}>• AsyncStorage - Local data persistence</Text>
                
                <Text style={[styles.techCategory, { color: accentColor }]}>Features</Text>
                <Text style={styles.techItem}>• Expo Notifications - Smart meal reminders</Text>
                <Text style={styles.techItem}>• Expo Router - File-based navigation</Text>
                <Text style={styles.techItem}>• date-fns - Date formatting utilities</Text>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0b0b' },
  content: { padding: 16, paddingBottom: 32 },
  statusBarSpacer: { height: 24 },
  header: { marginBottom: 24, alignItems: 'center' },
  backButton: { marginBottom: 16, alignSelf: 'flex-start' },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  card: { backgroundColor: '#1a1a1a', marginBottom: 16, borderRadius: 12, elevation: 4 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  aboutText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '600',
  },
  divider: { marginVertical: 16, backgroundColor: '#333' },
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
  kofiButton: {
    marginTop: 8,
    borderColor: '#8773f5',
  },
  techSection: {
    gap: 8,
  },
  techCategory: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  techItem: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 8,
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
  linksSection: {
    gap: 12,
  },
  linkButton: {
    marginVertical: 4,
  },
  updateText: {
    color: '#bbb',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
