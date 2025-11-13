import { useSettings } from '@/contexts/settings-context';
import { MealEntry } from '@/hooks/useEntries';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Chip, IconButton, Text } from 'react-native-paper';

interface MealDetailModalProps {
  visible: boolean;
  entry: MealEntry | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<MealEntry>) => Promise<void>;
}

export default function MealDetailModal({ visible, entry, onClose, onUpdate }: MealDetailModalProps) {
  const { colors, getFontSize, accentColor } = useSettings();
  const [rating, setRating] = useState(entry?.rating || 0);
  const [notes, setNotes] = useState(entry?.notes || '');
  const [mood, setMood] = useState(entry?.mood || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);

  const moods = ['😋', '😐', '😞', '🤤', '😊'];
  const availableTags = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Cheat Day', 'Healthy', 'Homemade', 'Restaurant'];

  // Reset state when entry changes
  useEffect(() => {
    if (entry) {
      setRating(entry.rating || 0);
      setNotes(entry.notes || '');
      setMood(entry.mood || '');
      setTags(entry.tags || []);
    }
  }, [entry]);

  if (!entry) return null;

  const handleSave = async () => {
    await onUpdate(entry.id, { rating, notes, mood, tags });
    // Reset state after saving
    setRating(0);
    setNotes('');
    setMood('');
    setTags([]);
    onClose();
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text, fontSize: getFontSize(20) }]}>
              {entry.what}
            </Text>
            <IconButton icon="close" size={24} iconColor={colors.text} onPress={onClose} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.time, { color: colors.textSecondary, fontSize: getFontSize(14) }]}>
              {format(new Date(entry.time), 'PPp')}
            </Text>

            {/* Rating */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(16) }]}>
                ⭐ Rating
              </Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Text style={styles.star}>{star <= rating ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Mood */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(16) }]}>
                😊 How was it?
              </Text>
              <View style={styles.moods}>
                {moods.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMood(m)}
                    style={[
                      styles.moodButton,
                      { backgroundColor: mood === m ? `${accentColor}33` : colors.surfaceVariant }
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(16) }]}>
                🏷️ Tags
              </Text>
              <View style={styles.tags}>
                {availableTags.map((tag) => (
                  <Chip
                    key={tag}
                    selected={tags.includes(tag)}
                    onPress={() => toggleTag(tag)}
                    style={[
                      styles.tagChip,
                      { backgroundColor: tags.includes(tag) ? `${accentColor}33` : colors.surfaceVariant }
                    ]}
                    textStyle={{ color: colors.text, fontSize: getFontSize(13) }}
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(16) }]}>
                📝 Notes
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add your thoughts..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    color: colors.text,
                    borderColor: colors.border,
                    fontSize: getFontSize(14),
                  }
                ]}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: accentColor }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { fontSize: getFontSize(16) }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  time: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    fontSize: 32,
  },
  moods: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  moodButton: {
    padding: 12,
    borderRadius: 12,
    minWidth: 56,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 32,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagChip: {
    height: 32,
  },
  notesInput: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  saveButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
