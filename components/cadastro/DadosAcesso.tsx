import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FormInput } from './FormInput';

interface DadosAcessoProps {
  senha: string;
  onChangeSenha: (text: string) => void;
  confirmarSenha: string;
  onChangeConfirmarSenha: (text: string) => void;
}

export function DadosAcesso({
  senha,
  onChangeSenha,
  confirmarSenha,
  onChangeConfirmarSenha,
}: DadosAcessoProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informações de Acesso</Text>

      <FormInput
        label="Senha"
        placeholder="Digite sua senha"
        secureTextEntry={true}
        maxLength={32}
        value={senha}
        onChangeText={onChangeSenha}
      />
      <FormInput
        label="Confirmação de Senha"
        placeholder="Confirme sua senha"
        secureTextEntry={true}
        maxLength={32}
        value={confirmarSenha}
        onChangeText={onChangeConfirmarSenha}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
  },
});
