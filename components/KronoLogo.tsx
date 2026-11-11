import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface KronoLogoProps {
  size?: number;
}

export function KronoLogo({ size = 30 }: KronoLogoProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Image
        source={require('@/assets/images/krono-mark.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityLabel="Logo Krono"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
