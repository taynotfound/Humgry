import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, DataTable, Text } from 'react-native-paper';

export default function Stats({ entries, points }: { entries: any[]; points: number }) {
  const streak = Math.min(7, Math.floor(points / 50));
  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          Stats & Gamification
        </Text>
        <DataTable>
          <DataTable.Row>
            <DataTable.Cell>Entries</DataTable.Cell>
            <DataTable.Cell numeric>
              <Text variant="titleMedium">{entries.length}</Text>
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Points</DataTable.Cell>
            <DataTable.Cell numeric>
              <Text variant="titleMedium">{points}</Text>
            </DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Badges</DataTable.Cell>
            <DataTable.Cell numeric>
              <Text variant="titleMedium">{'★'.repeat(streak) + '☆'.repeat(7 - streak)}</Text>
            </DataTable.Cell>
          </DataTable.Row>
        </DataTable>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 0, backgroundColor: '#1a1a1a' },
  title: { color: '#fff', marginBottom: 8 },
});
