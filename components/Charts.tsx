import React, { memo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  maxValue?: number;
  accentColor: string;
  height?: number;
  fontSize?: number;
  theme: 'dark' | 'light';
}

export const BarChart = memo(({ data, maxValue, accentColor, height = 200, fontSize = 12, theme }: BarChartProps) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const barWidth = (width - 80) / data.length - 8;
  const textColor = theme === 'dark' ? '#ddd' : '#333';
  const gridColor = theme === 'dark' ? '#333' : '#e0e0e0';

  return (
    <View style={styles.container}>
      <View style={[styles.chartArea, { height }]}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent, idx) => (
          <View
            key={idx}
            style={[
              styles.gridLine,
              { bottom: `${percent * 100}%`, borderColor: gridColor }
            ]}
          />
        ))}
        
        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((point, idx) => {
            const barHeight = (point.value / max) * height;
            return (
              <View key={idx} style={[styles.barWrapper, { width: barWidth }]}>
                <View style={styles.barContainer}>
                  <Text style={[styles.barValue, { fontSize, color: textColor }]}>
                    {point.value > 0 ? Math.round(point.value) : ''}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        width: barWidth,
                        backgroundColor: point.color || accentColor,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { fontSize: fontSize - 1, color: textColor }]} numberOfLines={1}>
                  {point.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
});

BarChart.displayName = 'BarChart';

interface LineChartProps {
  data: DataPoint[];
  maxValue?: number;
  accentColor: string;
  height?: number;
  fontSize?: number;
  theme: 'dark' | 'light';
}

export const LineChart = memo(({ data, maxValue, accentColor, height = 200, fontSize = 12, theme }: LineChartProps) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const pointWidth = (width - 80) / (data.length - 1 || 1);
  const textColor = theme === 'dark' ? '#ddd' : '#333';
  const gridColor = theme === 'dark' ? '#333' : '#e0e0e0';

  return (
    <View style={styles.container}>
      <View style={[styles.chartArea, { height }]}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((percent, idx) => (
          <View
            key={idx}
            style={[
              styles.gridLine,
              { bottom: `${percent * 100}%`, borderColor: gridColor }
            ]}
          />
        ))}
        
        {/* Points and line */}
        <View style={styles.lineContainer}>
          {data.map((point, idx) => {
            const pointHeight = (point.value / max) * height;
            const left = idx * pointWidth;
            
            return (
              <View key={idx}>
                <View
                  style={[
                    styles.point,
                    {
                      bottom: pointHeight - 6,
                      left: left,
                      backgroundColor: point.color || accentColor,
                    }
                  ]}
                />
                <Text
                  style={[
                    styles.pointLabel,
                    {
                      bottom: -20,
                      left: left - 15,
                      fontSize: fontSize - 1,
                      color: textColor,
                    }
                  ]}
                >
                  {point.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
});

LineChart.displayName = 'LineChart';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  chartArea: {
    position: 'relative',
    marginBottom: 30,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    gap: 4,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValue: {
    marginBottom: 4,
    fontWeight: '600',
  },
  barLabel: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  lineContainer: {
    position: 'relative',
    height: '100%',
  },
  point: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pointLabel: {
    position: 'absolute',
    textAlign: 'center',
    width: 30,
    fontWeight: '500',
  },
});
