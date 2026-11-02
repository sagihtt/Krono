import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TextInputProps,
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
        placeholderTextColor="#888"
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
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    fontSize: 15,
    color: '#11181C',
  },
  inputFocado: {
    borderColor: '#0a7ea4',
    borderWidth: 1.5,
    backgroundColor: '#f0f9ff',
  },
});
