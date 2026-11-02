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
      <BotaoCadastro onPress={onCadastrar} title="Cadastrar" />
      {onLimpar && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onLimpar}
          activeOpacity={0.7}
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
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  secondaryButtonText: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: '600',
  },
});
