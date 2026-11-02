import { AntigravityHeader } from '@/components/AntigravityHeader';
import { BotaoPress } from '@/components/BotaoPress';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DetalhesScreen() {
  // ============================================================================
  // ETAPA 10 (LAB 5): RECUPERAÇÃO DE PARÂMETRO COM useLocalSearchParams
  // ============================================================================
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Etapa 11 (Lab 5): Localizar o item inicialmente no array padrão e sincronizar com Storage/API
  const pontoMockInicial =
    PONTOS_INICIAIS.find((item) => String(item.id) === String(id)) ?? null;

  const [ponto, setPonto] = useState<PontoRegistro | null>(pontoMockInicial);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [modoEdicao, setModoEdicao] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_BASE_URL);

  // Estados de formulário para PUT /pontos/:id (Aula 18)
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

        // 1. Busca no AsyncStorage (suporta itens criados em runtime)
        let encontrado = await buscarPontoStoragePorId(String(id));

        // 2. Tenta buscar versão mais recente na API GET /pontos/:id (Aula 18)
        try {
          const remoto = await buscarPontoPorIdApi(String(id), urlAtiva);
          if (remoto) {
            encontrado = { ...remoto, sincronizadoApi: true };
          }
        } catch {
          // Segue com o registro local se o servidor Express estiver offline
        }

        if (ativo && encontrado) {
          setPonto(encontrado);
          setTituloEdit(encontrado.titulo);
          setCategoriaEdit(encontrado.categoria);
          setLocalizacaoEdit(encontrado.localizacao);
          setObservacaoEdit(encontrado.observacao);
        }
      } catch (erro) {
        console.error('Erro ao carregar detalhes do ponto:', erro);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarDetalhes();
    return () => {
      ativo = false;
    };
  }, [id]);

  // ============================================================================
  // AULA 18: UPDATE (PUT /pontos/:id) + PERSISTÊNCIA NO ASYNCSTORAGE
  // ============================================================================
  const salvarAlteracoesPut = async () => {
    if (!ponto) return;
    if (!tituloEdit.trim() || !categoriaEdit.trim()) {
      Alert.alert(
        'Erro 400 (Bad Request)',
        'Os campos Título e Categoria são obrigatórios.'
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

      Alert.alert(
        'Registro Atualizado',
        sincronizado
          ? 'Atualizado via PUT /pontos/:id (200 OK) e salvo no AsyncStorage!'
          : 'Atualizado localmente no AsyncStorage.'
      );
    } catch (erro) {
      console.error('Erro ao atualizar registro:', erro);
      Alert.alert('Erro', 'Não foi possível atualizar o registro.');
    }
  };

  // ============================================================================
  // AULA 18: DELETE (DELETE /pontos/:id) + REMOÇÃO DO ASYNCSTORAGE
  // ============================================================================
  const excluirRegistroDelete = async () => {
    if (!ponto) return;

    try {
      try {
        await excluirPontoApi(String(ponto.id), apiUrl);
      } catch {
        // Caso offline, remove do armazenamento local
      }
      await excluirPontoDoStorage(String(ponto.id));
      Alert.alert('Registro Excluído', 'O ponto foi removido com sucesso.');
      router.back();
    } catch (erro) {
      console.error('Erro ao excluir registro:', erro);
      Alert.alert('Erro', 'Não foi possível excluir o registro.');
    }
  };

  // ============================================================================
  // AULA 21: COMPARTILHAMENTO NATIVO DE TEXTO (Share API do React Native)
  // ============================================================================
  const compartilharComprovanteTexto = async () => {
    if (!ponto) return;
    try {
      await Share.share({
        title: `Comprovante de Ponto #${ponto.id}`,
        message:
          `✦ Google Antigravity Chrono — Comprovante de Ponto\n` +
          `ID: #${ponto.id}\n` +
          `Registro: ${ponto.titulo}\n` +
          `Categoria: ${ponto.categoria}\n` +
          `Data/Hora: ${ponto.dataHora}\n` +
          `Local: ${ponto.localizacao}\n` +
          `GPS: Lat ${ponto.latitude}, Lon ${ponto.longitude}\n` +
          `Observação: ${ponto.observacao}`,
      });
    } catch (erro) {
      console.error('Erro ao compartilhar comprovante:', erro);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AntigravityHeader
        badgeText={`✦ REGISTRO #${id}`}
        title="Inspeção e Edição de Ponto"
        subtitle="Rota dinâmica /detalhes/[id] integrada com PUT, DELETE e Share nativo."
      />

      <View style={styles.bentoCard}>
        <View style={styles.idRow}>
          <Text style={styles.idDestaque}>ID selecionado: {id}</Text>
          {carregando && (
            <ActivityIndicator size="small" color={AntigravityPalette.electricBlue} />
          )}
        </View>

        {ponto ? (
          <View style={styles.infoArea}>
            {!modoEdicao ? (
              <>
                <Text style={styles.titulo}>{ponto.titulo}</Text>

                <View style={styles.metaGrid}>
                  <View style={styles.metaBox}>
                    <Text style={styles.label}>CATEGORIA / TIPO</Text>
                    <Text style={styles.valor}>{ponto.categoria}</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.label}>DATA E HORÁRIO</Text>
                    <Text style={styles.valor}>{ponto.dataHora}</Text>
                  </View>
                </View>

                <View style={styles.metaBoxFull}>
                  <Text style={styles.label}>LOCALIZAÇÃO</Text>
                  <Text style={styles.valor}>{ponto.localizacao}</Text>
                </View>

                <View style={styles.metaBoxFull}>
                  <Text style={styles.label}>COORDENADAS GPS (AULA 20)</Text>
                  <Text style={styles.valor}>
                    Lat: {ponto.latitude} | Lon: {ponto.longitude}
                  </Text>
                </View>

                <View style={styles.metaBoxFull}>
                  <Text style={styles.label}>OBSERVAÇÃO</Text>
                  <Text style={styles.valor}>{ponto.observacao}</Text>
                </View>

                {ponto.fotoUri ? (
                  <View style={styles.metaBoxFull}>
                    <Text style={styles.label}>FOTO CAPTURADA (AULA 20)</Text>
                    <Image
                      source={{ uri: ponto.fotoUri }}
                      style={styles.fotoDetalhe}
                    />
                  </View>
                ) : null}

                {ponto.anexoPdf ? (
                  <View style={styles.metaBoxFull}>
                    <Text style={styles.label}>DOCUMENTO ANEXADO (AULA 21)</Text>
                    <Text style={styles.valor}>
                      📄 {ponto.anexoPdf.nome} (
                      {ponto.anexoPdf.tamanho
                        ? `${(ponto.anexoPdf.tamanho / 1024).toFixed(1)} KB`
                        : 'Tamanho N/A'}
                      )
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              /* Formulário de Edição PUT /pontos/:id (Aula 18) */
              <View style={styles.editForm}>
                <Text style={styles.editHeader}>
                  Editar Registro (PUT /pontos/{id})
                </Text>

                <Text style={styles.label}>TÍTULO DO REGISTRO</Text>
                <TextInput
                  style={styles.input}
                  value={tituloEdit}
                  onChangeText={setTituloEdit}
                />

                <Text style={styles.label}>CATEGORIA</Text>
                <TextInput
                  style={styles.input}
                  value={categoriaEdit}
                  onChangeText={setCategoriaEdit}
                />

                <Text style={styles.label}>LOCALIZAÇÃO</Text>
                <TextInput
                  style={styles.input}
                  value={localizacaoEdit}
                  onChangeText={setLocalizacaoEdit}
                />

                <Text style={styles.label}>OBSERVAÇÃO</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={observacaoEdit}
                  onChangeText={setObservacaoEdit}
                  multiline
                />

                <BotaoPress
                  titulo="Salvar Alterações (PUT 200 OK)"
                  variante="blue"
                  onPress={salvarAlteracoesPut}
                />
                <BotaoPress
                  titulo="Cancelar Edição"
                  variante="secondary"
                  onPress={() => setModoEdicao(false)}
                />
              </View>
            )}

            {/* Botões de Ação CRUD (Aula 18) e Compartilhamento (Aula 21) */}
            {!modoEdicao && (
              <View style={styles.actionsSection}>
                <TouchableOpacity
                  style={styles.sharePillBtn}
                  onPress={compartilharComprovanteTexto}
                >
                  <Text style={styles.sharePillBtnText}>
                    📤 Compartilhar Comprovante (Share Nativo)
                  </Text>
                </TouchableOpacity>

                <View style={styles.crudRow}>
                  <TouchableOpacity
                    style={styles.editPillBtn}
                    onPress={() => setModoEdicao(true)}
                  >
                    <Text style={styles.editPillBtnText}>
                      ✏️ Editar (PUT)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deletePillBtn}
                    onPress={excluirRegistroDelete}
                  >
                    <Text style={styles.deletePillBtnText}>
                      🗑️ Excluir (DELETE)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.alerta}>
            Registro não encontrado no armazenamento local ou na API.
          </Text>
        )}

        {/* ================================================================== */}
        {/* ETAPA 12 (LAB 5): NAVEGAÇÃO DE RETORNO COM router.back()           */}
        {/* ================================================================== */}
        <View style={styles.botaoVoltar}>
          <BotaoPress
            titulo="← Voltar para a Lista (router.back)"
            variante="primary"
            onPress={() => router.back()}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: AntigravityPalette.canvas,
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 40,
  },
  bentoCard: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: Radii.bento,
    padding: 20,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  idDestaque: {
    fontSize: 13,
    color: AntigravityPalette.cobaltBlue,
    fontWeight: '700',
    backgroundColor: AntigravityPalette.blueTint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  infoArea: {
    gap: 10,
    marginBottom: 16,
  },
  titulo: {
    fontSize: 20,
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
    backgroundColor: AntigravityPalette.canvas,
    padding: 12,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  metaBoxFull: {
    backgroundColor: AntigravityPalette.canvas,
    padding: 12,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: AntigravityPalette.muted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  valor: {
    fontSize: 14,
    color: AntigravityPalette.obsidian,
    fontWeight: '500',
  },
  fotoDetalhe: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginTop: 6,
    backgroundColor: AntigravityPalette.surfaceAlt,
  },
  editForm: {
    gap: 6,
  },
  editHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: AntigravityPalette.obsidian,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AntigravityPalette.canvas,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    borderRadius: Radii.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AntigravityPalette.obsidian,
    marginBottom: 8,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  actionsSection: {
    marginTop: 8,
    gap: 10,
  },
  sharePillBtn: {
    backgroundColor: AntigravityPalette.surfaceAlt,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sharePillBtnText: {
    color: AntigravityPalette.obsidian,
    fontWeight: '600',
    fontSize: 13,
  },
  crudRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editPillBtn: {
    flex: 1,
    backgroundColor: AntigravityPalette.blueTint,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editPillBtnText: {
    color: AntigravityPalette.cobaltBlue,
    fontWeight: '700',
    fontSize: 13,
  },
  deletePillBtn: {
    flex: 1,
    backgroundColor: AntigravityPalette.coralTint,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deletePillBtnText: {
    color: AntigravityPalette.coralRed,
    fontWeight: '700',
    fontSize: 13,
  },
  alerta: {
    color: AntigravityPalette.coralRed,
    marginVertical: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  botaoVoltar: {
    marginTop: 6,
  },
});
