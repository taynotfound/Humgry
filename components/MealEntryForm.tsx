import React, { useState } from 'react';
import { StyleSheet, View, Image, Alert } from 'react-native';
import { Button, Card, SegmentedButtons, Text, TextInput, IconButton, Chip } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useCustomTags } from '../hooks/useCustomTags';
import { useMealCombos } from '../hooks/useMealCombos';

export default function MealEntryForm({ onSubmit }: { onSubmit: (entry: any) => Promise<any> }) {
  const [what, setWhat] = useState('');
  const [amount, setAmount] = useState<'small' | 'medium' | 'large'>('medium');
  const [fullness, setFullness] = useState('3');
  const [photo, setPhoto] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { tags } = useCustomTags();
  const { combos } = useMealCombos();

  const mealColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA'];

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required to add photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  }

  function toggleTag(tagName: string) {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  }

  async function submit() {
    const entry = {
      what,
      amount,
      fullness: Number(fullness),
      time: new Date(),
      photo,
      color: selectedColor,
      tags: selectedTags,
    };
    await onSubmit(entry);
    setWhat('');
    setAmount('medium');
    setFullness('3');
    setPhoto(undefined);
    setSelectedColor(undefined);
    setSelectedTags([]);
  }

  return (
    <Card style={styles.container}>
      <Card.Content>
        <TextInput
          label="What did you eat?"
          value={what}
          onChangeText={setWhat}
          placeholder="e.g. avocado toast"
          mode="outlined"
          style={styles.input}
        />

        <Text variant="labelLarge" style={styles.label}>
          Amount
        </Text>
        <SegmentedButtons
          value={amount}
          onValueChange={(val) => setAmount(val as any)}
          buttons={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
          style={styles.segmented}
        />

        <TextInput
          label="Fullness (1-5)"
          value={fullness}
          onChangeText={setFullness}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        {/* Photo Section */}
        <Text variant="labelLarge" style={styles.label}>
          Photo
        </Text>
        <View style={styles.photoSection}>
          {photo ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <IconButton icon="close-circle" size={24} onPress={() => setPhoto(undefined)} />
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <Button mode="outlined" icon="camera" onPress={takePhoto} style={styles.photoButton}>
                Camera
              </Button>
              <Button mode="outlined" icon="image" onPress={pickImage} style={styles.photoButton}>
                Gallery
              </Button>
            </View>
          )}
        </View>

        {/* Color Coding */}
        <Text variant="labelLarge" style={styles.label}>
          Color Code (Optional)
        </Text>
        <View style={styles.colorPicker}>
          {mealColors.map((color) => (
            <IconButton
              key={color}
              icon={selectedColor === color ? 'check-circle' : 'circle'}
              iconColor={color}
              size={32}
              onPress={() => setSelectedColor(selectedColor === color ? undefined : color)}
            />
          ))}
        </View>

        {/* Tags */}
        {tags.length > 0 && (
          <>
            <Text variant="labelLarge" style={styles.label}>
              Tags
            </Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  selected={selectedTags.includes(tag.name)}
                  onPress={() => toggleTag(tag.name)}
                  style={{ backgroundColor: tag.color + '33', marginRight: 8, marginBottom: 8 }}
                >
                  {tag.name}
                </Chip>
              ))}
            </View>
          </>
        )}

        {/* Meal Combos */}
        {combos.length > 0 && (
          <>
            <Text variant="labelLarge" style={styles.label}>
              Quick Combos
            </Text>
            <View style={styles.tagsContainer}>
              {combos.slice(0, 5).map((combo) => (
                <Chip
                  key={combo.id}
                  icon="lightning-bolt"
                  onPress={() => setWhat(combo.items.join(', '))}
                  style={{ marginRight: 8, marginBottom: 8 }}
                >
                  {combo.name}
                </Chip>
              ))}
            </View>
          </>
        )}

        <Button mode="contained" onPress={submit} disabled={!what} style={styles.button}>
          Log meal
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1a1a1a', marginBottom: 16 },
  input: { marginBottom: 12 },
  label: { color: '#ddd', marginBottom: 8, marginTop: 8 },
  segmented: { marginBottom: 12 },
  button: { marginTop: 8 },
  photoSection: { marginBottom: 12 },
  photoContainer: { position: 'relative', alignItems: 'center' },
  photo: { width: 200, height: 150, borderRadius: 8 },
  photoButtons: { flexDirection: 'row', gap: 8 },
  photoButton: { flex: 1 },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
});
