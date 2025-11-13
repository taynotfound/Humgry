import { useSettings } from '@/contexts/settings-context';
import { router, usePathname } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FAB, Portal, Text } from 'react-native-paper';

const { height } = Dimensions.get('window');

export default function FloatingNav() {
  const { accentColor, getFontSize, colors, theme } = useSettings();
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
      title: 'Recipes & Tools',
      items: [
        { label: 'Recipes', icon: '📚', route: '/recipes', description: 'Recipe ideas' },
        { label: 'Recipe Builder', icon: '👨‍🍳', route: '/recipe-builder', description: 'Create recipes' },
        { label: 'Fasting Timer', icon: '⏱️', route: '/fasting', description: 'Track fasting' },
        { label: 'TDEE Calculator', icon: '🧮', route: '/tdee-calculator', description: 'Calculate TDEE' },
      ]
    },
    {
      title: 'Management',
      items: [
        { label: 'Tags Manager', icon: '🏷️', route: '/tags-manager', description: 'Manage tags' },
        { label: 'Meal Combos', icon: '⚡', route: '/combos-manager', description: 'Manage combos' },
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
    router.push(route as any);
  };

  return (
    <>
      {/* Overlay Menu */}
      {isOpen && (
        <Portal>
          <TouchableOpacity
            style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.85)' }]}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          >
            <ScrollView 
              style={styles.menuScrollView}
              contentContainerStyle={styles.menuContainer}
              showsVerticalScrollIndicator={false}
            >
              {menuSections.map((section, sectionIndex) => (
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
                          activeOpacity={0.7}
                        >
                          <View style={styles.menuItemContent}>
                            <Text style={styles.menuIcon}>{item.icon}</Text>
                            <View style={styles.menuTextContainer}>
                              <Text style={[
                                styles.menuLabel,
                                { 
                                  fontSize: getFontSize(16),
                                  color: isCurrentRoute(item.route) ? '#fff' : colors.text,
                                  fontWeight: isCurrentRoute(item.route) ? '700' : '600',
                                }
                              ]}>
                                {item.label}
                              </Text>
                              <Text style={[
                                styles.menuDescription,
                                { 
                                  fontSize: getFontSize(12),
                                  color: isCurrentRoute(item.route) ? 'rgba(255, 255, 255, 0.8)' : colors.textSecondary,
                                }
                              ]}>
                                {item.description}
                              </Text>
                            </View>
                            {'submenu' in item && item.submenu && (
                              <Text style={[styles.expandIcon, { color: isCurrentRoute(item.route) ? '#fff' : colors.text }]}>
                                {expandedMenu === item.label ? '▼' : '▶'}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        
                        {/* Submenu */}
                        {'submenu' in item && item.submenu && expandedMenu === item.label && (
                          <View style={[styles.submenuContainer, { backgroundColor: colors.surfaceVariant }]}>
                            {item.submenu.map((subitem: any) => (
                              <TouchableOpacity
                                key={subitem.route}
                                style={styles.submenuItem}
                                onPress={() => handleNavigate(subitem.route)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.submenuIcon}>{subitem.icon}</Text>
                                <Text style={[styles.submenuLabel, { fontSize: getFontSize(14), color: colors.text }]}>
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

      {/* FAB Button */}
      <FAB
        icon={isOpen ? 'close' : 'menu'}
        style={[styles.fab, { backgroundColor: accentColor }]}
        onPress={() => setIsOpen(!isOpen)}
        color={theme === 'dark' ? '#000' : '#fff'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 999,
  },
  menuScrollView: {
    flex: 1,
  },
  menuContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
  sectionItems: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    opacity: 0.8,
  },
  expandIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  submenuContainer: {
    marginTop: 8,
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 8,
  },
  submenuIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  submenuLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 16,
    top: 60,
    zIndex: 1000,
    elevation: 8,
  },
});
