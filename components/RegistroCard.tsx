import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type RegistroCardProps = {
  titulo: string;
  categoria: string;
  dataHora: string;
  modoCompacto?: boolean;
  onPress?: () => void;
};

// =============================================================
// ETAPA 4: COMPONENTE REUTILIZÁVEL PARA ITENS DA LISTA
// Recebe as informações do registro através de Props
// =============================================================
export function RegistroCard({
  titulo,
  categoria,
  dataHora,
  modoCompacto = false,
  onPress,
}: RegistroCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        modoCompacto ? styles.cardCompacto : styles.cardNormal,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.badge}>{categoria}</Text>
      </View>

      {!modoCompacto && (
        <Text style={styles.dataHora}>Horário: {dataHora}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  cardNormal: {
    padding: 16,
  },
  cardCompacto: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dataHora: {
    marginTop: 6,
    fontSize: 13,
    color: '#6b7280',
  },
});
