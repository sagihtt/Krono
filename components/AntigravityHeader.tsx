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
  { top: 10, left: '8%', color: AntigravityPalette.electricBlue, size: 5 },
  { top: 26, left: '18%', color: AntigravityPalette.cobaltBlue, size: 4 },
  { top: 14, left: '82%', color: AntigravityPalette.electricBlue, size: 5 },
  { top: 34, left: '90%', color: AntigravityPalette.coralRed, size: 4 },
  { top: 68, left: '12%', color: AntigravityPalette.coralRed, size: 4 },
  { top: 76, left: '86%', color: AntigravityPalette.solarAmber, size: 5 },
  { top: 48, left: '6%', color: AntigravityPalette.emerald, size: 4 },
];

export function AntigravityHeader({
  badgeText = '✦ ANTIGRAVITY CHRONO',
  title,
  subtitle,
  rightContent,
}: AntigravityHeaderProps) {
  return (
    <View style={styles.wrapper}>
      {/* Campo de partículas inspirado na hero section do https://antigravity.google/ */}
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
        <View style={styles.brandRow}>
          <View style={styles.spectrumMark}>
            <View style={[styles.markBar, { backgroundColor: AntigravityPalette.electricBlue }]} />
            <View style={[styles.markBar, { backgroundColor: AntigravityPalette.coralRed }]} />
            <View style={[styles.markBar, { backgroundColor: AntigravityPalette.solarAmber }]} />
          </View>
          <Text style={styles.brandName}>Google Antigravity</Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillBadgeText}>{badgeText}</Text>
          </View>
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
    backgroundColor: AntigravityPalette.canvas,
    borderRadius: Radii.bento,
    paddingVertical: 20,
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
    opacity: 0.65,
  },
  dot: {
    position: 'absolute',
    borderRadius: 99,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  spectrumMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  markBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.2,
  },
  pillBadge: {
    backgroundColor: AntigravityPalette.obsidian,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  pillBadgeText: {
    color: AntigravityPalette.canvas,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: AntigravityPalette.slate,
    lineHeight: 20,
  },
});
