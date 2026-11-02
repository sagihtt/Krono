import { AntigravityPalette, Radii } from '@/constants/theme';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

interface FormInputProps extends TextInputProps {
  label: string;
}

export function FormInput({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  onSubmitEditing,
  style,
  ...rest
}: FormInputProps) {
  const [focado, setFocado] = React.useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focado && styles.inputFocado,
          style,
        ]}
        placeholderTextColor={AntigravityPalette.muted}
        value={value}
        onChangeText={onChangeText}
        onFocus={(e) => {
          setFocado(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          onBlur?.(e);
        }}
        onSubmitEditing={onSubmitEditing}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    backgroundColor: AntigravityPalette.canvas,
    fontSize: 15,
    color: AntigravityPalette.obsidian,
  },
  inputFocado: {
    borderColor: AntigravityPalette.electricBlue,
    borderWidth: 1.5,
    backgroundColor: AntigravityPalette.blueTint,
  },
});
