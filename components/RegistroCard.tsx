import { AntigravityPalette, Radii } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
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
    return {
      bg: AntigravityPalette.emeraldTint,
      text: AntigravityPalette.emerald,
    };
  }
  if (cat.includes('extra') || cat.includes('visita')) {
    return { bg: AntigravityPalette.amberTint, text: '#B45309' };
  }
  if (cat.includes('saída')) {
    return {
      bg: AntigravityPalette.coralTint,
      text: AntigravityPalette.coralRed,
    };
  }
  return {
    bg: AntigravityPalette.blueTint,
    text: AntigravityPalette.cobaltBlue,
  };
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
      activeOpacity={0.76}
      onPress={onPress}
      style={[
        styles.card,
        modoCompacto ? styles.cardCompacto : styles.cardNormal,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.titulo} numberOfLines={1}>
            {titulo}
          </Text>
          {modoCompacto && (
            <Text style={styles.compactDate} numberOfLines={1}>
              {dataHora}
            </Text>
          )}
        </View>

        <View style={styles.rightHeader}>
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.text }]}>
              {categoria}
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={16}
            color={AntigravityPalette.muted}
          />
        </View>
      </View>

      {!modoCompacto && (
        <View style={styles.body}>
          <View style={styles.metaLine}>
            <Feather
              name="clock"
              size={13}
              color={AntigravityPalette.slate}
            />
            <Text style={styles.dataHora}>{dataHora}</Text>
          </View>

          {localizacao ? (
            <View style={styles.metaLine}>
              <Feather
                name="map-pin"
                size={13}
                color={AntigravityPalette.muted}
              />
              <Text style={styles.localizacao} numberOfLines={1}>
                {localizacao}
              </Text>
            </View>
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
              <Feather
                name={sincronizadoApi ? 'check' : 'smartphone'}
                size={11}
                color={
                  sincronizadoApi
                    ? AntigravityPalette.emerald
                    : AntigravityPalette.slate
                }
              />
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
                {sincronizadoApi ? 'Sincronizado' : 'Salvo no aparelho'}
              </Text>
            </View>

            {temFoto && (
              <View style={styles.metaPill}>
                <Feather
                  name="camera"
                  size={11}
                  color={AntigravityPalette.obsidian}
                />
                <Text style={styles.metaPillText}>Foto anexada</Text>
              </View>
            )}

            {temAnexo && (
              <View style={styles.metaPill}>
                <Feather
                  name="file-text"
                  size={11}
                  color={AntigravityPalette.obsidian}
                />
                <Text style={styles.metaPillText}>Documento</Text>
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
    backgroundColor: AntigravityPalette.canvas,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    marginBottom: 10,
  },
  cardNormal: {
    padding: 16,
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
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.2,
  },
  compactDate: {
    fontSize: 12,
    color: AntigravityPalette.muted,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radii.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    marginTop: 10,
    gap: 6,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dataHora: {
    fontSize: 13,
    color: AntigravityPalette.slate,
    fontWeight: '500',
  },
  localizacao: {
    flex: 1,
    fontSize: 13,
    color: AntigravityPalette.muted,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AntigravityPalette.surfaceAlt,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: AntigravityPalette.obsidian,
  },
});
