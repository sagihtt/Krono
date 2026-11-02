import { AntigravityPalette, Radii } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type RegistroCardProps = {
  titulo: string;
  categoria: string;
  dataHora: string;
  localizacao?: string;
  temFoto?: boolean;
  temAnexo?: boolean;
  sincronizadoApi?: boolean;
  modoCompacto?: boolean;
  onPress?: () => void;
};

function getBadgeStyle(categoria: string) {
  const cat = categoria.toLowerCase();
  if (cat.includes('entrada') || cat.includes('retorno')) {
    return { bg: AntigravityPalette.emeraldTint, text: AntigravityPalette.emerald };
  }
  if (cat.includes('extra') || cat.includes('visita')) {
    return { bg: AntigravityPalette.amberTint, text: '#B45309' };
  }
  if (cat.includes('saída')) {
    return { bg: AntigravityPalette.coralTint, text: AntigravityPalette.coralRed };
  }
  return { bg: AntigravityPalette.blueTint, text: AntigravityPalette.cobaltBlue };
}

export const RegistroCard = React.memo(function RegistroCard({
  titulo,
  categoria,
  dataHora,
  localizacao,
  temFoto = false,
  temAnexo = false,
  sincronizadoApi = false,
  modoCompacto = false,
  onPress,
}: RegistroCardProps) {
  const badgeStyle = getBadgeStyle(categoria);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      style={[
        styles.card,
        modoCompacto ? styles.cardCompacto : styles.cardNormal,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
          <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
            {categoria}
          </Text>
        </View>
      </View>

      {!modoCompacto && (
        <View style={styles.body}>
          <Text style={styles.dataHora}>⏱ {dataHora}</Text>
          {localizacao ? (
            <Text style={styles.localizacao} numberOfLines={1}>
              📍 {localizacao}
            </Text>
          ) : null}

          <View style={styles.pillsRow}>
            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor: sincronizadoApi
                    ? AntigravityPalette.emeraldTint
                    : AntigravityPalette.surfaceAlt,
                },
              ]}
            >
              <Text
                style={[
                  styles.metaPillText,
                  {
                    color: sincronizadoApi
                      ? AntigravityPalette.emerald
                      : AntigravityPalette.slate,
                  },
                ]}
              >
                {sincronizadoApi ? '● API Sync' : '○ Local Storage'}
              </Text>
            </View>

            {temFoto && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>📷 Foto</Text>
              </View>
            )}

            {temAnexo && (
              <View style={styles.metaPill}>
                <Text style={styles.metaPillText}>📄 PDF</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: Radii.bento,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    marginBottom: 12,
  },
  cardNormal: {
    padding: 18,
  },
  cardCompacto: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  titulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  body: {
    marginTop: 10,
    gap: 4,
  },
  dataHora: {
    fontSize: 13,
    color: AntigravityPalette.slate,
    fontWeight: '500',
  },
  localizacao: {
    fontSize: 13,
    color: AntigravityPalette.muted,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  metaPill: {
    backgroundColor: AntigravityPalette.surfaceAlt,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
});
