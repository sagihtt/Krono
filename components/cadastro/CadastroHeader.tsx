import { AntigravityPalette, Radii } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CadastroHeaderProps {
  title?: string;
  subtitle?: string;
}

export function CadastroHeader({
  title = 'Perfil & Preferências',
  subtitle = 'Gerencie seus dados de colaborador e persistência no dispositivo',
}: CadastroHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.pillTag}>
        <Text style={styles.pillTagText}>✦ IDENTIDADE & PERSISTÊNCIA</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
    alignItems: 'flex-start',
  },
  pillTag: {
    backgroundColor: AntigravityPalette.obsidian,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    marginBottom: 10,
  },
  pillTagText: {
    color: AntigravityPalette.canvas,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: AntigravityPalette.slate,
    lineHeight: 20,
  },
});
