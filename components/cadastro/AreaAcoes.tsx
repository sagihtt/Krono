import { AntigravityPalette, Radii } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BotaoCadastro } from './BotaoCadastro';

interface AreaAcoesProps {
  onCadastrar: () => void;
  onLimpar?: () => void;
}

export function AreaAcoes({ onCadastrar, onLimpar }: AreaAcoesProps) {
  return (
    <View style={styles.container}>
      <BotaoCadastro onPress={onCadastrar} title="Salvar no Dispositivo" />
      {onLimpar && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onLimpar}
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryButtonText}>Limpar Campos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 10,
  },
  secondaryButton: {
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AntigravityPalette.surfaceAlt,
  },
  secondaryButtonText: {
    color: AntigravityPalette.obsidian,
    fontSize: 15,
    fontWeight: '600',
  },
});
