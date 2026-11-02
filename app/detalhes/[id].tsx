import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PONTOS_INICIAIS } from '@/constants/pontosMock';

export default function DetalhesScreen() {
  // =============================================================
  // ETAPA 10: RECUPERAÇÃO DE PARÂMETRO COM useLocalSearchParams
  // O Expo Router extrai o parâmetro dinâmico '[id]' da URL
  // =============================================================
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // =============================================================
  // ETAPA 11: LOCALIZAR O ITEM NO PRÓPRIO ARRAY DE DADOS
  // =============================================================
  const ponto = PONTOS_INICIAIS.find((item) => item.id === id);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.topo}>Detalhes do Registro de Ponto</Text>

        {/* Exibição explícita do ID exigida pelo roteiro */}
        <Text style={styles.idDestaque}>ID selecionado: {id}</Text>

        {ponto ? (
          <View style={styles.infoArea}>
            <Text style={styles.titulo}>{ponto.titulo}</Text>

            <Text style={styles.label}>Categoria / Tipo:</Text>
            <Text style={styles.valor}>{ponto.categoria}</Text>

            <Text style={styles.label}>Data e Horário:</Text>
            <Text style={styles.valor}>{ponto.dataHora}</Text>

            <Text style={styles.label}>Localização:</Text>
            <Text style={styles.valor}>{ponto.localizacao}</Text>

            <Text style={styles.label}>Coordenadas:</Text>
            <Text style={styles.valor}>
              Lat: {ponto.latitude} | Lon: {ponto.longitude}
            </Text>

            <Text style={styles.label}>Observação:</Text>
            <Text style={styles.valor}>{ponto.observacao}</Text>
          </View>
        ) : (
          <Text style={styles.alerta}>Registro não encontrado no array local.</Text>
        )}

        {/* ============================================================= */}
        {/* ETAPA 12: NAVEGAÇÃO DE RETORNO COM router.back()              */}
        {/* O Expo Router desempilha a tela atual e retorna à anterior    */}
        {/* ============================================================= */}
        <View style={styles.botaoVoltar}>
          <Button
            title="Voltar para a Lista"
            onPress={() => router.back()}
            color="#0a7ea4"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  idDestaque: {
    fontSize: 14,
    color: '#0284c7',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  infoArea: {
    gap: 6,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4b5563',
    marginTop: 4,
  },
  valor: {
    fontSize: 14,
    color: '#1f2937',
  },
  alerta: {
    color: '#dc2626',
    marginVertical: 12,
    textAlign: 'center',
  },
  botaoVoltar: {
    marginTop: 10,
  },
});
