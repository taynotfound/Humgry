import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, SegmentedButtons, Text, TextInput } from 'react-native-paper';

export default function MealEntryForm({ onSubmit }: { onSubmit: (entry: any) => Promise<any> }) {
  const [what, setWhat] = useState('');
  const [amount, setAmount] = useState<'small' | 'medium' | 'large'>('medium');
  const [fullness, setFullness] = useState('3');

  async function submit() {
    const entry = { what, amount, fullness: Number(fullness), time: new Date() };
    await onSubmit(entry);
    setWhat('');
    setAmount('medium');
    setFullness('3');
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
  label: { color: '#ddd', marginBottom: 8 },
  segmented: { marginBottom: 12 },
  button: { marginTop: 8 },
});
