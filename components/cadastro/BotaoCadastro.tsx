import { AntigravityPalette, Radii } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface BotaoCadastroProps {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
}

export function BotaoCadastro({
  onPress,
  title = 'Salvar Perfil',
  disabled = false,
}: BotaoCadastroProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    backgroundColor: AntigravityPalette.obsidian,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: AntigravityPalette.muted,
  },
  buttonText: {
    color: AntigravityPalette.canvas,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
