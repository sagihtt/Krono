import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FormInput } from './FormInput';
import { maskCPF, maskPhone, maskDate } from '@/utils/masks';

interface DadosPessoaisProps {
  nome: string;
  onChangeNome: (text: string) => void;
  onFocusNome?: () => void;
  onBlurNome?: () => void;
  onSubmitEditingNome?: () => void;
  cpf: string;
  onChangeCpf: (text: string) => void;
  email: string;
  onChangeEmail: (text: string) => void;
  telefone: string;
  onChangeTelefone: (text: string) => void;
  dataNascimento: string;
  onChangeDataNascimento: (text: string) => void;
}

export function DadosPessoais({
  nome,
  onChangeNome,
  onFocusNome,
  onBlurNome,
  onSubmitEditingNome,
  cpf,
  onChangeCpf,
  email,
  onChangeEmail,
  telefone,
  onChangeTelefone,
  dataNascimento,
  onChangeDataNascimento,
}: DadosPessoaisProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informações Pessoais</Text>

      <FormInput
        label="Nome Completo"
        placeholder="Digite seu nome completo"
        value={nome}
        onChangeText={onChangeNome}
        onFocus={onFocusNome}
        onBlur={onBlurNome}
        onSubmitEditing={onSubmitEditingNome}
        returnKeyType="done"
      />
      <FormInput
        label="CPF"
        placeholder="000.000.000-00"
        keyboardType="numeric"
        maxLength={14}
        value={cpf}
        onChangeText={(text) => onChangeCpf(maskCPF(text))}
      />
      <FormInput
        label="E-mail"
        placeholder="exemplo@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={onChangeEmail}
      />
      <FormInput
        label="Telefone"
        placeholder="(61) 98888-7777"
        keyboardType="phone-pad"
        maxLength={15}
        value={telefone}
        onChangeText={(text) => onChangeTelefone(maskPhone(text))}
      />
      <FormInput
        label="Data de Nascimento"
        placeholder="DD/MM/AAAA"
        keyboardType="numeric"
        maxLength={10}
        value={dataNascimento}
        onChangeText={(text) => onChangeDataNascimento(maskDate(text))}
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
