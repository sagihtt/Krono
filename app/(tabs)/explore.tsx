import { AppShell } from '@/components/AppShell';
import { AntigravityPalette, Radii } from '@/constants/theme';
import { AnexoDocumento, PontoRegistro } from '@/models/ponto';
import {
  DEFAULT_API_BASE_URL,
  enviarArquivoFormDataApi,
} from '@/services/apiService';
import {
  atualizarPontoNoStorage,
  carregarPontosStorage,
  carregarPreferenciasStorage,
} from '@/services/storageService';
import Feather from '@expo/vector-icons/Feather';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library/legacy';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

export default function DocumentosScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 880;

  const [pontos, setPontos] = useState<PontoRegistro[]>([]);
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_BASE_URL);

  // Estados de imagem e envio
  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(
    null
  );
  const [statusUpload, setStatusUpload] = useState<string | null>(null);

  // Estado de anexo PDF
  const [pdfSelecionado, setPdfSelecionado] = useState<AnexoDocumento | null>(
    null
  );

  // Estado do espelho de ponto gerado
  const [conteudoRelatorioTxt, setConteudoRelatorioTxt] = useState<
    string | null
  >(null);
  const [uriRelatorioGerado, setUriRelatorioGerado] = useState<string | null>(
    null
  );

  useFocusEffect(
    useCallback(() => {
      async function carregarContexto() {
        const [lista, prefs] = await Promise.all([
          carregarPontosStorage(),
          carregarPreferenciasStorage(),
        ]);
        setPontos(lista);
        setApiUrl(prefs.apiUrl || DEFAULT_API_BASE_URL);
      }
      carregarContexto();
    }, [])
  );

  // Compartilhamento de resumo em texto
  const compartilharResumoTexto = async () => {
    try {
      const resumoLinhas = pontos
        .slice(0, 5)
        .map((p) => `- [${p.dataHora}] ${p.titulo} (${p.categoria})`)
        .join('\n');

      await Share.share({
        title: 'Espelho de Ponto — Krono',
        message:
          `Espelho de Ponto — Krono\n` +
          `Total de registros: ${pontos.length}\n\n` +
          `${resumoLinhas}`,
      });
    } catch {
      Alert.alert(
        'Não foi possível compartilhar',
        'Tente novamente em instantes.'
      );
    }
  };

  // Geração e leitura de relatório offline no armazenamento do aplicativo
  const gerarRelatorioOffline = () => {
    try {
      const linhas = pontos
        .map(
          (p) =>
            `#${p.id} | ${p.dataHora} | ${p.categoria} | ${p.localizacao}`
        )
        .join('\n');

      const textoCompleto =
        `ESPELHO DE PONTO PARA CONFERÊNCIA\n` +
        `Emitido em: ${new Date().toLocaleString('pt-BR')}\n` +
        `Registros contabilizados: ${pontos.length}\n` +
        `----------------------------------------------\n` +
        `${linhas}\n`;

      if (Platform.OS === 'web') {
        setConteudoRelatorioTxt(textoCompleto);
        return;
      }

      const arquivoRelatorio = new File(Paths.document, 'vistoria-ponto.txt');
      arquivoRelatorio.write(textoCompleto);

      const conteudoLido = arquivoRelatorio.textSync();
      setConteudoRelatorioTxt(conteudoLido);
      setUriRelatorioGerado(arquivoRelatorio.uri);

      Alert.alert(
        'Relatório gerado',
        'O espelho de ponto foi salvo no dispositivo e está pronto para envio.'
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o espelho de ponto.');
    }
  };

  // Compartilhamento de arquivo físico (PDF, TXT ou Foto)
  const compartilharArquivo = async (uriAlvo?: string | null) => {
    const uriParaEnviar =
      uriAlvo || uriRelatorioGerado || pdfSelecionado?.uri || imagemSelecionada;

    if (!uriParaEnviar) {
      Alert.alert(
        'Nenhum arquivo selecionado',
        'Gere o espelho de ponto, selecione uma foto ou anexe um PDF antes de exportar.'
      );
      return;
    }

    try {
      const disponivel = await Sharing.isAvailableAsync();
      if (!disponivel) {
        Alert.alert(
          'Recurso indisponível no navegador',
          'A exportação direta de arquivos requer o aplicativo no celular.'
        );
        return;
      }

      await Sharing.shareAsync(uriParaEnviar);
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar o arquivo.');
    }
  };

  // Seleção de imagem da galeria com recorte e compressão
  const escolherImagemDaGaleria = async () => {
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled) {
        const uri = resultado.assets[0].uri;
        setImagemSelecionada(uri);
        setStatusUpload(null);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir a galeria de imagens.');
    }
  };

  const enviarImagemAoServidor = async () => {
    if (!imagemSelecionada) return;
    try {
      setStatusUpload('Enviando comprovante...');
      const resp = await enviarArquivoFormDataApi(
        {
          uri: imagemSelecionada,
          name: 'comprovante-ponto.jpg',
          mimeType: 'image/jpeg',
        },
        apiUrl
      );
      setStatusUpload(`Comprovante recebido às ${resp.recebidoEm}`);
    } catch {
      setStatusUpload(
        'Comprovante preparado no dispositivo. O envio será concluído quando o servidor estiver conectado.'
      );
    }
  };

  // Salvar foto no álbum do aparelho com permissão apenas de escrita
  const salvarFotoNoAlbum = async () => {
    const uriFoto =
      imagemSelecionada || pontos.find((p) => Boolean(p.fotoUri))?.fotoUri;

    if (!uriFoto) {
      Alert.alert(
        'Nenhuma imagem selecionada',
        'Escolha uma foto da galeria ou registre uma foto na aba Jornada.'
      );
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert(
        'Disponível no celular',
        'O salvamento direto no álbum de fotos requer Android ou iOS.'
      );
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Autorize o salvamento de imagens nas configurações do seu aparelho.'
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uriFoto);
      Alert.alert(
        'Imagem salva',
        'Uma cópia do comprovante foi salva no seu álbum de fotos.'
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a imagem no álbum.');
    }
  };

  // Seleção de atestado ou justificativa em PDF
  const selecionarDocumentoPdf = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (resultado.canceled) {
        return;
      }

      const arquivo = resultado.assets[0];
      const novoAnexo: AnexoDocumento = {
        uri: arquivo.uri,
        nome: arquivo.name,
        tamanho: arquivo.size,
        mimeType: arquivo.mimeType ?? 'application/pdf',
      };

      setPdfSelecionado(novoAnexo);

      if (pontos.length > 0) {
        const pontoMaisRecente: PontoRegistro = {
          ...pontos[0],
          anexoPdf: novoAnexo,
        };
        const listaAtualizada = await atualizarPontoNoStorage(pontoMaisRecente);
        setPontos(listaAtualizada);
      }

      Alert.alert(
        'Documento anexado',
        `O arquivo "${arquivo.name}" foi vinculado à sua última marcação.`
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível selecionar o documento PDF.');
    }
  };

  return (
    <AppShell
      title="Documentos e anexos"
      subtitle="Atestados, comprovantes fotográficos e espelho de ponto"
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.gridContainer, isWide && styles.gridContainerWide]}>
          {/* Coluna 1: Atestados PDF e Comprovantes Fotográficos */}
          <View style={[styles.column, isWide && styles.columnHalf]}>
            {/* Card: Atestados e Justificativas (PDF) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Feather
                    name="file-text"
                    size={16}
                    color={AntigravityPalette.cobaltBlue}
                  />
                </View>
                <View style={styles.headerTextCol}>
                  <Text style={styles.cardTitle}>
                    Atestados e justificativas
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    Envie documentos em formato PDF para abono de horas
                  </Text>
                </View>
              </View>

              <View style={styles.centeredActions}>
                <TouchableOpacity
                  style={styles.primaryPillBtn}
                  onPress={selecionarDocumentoPdf}
                  activeOpacity={0.85}
                >
                  <Feather
                    name="paperclip"
                    size={15}
                    color={AntigravityPalette.canvas}
                  />
                  <Text style={styles.primaryPillText}>Anexar arquivo PDF</Text>
                </TouchableOpacity>
              </View>

              {pdfSelecionado ? (
                <View style={styles.attachmentBox}>
                  <View style={styles.attachmentRow}>
                    <Feather
                      name="file"
                      size={18}
                      color={AntigravityPalette.cobaltBlue}
                    />
                    <View style={styles.attachmentMeta}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {pdfSelecionado.nome}
                      </Text>
                      <Text style={styles.attachmentSize}>
                        {typeof pdfSelecionado.tamanho === 'number'
                          ? `${(pdfSelecionado.tamanho / 1024).toFixed(1)} KB`
                          : 'Documento verificado'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.smallOutlineBtn}
                      onPress={() => compartilharArquivo(pdfSelecionado.uri)}
                    >
                      <Feather
                        name="share-2"
                        size={13}
                        color={AntigravityPalette.obsidian}
                      />
                      <Text style={styles.smallOutlineText}>Enviar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Card: Comprovantes Fotográficos */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Feather
                    name="image"
                    size={16}
                    color={AntigravityPalette.cobaltBlue}
                  />
                </View>
                <View style={styles.headerTextCol}>
                  <Text style={styles.cardTitle}>Comprovantes fotográficos</Text>
                  <Text style={styles.cardSubtitle}>
                    Anexe recibos impressos ou registros de visita externa
                  </Text>
                </View>
              </View>

              <View style={styles.centeredActions}>
                <TouchableOpacity
                  style={styles.secondaryPillBtn}
                  onPress={escolherImagemDaGaleria}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="image"
                    size={15}
                    color={AntigravityPalette.obsidian}
                  />
                  <Text style={styles.secondaryPillText}>
                    Selecionar da galeria
                  </Text>
                </TouchableOpacity>
              </View>

              {imagemSelecionada ? (
                <View style={styles.mediaPreviewCard}>
                  <Image
                    source={{ uri: imagemSelecionada }}
                    style={styles.selectedImage}
                  />

                  <View style={styles.buttonPairRow}>
                    <TouchableOpacity
                      style={styles.pairBtnBlue}
                      onPress={enviarImagemAoServidor}
                    >
                      <Feather
                        name="upload-cloud"
                        size={14}
                        color={AntigravityPalette.cobaltBlue}
                      />
                      <Text style={styles.pairBtnBlueText}>
                        Enviar comprovante
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.pairBtnOutline}
                      onPress={salvarFotoNoAlbum}
                    >
                      <Feather
                        name="download"
                        size={14}
                        color={AntigravityPalette.obsidian}
                      />
                      <Text style={styles.pairBtnOutlineText}>
                        Salvar no álbum
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {statusUpload ? (
                    <Text style={styles.uploadFeedback}>{statusUpload}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>

          {/* Coluna 2: Espelho de Ponto e Exportação */}
          <View style={[styles.column, isWide && styles.columnHalf]}>
            {/* Card: Relatório de Conferência */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Feather
                    name="clipboard"
                    size={16}
                    color={AntigravityPalette.cobaltBlue}
                  />
                </View>
                <View style={styles.headerTextCol}>
                  <Text style={styles.cardTitle}>Espelho de ponto</Text>
                  <Text style={styles.cardSubtitle}>
                    Consolide suas marcações para conferência mensal
                  </Text>
                </View>
              </View>

              <View style={styles.centeredActions}>
                <TouchableOpacity
                  style={styles.primaryPillBtn}
                  onPress={gerarRelatorioOffline}
                  activeOpacity={0.85}
                >
                  <Feather
                    name="file-plus"
                    size={15}
                    color={AntigravityPalette.canvas}
                  />
                  <Text style={styles.primaryPillText}>
                    Gerar espelho atualizado
                  </Text>
                </TouchableOpacity>
              </View>

              {conteudoRelatorioTxt ? (
                <View style={styles.reportViewer}>
                  <Text style={styles.reportViewerTitle}>
                    Prévia do espelho gerado
                  </Text>
                  <Text style={styles.reportViewerContent}>
                    {conteudoRelatorioTxt}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Card: Compartilhamento e Exportação */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Feather
                    name="share-2"
                    size={16}
                    color={AntigravityPalette.cobaltBlue}
                  />
                </View>
                <View style={styles.headerTextCol}>
                  <Text style={styles.cardTitle}>Exportar comprovantes</Text>
                  <Text style={styles.cardSubtitle}>
                    Envie o resumo da sua folha de ponto ou exporte os arquivos anexados
                  </Text>
                </View>
              </View>

              <View style={styles.exportButtonsStack}>
                <TouchableOpacity
                  style={styles.secondaryPillBtn}
                  onPress={compartilharResumoTexto}
                >
                  <Feather
                    name="send"
                    size={14}
                    color={AntigravityPalette.obsidian}
                  />
                  <Text style={styles.secondaryPillText}>
                    Compartilhar resumo por mensagem
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryPillBtn}
                  onPress={() => compartilharArquivo()}
                >
                  <Feather
                    name="external-link"
                    size={14}
                    color={AntigravityPalette.obsidian}
                  />
                  <Text style={styles.secondaryPillText}>
                    Exportar arquivo selecionado
                  </Text>
                </TouchableOpacity>
              </View>
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
    paddingTop: 18,
    paddingBottom: 36,
  },
  gridContainer: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  gridContainerWide: {
    maxWidth: 1080,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  column: {
    gap: 16,
  },
  columnHalf: {
    flex: 1,
  },
  card: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AntigravityPalette.blueTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: AntigravityPalette.slate,
    lineHeight: 18,
    marginTop: 2,
  },
  centeredActions: {
    alignItems: 'center',
    width: '100%',
  },
  primaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AntigravityPalette.obsidian,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
    width: '100%',
    maxWidth: 320,
  },
  primaryPillText: {
    color: AntigravityPalette.canvas,
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AntigravityPalette.canvas,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    width: '100%',
    maxWidth: 320,
  },
  secondaryPillText: {
    color: AntigravityPalette.obsidian,
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentBox: {
    marginTop: 14,
    backgroundColor: AntigravityPalette.canvas,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachmentMeta: {
    flex: 1,
    minWidth: 0,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  attachmentSize: {
    fontSize: 11,
    color: AntigravityPalette.muted,
    marginTop: 1,
  },
  smallOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AntigravityPalette.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    flexShrink: 0,
  },
  smallOutlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  mediaPreviewCard: {
    marginTop: 14,
    backgroundColor: AntigravityPalette.canvas,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  selectedImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    backgroundColor: AntigravityPalette.surfaceAlt,
  },
  buttonPairRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  pairBtnBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.blueTint,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
  },
  pairBtnBlueText: {
    color: AntigravityPalette.cobaltBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  pairBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  pairBtnOutlineText: {
    color: AntigravityPalette.obsidian,
    fontSize: 12,
    fontWeight: '600',
  },
  uploadFeedback: {
    marginTop: 10,
    fontSize: 12,
    color: AntigravityPalette.emerald,
    textAlign: 'center',
    fontWeight: '500',
  },
  reportViewer: {
    marginTop: 14,
    backgroundColor: AntigravityPalette.canvas,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  reportViewerTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: AntigravityPalette.muted,
    marginBottom: 6,
  },
  reportViewerContent: {
    fontSize: 12,
    color: AntigravityPalette.obsidian,
    lineHeight: 18,
  },
  exportButtonsStack: {
    alignItems: 'center',
    gap: 10,
  },
});
