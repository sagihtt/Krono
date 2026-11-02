import { AntigravityPalette, Radii } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AntigravityHeaderProps {
  badgeText?: string;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

const SPECTRUM_DOTS = [
  { top: 12, left: '8%', color: AntigravityPalette.electricBlue, size: 4 },
  { top: 28, left: '18%', color: AntigravityPalette.cobaltBlue, size: 3 },
  { top: 16, left: '84%', color: AntigravityPalette.electricBlue, size: 4 },
  { top: 38, left: '92%', color: AntigravityPalette.coralRed, size: 4 },
  { top: 72, left: '88%', color: AntigravityPalette.solarAmber, size: 4 },
  { top: 52, left: '6%', color: AntigravityPalette.emerald, size: 3 },
];

export function AntigravityHeader({
  badgeText = 'KRONO',
  title,
  subtitle,
  rightContent,
}: AntigravityHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.particleLayer} pointerEvents="none">
        {SPECTRUM_DOTS.map((dot, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              {
                top: dot.top,
                left: dot.left as any,
                backgroundColor: dot.color,
                width: dot.size,
                height: dot.size,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.topRow}>
        <View style={styles.pillBadge}>
          <Text style={styles.pillBadgeText}>{badgeText}</Text>
        </View>
        {rightContent}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: Radii.bento,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    position: 'relative',
    overflow: 'hidden',
  },
  particleLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.55,
  },
  dot: {
    position: 'absolute',
    borderRadius: 99,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBadge: {
    backgroundColor: AntigravityPalette.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  pillBadgeText: {
    color: AntigravityPalette.slate,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: AntigravityPalette.slate,
    lineHeight: 19,
  },
});
