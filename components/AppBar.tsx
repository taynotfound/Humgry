import { useSettings } from '@/contexts/settings-context';
import { router, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Portal, Text } from 'react-native-paper';

const { height } = Dimensions.get('window');

export default function AppBar() {
  const { accentColor, colors, theme } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();

  const menuSections = [
    {
      title: 'Track & Log',
      items: [
        { label: 'Track', icon: '🍽️', route: '/', description: 'Log your meals' },
        { label: 'History', icon: '📜', route: '/history', description: 'Past entries' },
      ]
    },
    {
      title: 'Progress & Goals',
      items: [
        { label: 'Score Card', icon: '🏆', route: '/scorecard', description: 'Daily nutrition score' },
        { label: 'Challenges', icon: '⚔️', route: '/challenges', description: 'Weekly challenges' },
        { 
          label: 'Goals', 
          icon: '🎯', 
          route: '/goals', 
          description: 'Your goals',
          submenu: [
            { label: 'My Goals', icon: '🎯', route: '/goals' },
            { label: 'Daily Quests', icon: '⚡', route: '/goals?tab=quests' },
            { label: 'Meal Planner', icon: '📅', route: '/goals?tab=planner' },
          ]
        },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Insights', icon: '🔥', route: '/insights', description: 'Trends & patterns' },
        { label: 'Stats', icon: '📊', route: '/stats', description: 'Detailed stats' },
      ]
    },
    {
      title: 'More',
      items: [
        { label: 'Recipes', icon: '📚', route: '/recipes', description: 'Recipe ideas' },
        { label: 'Settings', icon: '⚙️', route: '/settings', description: 'App settings' },
      ]
    }
  ];

  const isCurrentRoute = (path: string) => {
    if (path === '/' && (pathname === '/' || pathname === '/(tabs)')) return true;
    return pathname === path;
  };

  const handleNavigate = (route: string) => {
    setIsOpen(false);
    setExpandedMenu(null);
    router.push(route as any);
  };

  return (
    <>
      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.appBarContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/iconnobg.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: colors.text }]}>Humngry</Text>
          </View>
          <IconButton
            icon="menu"
            size={28}
            iconColor={colors.text}
            onPress={() => setIsOpen(!isOpen)}
            style={styles.menuButton}
          />
        </View>
      </View>

      {/* Overlay Menu */}
      {isOpen && (
        <Portal>
          <TouchableOpacity
            style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.85)' }]}
            activeOpacity={1}
            onPress={() => {
              setIsOpen(false);
              setExpandedMenu(null);
            }}
          >
            <ScrollView 
              style={styles.menuScrollView}
              contentContainerStyle={styles.menuContainer}
              showsVerticalScrollIndicator={false}
            >
              {menuSections.map((section) => (
                <View key={section.title} style={styles.menuSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {section.title}
                  </Text>
                  <View style={styles.sectionItems}>
                    {section.items.map((item) => (
                      <View key={item.route}>
                        <TouchableOpacity
                          style={[
                            styles.menuItem,
                            { 
                              backgroundColor: isCurrentRoute(item.route) ? accentColor : colors.surface,
                              borderColor: isCurrentRoute(item.route) ? accentColor : 'transparent',
                            }
                          ]}
                          onPress={() => {
                            if ('submenu' in item && item.submenu) {
                              setExpandedMenu(expandedMenu === item.label ? null : item.label);
                            } else {
                              handleNavigate(item.route);
                            }
                          }}
                        >
                          <View style={styles.menuItemContent}>
                            <Text style={styles.menuIcon}>{item.icon}</Text>
                            <View style={styles.menuTextContainer}>
                              <Text style={[
                                styles.menuLabel,
                                { color: isCurrentRoute(item.route) ? '#fff' : colors.text }
                              ]}>
                                {item.label}
                              </Text>
                              <Text style={[
                                styles.menuDescription,
                                { color: isCurrentRoute(item.route) ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
                              ]}>
                                {item.description}
                              </Text>
                            </View>
                            {'submenu' in item && item.submenu && (
                              <Text style={[styles.expandIcon, { color: colors.text }]}>
                                {expandedMenu === item.label ? '▼' : '▶'}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Submenu */}
                        {'submenu' in item && item.submenu && expandedMenu === item.label && (
                          <View style={[styles.submenu, { backgroundColor: colors.surfaceVariant }]}>
                            {item.submenu.map((subitem) => (
                              <TouchableOpacity
                                key={subitem.route}
                                style={[
                                  styles.submenuItem,
                                  { backgroundColor: isCurrentRoute(subitem.route) ? accentColor : 'transparent' }
                                ]}
                                onPress={() => handleNavigate(subitem.route)}
                              >
                                <Text style={styles.submenuIcon}>{subitem.icon}</Text>
                                <Text style={[
                                  styles.submenuLabel,
                                  { color: isCurrentRoute(subitem.route) ? '#fff' : colors.text }
                                ]}>
                                  {subitem.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </Portal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  appBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    borderBottomWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  appBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  menuButton: {
    margin: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuScrollView: {
    flex: 1,
    marginTop: 120,
  },
  menuContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionItems: {
    gap: 8,
  },
  menuItem: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIcon: {
    fontSize: 28,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
  },
  expandIcon: {
    fontSize: 14,
    opacity: 0.6,
  },
  submenu: {
    marginTop: 4,
    marginLeft: 16,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 4,
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderRadius: 6,
  },
  submenuIcon: {
    fontSize: 20,
  },
  submenuLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});
