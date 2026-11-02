import { AppShell } from '@/components/AppShell';
import { PONTOS_INICIAIS } from '@/constants/pontosMock';
import { AntigravityPalette, Radii } from '@/constants/theme';
import { PontoRegistro } from '@/models/ponto';
import {
  atualizarPontoApi,
  buscarPontoPorIdApi,
  DEFAULT_API_BASE_URL,
  excluirPontoApi,
} from '@/services/apiService';
import {
  atualizarPontoNoStorage,
  buscarPontoStoragePorId,
  carregarPreferenciasStorage,
  excluirPontoDoStorage,
} from '@/services/storageService';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DetalhesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const pontoMockInicial =
    PONTOS_INICIAIS.find((item) => String(item.id) === String(id)) ?? null;

  const [ponto, setPonto] = useState<PontoRegistro | null>(pontoMockInicial);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modoEdicao, setModoEdicao] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_BASE_URL);

  const [tituloEdit, setTituloEdit] = useState<string>(
    pontoMockInicial?.titulo ?? ''
  );
  const [categoriaEdit, setCategoriaEdit] = useState<string>(
    pontoMockInicial?.categoria ?? ''
  );
  const [localizacaoEdit, setLocalizacaoEdit] = useState<string>(
    pontoMockInicial?.localizacao ?? ''
  );
  const [observacaoEdit, setObservacaoEdit] = useState<string>(
    pontoMockInicial?.observacao ?? ''
  );

  useEffect(() => {
    let ativo = true;
    async function carregarDetalhes() {
      if (!id) return;
      setCarregando(true);
      try {
        const prefs = await carregarPreferenciasStorage();
        const urlAtiva = prefs.apiUrl || DEFAULT_API_BASE_URL;
        if (ativo) setApiUrl(urlAtiva);

        let encontrado = await buscarPontoStoragePorId(String(id));

        try {
          const remoto = await buscarPontoPorIdApi(String(id), urlAtiva);
          if (remoto) {
            encontrado = { ...remoto, sincronizadoApi: true };
          }
        } catch {
          // Segue com registro salvo no dispositivo
        }

        if (ativo && encontrado) {
          setPonto(encontrado);
          setTituloEdit(encontrado.titulo);
          setCategoriaEdit(encontrado.categoria);
          setLocalizacaoEdit(encontrado.localizacao);
          setObservacaoEdit(encontrado.observacao);
        }
      } catch {
        // Silencioso
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarDetalhes();
    return () => {
      ativo = false;
    };
  }, [id]);

  const salvarAlteracoes = async () => {
    if (!ponto) return;
    if (!tituloEdit.trim() || !categoriaEdit.trim()) {
      Alert.alert(
        'Campos obrigatórios',
        'Informe a descrição e a categoria da marcação.'
      );
      return;
    }

    const atualizado: PontoRegistro = {
      ...ponto,
      titulo: tituloEdit.trim(),
      categoria: categoriaEdit.trim(),
      localizacao: localizacaoEdit.trim(),
      observacao: observacaoEdit.trim(),
    };

    try {
      let sincronizado = false;
      try {
        await atualizarPontoApi(String(ponto.id), atualizado, apiUrl);
        sincronizado = true;
      } catch {
        sincronizado = false;
      }

      const registroFinal = { ...atualizado, sincronizadoApi: sincronizado };
      await atualizarPontoNoStorage(registroFinal);
      setPonto(registroFinal);
      setModoEdicao(false);

      Alert.alert('Comprovante atualizado', 'As alterações foram salvas.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  const excluirRegistro = async () => {
    if (!ponto) return;

    try {
      try {
        await excluirPontoApi(String(ponto.id), apiUrl);
      } catch {
        // Segue com remoção local
      }
      await excluirPontoDoStorage(String(ponto.id));
      Alert.alert('Marcação removida', 'O registro foi excluído do histórico.');
      router.back();
    } catch {
      Alert.alert('Erro', 'Não foi possível remover o registro.');
    }
  };

  const compartilharComprovante = async () => {
    if (!ponto) return;
    try {
      await Share.share({
        title: `Comprovante de Ponto #${ponto.id}`,
        message:
          `Comprovante de Ponto — Krono\n` +
          `Código: #${ponto.id}\n` +
          `Descrição: ${ponto.titulo}\n` +
          `Tipo: ${ponto.categoria}\n` +
          `Horário: ${ponto.dataHora}\n` +
          `Unidade: ${ponto.localizacao}\n` +
          `Coordenadas: ${ponto.latitude}, ${ponto.longitude}\n` +
          `Observação: ${ponto.observacao}`,
      });
    } catch {
      // Silencioso
    }
  };

  return (
    <AppShell
      title="Comprovante de ponto"
      subtitle="Consulta e ajuste de marcação"
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.receiptCard}>
            <View style={styles.topRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>
                  ID selecionado: {id}
                </Text>
              </View>
              {carregando && (
                <ActivityIndicator
                  size="small"
                  color={AntigravityPalette.electricBlue}
                />
              )}
            </View>

            {ponto ? (
              <View style={styles.infoArea}>
                {!modoEdicao ? (
                  <>
                    <Text style={styles.titulo}>{ponto.titulo}</Text>

                    <View style={styles.metaGrid}>
                      <View style={styles.metaBox}>
                        <Text style={styles.label}>Categoria</Text>
                        <Text style={styles.valor}>{ponto.categoria}</Text>
                      </View>
                      <View style={styles.metaBox}>
                        <Text style={styles.label}>Data e horário</Text>
                        <Text style={styles.valor}>{ponto.dataHora}</Text>
                      </View>
                    </View>

                    <View style={styles.metaBoxAddress}>
                      <View style={styles.addressCol}>
                        <Text style={styles.label}>Endereço aproximado</Text>
                        <Text style={styles.valor}>{ponto.localizacao}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.mapBadgeBtn}
                        onPress={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${ponto.latitude},${ponto.longitude}`;
                          Linking.openURL(url).catch(() => {});
                        }}
                      >
                        <Feather
                          name="navigation"
                          size={12}
                          color={AntigravityPalette.cobaltBlue}
                        />
                        <Text style={styles.mapBadgeText}>Ver no mapa</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.metaBoxFull}>
                      <Text style={styles.label}>Observação</Text>
                      <Text style={styles.valor}>{ponto.observacao}</Text>
                    </View>

                    {ponto.fotoUri ? (
                      <View style={styles.metaBoxFull}>
                        <Text style={styles.label}>Registro fotográfico</Text>
                        <Image
                          source={{ uri: ponto.fotoUri }}
                          style={styles.fotoDetalhe}
                        />
                      </View>
                    ) : null}

                    {ponto.anexoPdf ? (
                      <View style={styles.metaBoxFull}>
                        <Text style={styles.label}>Documento vinculado</Text>
                        <View style={styles.pdfRow}>
                          <Feather
                            name="file-text"
                            size={15}
                            color={AntigravityPalette.cobaltBlue}
                          />
                          <Text style={styles.valor}>
                            {ponto.anexoPdf.nome}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.editForm}>
                    <Text style={styles.editHeader}>Ajustar informações</Text>

                    <Text style={styles.label}>Descrição</Text>
                    <TextInput
                      style={styles.input}
                      value={tituloEdit}
                      onChangeText={setTituloEdit}
                    />

                    <Text style={styles.label}>Categoria</Text>
                    <TextInput
                      style={styles.input}
                      value={categoriaEdit}
                      onChangeText={setCategoriaEdit}
                    />

                    <Text style={styles.label}>Localização</Text>
                    <TextInput
                      style={styles.input}
                      value={localizacaoEdit}
                      onChangeText={setLocalizacaoEdit}
                    />

                    <Text style={styles.label}>Observação</Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      value={observacaoEdit}
                      onChangeText={setObservacaoEdit}
                      multiline
                    />

                    <View style={styles.centeredButtonsRow}>
                      <TouchableOpacity
                        style={styles.savePillBtn}
                        onPress={salvarAlteracoes}
                      >
                        <Feather
                          name="check"
                          size={15}
                          color={AntigravityPalette.canvas}
                        />
                        <Text style={styles.savePillText}>
                          Salvar alterações
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelPillBtn}
                        onPress={() => setModoEdicao(false)}
                      >
                        <Feather
                          name="x"
                          size={15}
                          color={AntigravityPalette.obsidian}
                        />
                        <Text style={styles.cancelPillText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {!modoEdicao && (
                  <View style={styles.actionsSection}>
                    <View style={styles.centeredButtonsRow}>
                      <TouchableOpacity
                        style={styles.sharePillBtn}
                        onPress={compartilharComprovante}
                      >
                        <Feather
                          name="share-2"
                          size={14}
                          color={AntigravityPalette.obsidian}
                        />
                        <Text style={styles.sharePillText}>
                          Enviar comprovante
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editPillBtn}
                        onPress={() => setModoEdicao(true)}
                      >
                        <Feather
                          name="edit-3"
                          size={14}
                          color={AntigravityPalette.cobaltBlue}
                        />
                        <Text style={styles.editPillText}>Editar dados</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deletePillBtn}
                        onPress={excluirRegistro}
                      >
                        <Feather
                          name="trash-2"
                          size={14}
                          color={AntigravityPalette.coralRed}
                        />
                        <Text style={styles.deletePillText}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.alerta}>
                Comprovante não localizado no histórico.
              </Text>
            )}

            <View style={styles.backRow}>
              <TouchableOpacity
                style={styles.backPillBtn}
                onPress={() => router.back()}
              >
                <Feather
                  name="arrow-left"
                  size={15}
                  color={AntigravityPalette.canvas}
                />
                <Text style={styles.backPillText}>Voltar para o histórico</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 40,
  },
  container: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  receiptCard: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  codeBadge: {
    backgroundColor: AntigravityPalette.blueTint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  codeBadgeText: {
    fontSize: 12,
    color: AntigravityPalette.cobaltBlue,
    fontWeight: '600',
  },
  infoArea: {
    gap: 10,
    marginBottom: 18,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metaBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: AntigravityPalette.canvas,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  metaBoxFull: {
    backgroundColor: AntigravityPalette.canvas,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  metaBoxAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: AntigravityPalette.canvas,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  addressCol: {
    flex: 1,
    minWidth: 0,
  },
  mapBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AntigravityPalette.blueTint,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    flexShrink: 0,
  },
  mapBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.cobaltBlue,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: AntigravityPalette.muted,
    marginBottom: 4,
  },
  valor: {
    fontSize: 14,
    color: AntigravityPalette.obsidian,
    fontWeight: '500',
  },
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  fotoDetalhe: {
    width: '100%',
    height: 190,
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: AntigravityPalette.surfaceAlt,
  },
  editForm: {
    gap: 6,
  },
  editHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AntigravityPalette.canvas,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: AntigravityPalette.obsidian,
    marginBottom: 8,
  },
  inputMultiline: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  actionsSection: {
    marginTop: 8,
  },
  centeredButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6,
  },
  savePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.obsidian,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: Radii.pill,
  },
  savePillText: {
    color: AntigravityPalette.canvas,
    fontSize: 13,
    fontWeight: '600',
  },
  cancelPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.canvas,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  cancelPillText: {
    color: AntigravityPalette.obsidian,
    fontSize: 13,
    fontWeight: '500',
  },
  sharePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.canvas,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  sharePillText: {
    color: AntigravityPalette.obsidian,
    fontWeight: '500',
    fontSize: 13,
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.blueTint,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
  },
  editPillText: {
    color: AntigravityPalette.cobaltBlue,
    fontWeight: '600',
    fontSize: 13,
  },
  deletePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.coralTint,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
  },
  deletePillText: {
    color: AntigravityPalette.coralRed,
    fontWeight: '600',
    fontSize: 13,
  },
  alerta: {
    color: AntigravityPalette.coralRed,
    marginVertical: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  backRow: {
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
  },
  backPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AntigravityPalette.obsidian,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radii.pill,
    width: '100%',
    maxWidth: 320,
  },
  backPillText: {
    color: AntigravityPalette.canvas,
    fontSize: 13,
    fontWeight: '600',
  },
});
