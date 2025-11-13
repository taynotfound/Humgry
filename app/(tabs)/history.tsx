import AppBar from '@/components/AppBar';
import MealComparisonModal from '@/components/MealComparisonModal';
import MealDetailModal from '@/components/MealDetailModal';
import { useSettings } from '@/contexts/settings-context';
import type { MealEntry } from '@/hooks/useEntries';
import { useEntries } from '@/hooks/useEntries';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, RefreshControl, SafeAreaView, ScrollView, Share, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Card, Chip, FAB, MD3DarkTheme, MD3LightTheme, Provider as PaperProvider, Text } from 'react-native-paper';

export default function HistoryScreen() {
  const { entries, deleteEntry, updateEntry } = useEntries();
  const { accentColor, getFontSize, colors, theme } = useSettings();
  
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
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
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

  // Filtered entries based on search and filters
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.what.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.brands?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !filterTag || entry.tags?.includes(filterTag);
      return matchesSearch && matchesTag;
    });
  }, [entries, searchQuery, filterTag]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [entries]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await new Promise(resolve => setTimeout(resolve, 200));
    await deleteEntry(id);
    setDeletingId(null);
    // Remove from comparison selection if deleted
    setSelectedForComparison(prev => prev.filter(mId => mId !== id));
  }

  const toggleComparisonSelection = (id: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(id)) {
        return prev.filter(mId => mId !== id);
      } else if (prev.length < 4) { // Max 4 meals to compare
        return [...prev, id];
      }
      return prev;
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh animation
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const exportData = async () => {
    const data = entries.map(e => ({
      food: e.what,
      date: format(new Date(e.time), 'PPp'),
      portion: e.amount,
      calories: e.calories ? Math.round(e.calories) : 'N/A',
    }));
    
    const text = `Humngry Meal History\n\n${data.map(d => 
      `${d.date}\n${d.food} (${d.portion}) - ${d.calories} kcal\n`
    ).join('\n')}`;
    
    await Share.share({
      message: text,
      title: 'My Meal History',
    });
  };

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
          <ScrollView 
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={accentColor}
                colors={[accentColor]}
              />
            }
          >
            <View style={styles.statusBarSpacer} />
            <View style={styles.header}>
              <View style={{ flex: 1, maxWidth: '75%' }}>
                <Text style={[styles.title, { fontSize: getFontSize(28), color: colors.text }]}>🕔 History</Text>
                <Text style={[styles.subtitle, { fontSize: getFontSize(14), color: colors.textSecondary }]}>
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'meal' : 'meals'}
                  {searchQuery || filterTag ? ` (${entries.length} total)` : ' logged'}
                </Text>
              </View>
              <View style={{ width: 80 }} />
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search meals..."
                placeholderTextColor={colors.textTertiary}
                style={[styles.searchInput, { color: colors.text, fontSize: getFontSize(15) }]}
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFilters}>
                <Chip
                  selected={!filterTag}
                  onPress={() => setFilterTag(null)}
                  style={[styles.filterChip, { backgroundColor: !filterTag ? accentColor : colors.surfaceVariant }]}
                  textStyle={{ color: !filterTag ? '#fff' : colors.text, fontSize: getFontSize(13) }}
                >
                  All
                </Chip>
                {allTags.map(tag => (
                  <Chip
                    key={tag}
                    selected={filterTag === tag}
                    onPress={() => setFilterTag(filterTag === tag ? null : tag)}
                    style={[styles.filterChip, { backgroundColor: filterTag === tag ? accentColor : colors.surfaceVariant }]}
                    textStyle={{ color: filterTag === tag ? '#fff' : colors.text, fontSize: getFontSize(13) }}
                  >
                    {tag}
                  </Chip>
                ))}
              </ScrollView>
            )}

            {/* Comparison Mode Indicator */}
            {selectedForComparison.length > 0 && (
              <View style={[styles.comparisonBanner, { backgroundColor: `${accentColor}33`, borderColor: accentColor }]}>
                <Text style={[styles.comparisonText, { color: colors.text, fontSize: getFontSize(14) }]}>
                  {selectedForComparison.length} meal{selectedForComparison.length > 1 ? 's' : ''} selected
                </Text>
                <View style={styles.comparisonActions}>
                  {selectedForComparison.length >= 2 && (
                    <TouchableOpacity
                      onPress={() => setShowComparison(true)}
                      style={[styles.compareButton, { backgroundColor: accentColor }]}
                    >
                      <Text style={[styles.compareButtonText, { fontSize: getFontSize(13) }]}>Compare</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setSelectedForComparison([])}>
                    <Text style={[styles.cancelText, { color: colors.textSecondary, fontSize: getFontSize(13) }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {filteredEntries.length === 0 ? (
              <Card style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                <Card.Content style={styles.emptyContent}>
                  <Text style={styles.emptyEmoji}>🍽️</Text>
                  <Text style={[styles.emptyTitle, { color: colors.text, fontSize: getFontSize(20) }]}>
                    {entries.length === 0 ? 'No meals yet' : 'No matches found'}
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: getFontSize(14) }]}>
                    {entries.length === 0 
                      ? 'Start tracking your meals to see your history here!'
                      : 'Try a different search or filter'}
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              filteredEntries.map((entry, index) => (
                <Animated.View
                  key={entry.id}
                  style={{
                    opacity: deletingId === entry.id ? 0.3 : 1,
                    transform: [{ scale: deletingId === entry.id ? 0.95 : 1 }],
                  }}
                >
                  <TouchableOpacity
                    onLongPress={() => {
                      toggleComparisonSelection(entry.id);
                      // Haptic feedback would go here if available
                    }}
                    delayLongPress={300}
                    activeOpacity={0.7}
                  >
                    <Card style={[
                      styles.card,
                      {
                        backgroundColor: selectedForComparison.includes(entry.id) 
                          ? `${accentColor}22`
                          : colors.surface,
                        borderColor: selectedForComparison.includes(entry.id)
                          ? accentColor
                          : 'transparent',
                        borderWidth: 2,
                      }
                    ]}>
                      <Card.Content>
                        <View style={styles.cardHeader}>
                          <TouchableOpacity
                            style={styles.headerLeft}
                            onPress={() => setSelectedMeal(entry)}
                          >
                            {entry.image_url ? (
                              <Image
                                source={{ uri: entry.image_url }}
                                style={styles.foodImage}
                              />
                            ) : (
                              <View style={[styles.placeholderImage, { backgroundColor: colors.surfaceVariant }]}>
                                <Text style={styles.placeholderEmoji}>🍽️</Text>
                              </View>
                            )}
                            <View style={styles.foodInfo}>
                              <View style={styles.nameRow}>
                                <Text style={[styles.foodName, { color: colors.text, fontSize: getFontSize(16) }]}>
                                  {entry.what}
                                </Text>
                                {entry.rating && (
                                  <Text style={styles.miniRating}>{'⭐'.repeat(entry.rating)}</Text>
                                )}
                              </View>
                              {entry.brands && (
                                <Text style={[styles.brandName, { color: colors.textSecondary, fontSize: getFontSize(12) }]}>
                                  {entry.brands}
                                </Text>
                              )}
                              {entry.mood && (
                                <Text style={styles.moodIndicator}>{entry.mood}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDelete(entry.id)}
                            style={styles.deleteButton}
                            disabled={deletingId === entry.id}
                          >
                            <Text style={styles.deleteIcon}>🗑️</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.details}>
                          <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: getFontSize(13) }]}>
                            🕐 {format(new Date(entry.time), 'MMM d, h:mm a')}
                          </Text>
                        </View>

                        <View style={styles.chips}>
                          <Chip 
                            compact 
                            style={[styles.chip, { backgroundColor: colors.surfaceVariant }]}
                            textStyle={{ color: colors.text, fontSize: getFontSize(11) }}
                          >
                            {entry.amount === 'small' ? '100g' : entry.amount === 'large' ? '500g' : '250g'}
                          </Chip>
                          {entry.calories && (
                            <Chip 
                              compact 
                              icon="fire" 
                              style={[styles.chip, { backgroundColor: colors.surfaceVariant }]}
                              textStyle={{ color: colors.text, fontSize: getFontSize(11) }}
                            >
                              {Math.round(entry.calories)} kcal
                            </Chip>
                          )}
                          {entry.protein && (
                            <Chip 
                              compact 
                              style={[styles.chip, { backgroundColor: colors.surfaceVariant }]}
                              textStyle={{ color: colors.text, fontSize: getFontSize(11) }}
                            >
                              🥩 {Math.round(entry.protein)}g
                            </Chip>
                          )}
                          {entry.tags && entry.tags.map(tag => (
                            <Chip
                              key={tag}
                              compact
                              style={[styles.chip, { backgroundColor: `${accentColor}33` }]}
                              textStyle={{ color: colors.text, fontSize: getFontSize(10) }}
                            >
                              {tag}
                            </Chip>
                          ))}
                        </View>
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </Animated.View>

        {/* Export FAB */}
        {entries.length > 0 && !selectedForComparison.length && (
          <FAB
            icon="export"
            style={[styles.exportFab, { backgroundColor: accentColor }]}
            color={theme === 'dark' ? '#000' : '#fff'}
            onPress={exportData}
            label="Export"
          />
        )}
      </SafeAreaView>

      {/* Meal Detail Modal */}
      <MealDetailModal
        visible={selectedMeal !== null}
        entry={selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onUpdate={updateEntry}
      />

      {/* Meal Comparison Modal */}
      <MealComparisonModal
        visible={showComparison}
        meals={selectedForComparison.map(id => entries.find(e => e.id === id)!).filter(Boolean)}
        onClose={() => {
          setShowComparison(false);
          setSelectedForComparison([]);
        }}
      />
    </PaperProvider>
    <AppBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 122, paddingBottom: 180 },
  statusBarSpacer: { height: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontWeight: '500', marginTop: 2 },
  screenDescription: { lineHeight: 18, marginTop: 6 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  clearIcon: { fontSize: 20, padding: 8 },
  tagFilters: {
    marginBottom: 12,
  },
  filterChip: {
    marginRight: 8,
    height: 36,
    paddingVertical: 2,
  },
  comparisonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  comparisonText: {
    fontWeight: '600',
  },
  comparisonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compareButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 40,
  },
  compareButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  cancelText: {
    fontWeight: '600',
  },
  card: { marginBottom: 12, borderRadius: 12, elevation: 4 },
  emptyCard: { borderRadius: 16, elevation: 4, marginTop: 40 },
  emptyContent: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontWeight: '700', marginBottom: 8 },
  emptyText: { textAlign: 'center', lineHeight: 20, maxWidth: '80%' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  foodImage: { width: 56, height: 56, borderRadius: 10, marginRight: 12 },
  placeholderImage: { width: 56, height: 56, borderRadius: 10, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 28 },
  foodInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  foodName: { fontWeight: '600', flex: 1 },
  miniRating: { fontSize: 12 },
  brandName: { marginTop: 2 },
  moodIndicator: { fontSize: 16, marginTop: 4 },
  deleteButton: { padding: 12, borderRadius: 8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { fontSize: 20 },
  details: { marginBottom: 10 },
  detailText: { marginBottom: 4 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { height: 32, paddingVertical: 2 },
  exportFab: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    borderRadius: 16,
    elevation: 8,
  },
});
