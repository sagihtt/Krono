import { AntigravityPalette, Radii } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface RelogioDigitalProps {
  turnoLabel?: string;
}

export const RelogioDigital = React.memo(function RelogioDigital({
  turnoLabel = 'Diurno (08h às 17h)',
}: RelogioDigitalProps) {
  const [horarioAtual, setHorarioAtual] = useState(() =>
    dayjs().format('HH:mm:ss')
  );
  const [dataAtual, setDataAtual] = useState(() =>
    dayjs().format('DD/MM/YYYY')
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const agora = dayjs();
      setHorarioAtual(agora.format('HH:mm:ss'));
      setDataAtual(agora.format('DD/MM/YYYY'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.clockTopRow}>
        <View style={styles.dateBadge}>
          <Feather name="calendar" size={12} color={AntigravityPalette.slate} />
          <Text style={styles.dateBadgeText}>{dataAtual}</Text>
        </View>
        <Text style={styles.shiftHint} numberOfLines={1}>
          {turnoLabel}
        </Text>
      </View>

      <Text style={styles.clockDigits}>{horarioAtual}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  clockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.canvas,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  shiftHint: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '500',
    color: AntigravityPalette.muted,
  },
  clockDigits: {
    fontSize: 42,
    fontWeight: '700',
    color: AntigravityPalette.obsidian,
    textAlign: 'center',
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
});
