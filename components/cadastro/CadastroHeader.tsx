import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CadastroHeaderProps {
  title?: string;
  subtitle?: string;
}

export function CadastroHeader({
  title = 'Cadastro de Usuário',
  subtitle = 'Preencha as informações para registrar sua conta',
}: CadastroHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
  },
});
