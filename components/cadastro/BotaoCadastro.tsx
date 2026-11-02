import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface BotaoCadastroProps {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
}

export function BotaoCadastro({
  onPress,
  title = 'Cadastrar',
  disabled = false,
}: BotaoCadastroProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
