import React, { useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface ColorPickerWheelProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  size?: number;
}

export default function ColorPickerWheel({ currentColor, onColorChange, size = 200 }: ColorPickerWheelProps) {
  const [selectedColor, setSelectedColor] = useState(currentColor);

  // Convert HSL to Hex
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => handleColorSelect(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
    onPanResponderMove: (evt, gestureState) => handleColorSelect(evt.nativeEvent.locationX, evt.nativeEvent.locationY),
  });

  const handleColorSelect = (x: number, y: number) => {
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Calculate angle and distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = size / 2;
    
    // Check if within circle
    if (distance > radius) return;
    
    // Convert angle to hue (0-360)
    const hue = (angle + 360) % 360;
    
    // Calculate saturation based on distance from center (0-100)
    const saturation = Math.min(100, (distance / radius) * 100);
    
    // Fixed lightness for vibrant colors
    const lightness = 50;
    
    const hexColor = hslToHex(hue, saturation, lightness);
    setSelectedColor(hexColor);
    onColorChange(hexColor);
  };

  // Generate color wheel gradient
  const renderColorWheel = () => {
    const colors = [];
    for (let i = 0; i < 360; i += 10) {
      colors.push(hslToHex(i, 100, 50));
    }
    return colors;
  };

  return (
    <View style={styles.container}>
      <View
        style={[styles.colorWheel, { width: size, height: size }]}
        {...panResponder.panHandlers}
      >
        {/* Simplified color wheel using radial gradient simulation */}
        <View style={[styles.wheelCenter, { width: size, height: size, borderRadius: size / 2 }]}>
          {renderColorWheel().map((color, index) => (
            <View
              key={index}
              style={[
                styles.colorSegment,
                {
                  backgroundColor: color,
                  transform: [{ rotate: `${(index * 10)}deg` }],
                  width: size / 2,
                  height: 20,
                  position: 'absolute',
                  left: size / 2,
                  top: size / 2 - 10,
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 10,
                },
              ]}
            />
          ))}
          <View style={[styles.centerCircle, { width: size * 0.15, height: size * 0.15, borderRadius: size * 0.075 }]} />
        </View>
      </View>
      <View style={styles.previewContainer}>
        <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
        <Text style={styles.colorText}>{selectedColor.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  colorWheel: {
    position: 'relative',
    marginBottom: 20,
  },
  wheelCenter: {
    position: 'relative',
    overflow: 'hidden',
  },
  colorSegment: {
    opacity: 0.9,
  },
  centerCircle: {
    position: 'absolute',
    left: '42.5%',
    top: '42.5%',
    backgroundColor: '#fff',
    zIndex: 10,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#333',
  },
  colorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
