import { AntigravityHeader } from '@/components/AntigravityHeader';
import { BotaoPress } from '@/components/BotaoPress';
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
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
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
  View,
} from 'react-native';

export default function RecursosScreen() {
  const [pontos, setPontos] = useState<PontoRegistro[]>([]);
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_BASE_URL);

  // Aula 21: Estados de Imagem (expo-image-picker) + Upload FormData
  const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(
    null
  );
  const [statusUpload, setStatusUpload] = useState<string | null>(null);

  // Aula 21: Estados de Documento PDF (expo-document-picker)
  const [pdfSelecionado, setPdfSelecionado] = useState<AnexoDocumento | null>(
    null
  );

  // Aula 21: Estados de Sistema de Arquivos (expo-file-system: File & Paths)
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

  // ============================================================================
  // 1. SHARE NATIVO (react-native): Compartilhamento de textos e links
  // ============================================================================
  const compartilharResumoTextoNativo = async () => {
    try {
      const resumoLinhas = pontos
        .slice(0, 5)
        .map((p) => `• [${p.dataHora}] ${p.titulo} (${p.categoria})`)
        .join('\n');

      const resultado = await Share.share({
        title: 'Espelho de Ponto — Google Antigravity Chrono',
        message:
          `✦ Google Antigravity Chrono — Espelho de Ponto\n` +
          `Total de registros: ${pontos.length}\n\n` +
          `${resumoLinhas}\n\n` +
          `Portal: https://antigravity.google/`,
      });

      if (resultado.action === Share.sharedAction) {
        console.log('Espelho de ponto compartilhado via Share nativo!');
      }
    } catch (erro) {
      console.error('Erro ao compartilhar texto:', erro);
      Alert.alert('Erro', 'Não foi possível abrir o menu de compartilhamento.');
    }
  };

  // ============================================================================
  // 2. EXPO-FILE-SYSTEM (File & Paths — SDK 54): Gerar e ler vistoria-ponto.txt
  // ============================================================================
  const gerarRelatorioOfflineTxt = () => {
    try {
      if (Platform.OS === 'web') {
        const simulado =
          `RELATÓRIO DE VISTORIA DE PONTO (MODO WEB)\n` +
          `Gerado em: ${new Date().toLocaleString('pt-BR')}\n` +
          `Registros auditados: ${pontos.length}\n` +
          `Último ponto: ${pontos[0]?.titulo ?? 'N/A'}`;
        setConteudoRelatorioTxt(simulado);
        Alert.alert(
          'Relatório Gerado (Web)',
          'No navegador web o sistema de arquivos nativo é simulado em memória.'
        );
        return;
      }

      // Criação do arquivo físico no Diretório Privado do App (Paths.document)
      const arquivoRelatorio = new File(Paths.document, 'vistoria-ponto.txt');
      const linhas = pontos
        .map(
          (p) =>
            `ID #${p.id} | ${p.dataHora} | ${p.categoria} | ${p.titulo} | GPS: ${p.latitude}, ${p.longitude}`
        )
        .join('\n');

      const textoCompleto =
        `=== RELATÓRIO OFFLINE DE VISTORIA DE PONTO ===\n` +
        `Data de Emissão: ${new Date().toLocaleString('pt-BR')}\n` +
        `Diretório Seguro: Paths.document (Privado do Aplicativo)\n` +
        `Total de Registros: ${pontos.length}\n` +
        `----------------------------------------------\n` +
        `${linhas}\n`;

      arquivoRelatorio.write(textoCompleto);

      // Leitura síncrona do arquivo físico recém-gravado
      const conteudoLido = arquivoRelatorio.textSync();
      setConteudoRelatorioTxt(conteudoLido);
      setUriRelatorioGerado(arquivoRelatorio.uri);

      Alert.alert(
        'Arquivo Físico Gravado',
        `Salvo em Paths.document/vistoria-ponto.txt com sucesso!`
      );
    } catch (erro) {
      console.error('Erro ao manipular arquivo no FileSystem:', erro);
      Alert.alert(
        'Erro FileSystem',
        'Não foi possível gravar o arquivo físico no diretório do app.'
      );
    }
  };

  // ============================================================================
  // 3. EXPO-SHARING: Compartilhar arquivo físico local (PDF, TXT ou Imagem)
  // ============================================================================
  const compartilharArquivoFisico = async (uriAlvo?: string | null) => {
    const uriParaEnviar =
      uriAlvo || uriRelatorioGerado || pdfSelecionado?.uri || imagemSelecionada;

    if (!uriParaEnviar) {
      Alert.alert(
        'Nenhum Arquivo Selecionado',
        'Gere primeiro o relatório TXT, selecione uma imagem ou escolha um PDF para compartilhar o arquivo físico.'
      );
      return;
    }

    try {
      const disponivel = await Sharing.isAvailableAsync();
      if (!disponivel) {
        Alert.alert(
          'Indisponível nesta Plataforma',
          'O compartilhamento de arquivos físicos (expo-sharing) não está disponível em navegadores Web.'
        );
        return;
      }

      await Sharing.shareAsync(uriParaEnviar);
    } catch (erro) {
      console.error('Erro no expo-sharing:', erro);
      Alert.alert('Erro', 'Falha ao compartilhar o arquivo físico.');
    }
  };

  // ============================================================================
  // 4. EXPO-IMAGE-PICKER + UPLOAD FORMDATA (Evitando Base64 na RAM)
  // ============================================================================
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
    } catch (erro) {
      console.error('Erro ao selecionar imagem:', erro);
      Alert.alert('Erro', 'Não foi possível abrir o seletor de imagens.');
    }
  };

  const enviarImagemViaFormData = async () => {
    if (!imagemSelecionada) return;
    try {
      setStatusUpload('Enviando via FormData (multipart/form-data)...');
      const resp = await enviarArquivoFormDataApi(
        {
          uri: imagemSelecionada,
          name: 'comprovante-ponto.jpg',
          mimeType: 'image/jpeg',
        },
        apiUrl
      );
      setStatusUpload(`✅ ${resp.status} (${resp.recebidoEm})`);
    } catch {
      setStatusUpload(
        '⚠️ Servidor Express offline. FormData preparado localmente (inicie node api/server.js para receber).'
      );
    }
  };

  // ============================================================================
  // 5. EXPO-MEDIA-LIBRARY: Salvar foto na Galeria Pública (Menor Privilégio)
  // ============================================================================
  const salvarFotoNaGaleriaPublica = async () => {
    const uriFoto =
      imagemSelecionada || pontos.find((p) => Boolean(p.fotoUri))?.fotoUri;

    if (!uriFoto) {
      Alert.alert(
        'Nenhuma Foto Disponível',
        'Selecione uma imagem acima ou capture uma foto na aba Ponto para exportar à galeria pública.'
      );
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert(
        'Modo Web',
        'A exportação para a galeria nativa (MediaLibrary) requer dispositivo Android ou iOS.'
      );
      return;
    }

    try {
      // Princípio do Menor Privilégio (Aula 21): writeOnly = true
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'Precisamos de permissão de escrita para salvar a foto no álbum público do aparelho.'
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uriFoto);
      Alert.alert(
        'Salvo na Galeria!',
        'A imagem foi exportada do diretório do app para a Galeria Pública (MediaLibrary).'
      );
    } catch (erro) {
      console.error('Erro ao salvar na MediaLibrary:', erro);
      Alert.alert('Erro', 'Não foi possível salvar a imagem na galeria.');
    }
  };

  // ============================================================================
  // 6. EXPO-DOCUMENT-PICKER: Seleção de PDF e vínculo com Registro de Ponto
  // ============================================================================
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

      // Vincula automaticamente ao registro de ponto mais recente no AsyncStorage
      if (pontos.length > 0) {
        const pontoMaisRecente: PontoRegistro = {
          ...pontos[0],
          anexoPdf: novoAnexo,
        };
        const listaAtualizada = await atualizarPontoNoStorage(pontoMaisRecente);
        setPontos(listaAtualizada);
      }

      Alert.alert(
        'PDF Anexado',
        `Arquivo "${arquivo.name}" validado e vinculado ao último registro de ponto!`
      );
    } catch (erro) {
      console.error('Erro ao escolher PDF:', erro);
      Alert.alert('Erro', 'Não foi possível abrir o seletor de documentos PDF.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AntigravityHeader
        badgeText="✦ AULA 21 • ARQUIVOS & MÍDIA"
        title="Central de Arquivos e Dispositivo"
        subtitle="Compartilhamento nativo, seleção de mídia com privacidade, documentos PDF e ciclo de vida de arquivos."
      />

      {/* ================================================================== */}
      {/* MÓDULO 1: SHARE NATIVO VS EXPO-SHARING                             */}
      {/* ================================================================== */}
      <View style={styles.bentoCard}>
        <Text style={styles.eyebrow}>1. SHARE NATIVO & EXPO-SHARING</Text>
        <Text style={styles.sectionTitle}>
          Compartilhamento de Textos vs. Arquivos Físicos
        </Text>
        <Text style={styles.description}>
          Use a API nativa Share para enviar resumos em texto ou links, e o
          módulo expo-sharing para transferir arquivos físicos (.txt, .pdf,
          .jpg) para outros aplicativos.
        </Text>

        <BotaoPress
          titulo="📤 Compartilhar Resumo em Texto (Share Nativo)"
          variante="primary"
          onPress={compartilharResumoTextoNativo}
        />
        <BotaoPress
          titulo="📎 Compartilhar Arquivo Físico Local (expo-sharing)"
          variante="secondary"
          onPress={() => compartilharArquivoFisico()}
        />
      </View>

      {/* ================================================================== */}
      {/* MÓDULO 2: EXPO-IMAGE-PICKER + FORMDATA UPLOAD + MEDIA LIBRARY      */}
      {/* ================================================================== */}
      <View style={styles.bentoCard}>
        <Text style={styles.eyebrow}>
          2. EXPO-IMAGE-PICKER & MEDIA-LIBRARY
        </Text>
        <Text style={styles.sectionTitle}>
          Galeria com Privacidade e Upload FormData
        </Text>
        <Text style={styles.description}>
          O ImagePicker delega a escolha ao sistema operacional sem pedir acesso
          irrestrito às fotos pessoais. Para enviar ao backend Express, usamos
          FormData (multipart/form-data) em vez de Base64 para proteger a
          memória RAM.
        </Text>

        <BotaoPress
          titulo="🖼️ Escolher Foto da Galeria (Recorte 4:3 • Qualidade 0.8)"
          variante="blue"
          onPress={escolherImagemDaGaleria}
        />

        {imagemSelecionada ? (
          <View style={styles.mediaPreviewCard}>
            <Image
              source={{ uri: imagemSelecionada }}
              style={styles.selectedImage}
            />
            <Text style={styles.uriText} numberOfLines={1}>
              URI Cache: {imagemSelecionada}
            </Text>

            <View style={styles.inlineBtns}>
              <TouchableOpacity
                style={styles.pillBtnBlue}
                onPress={enviarImagemViaFormData}
              >
                <Text style={styles.pillBtnBlueText}>
                  ☁️ Upload FormData (POST /upload)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pillBtnDark}
                onPress={salvarFotoNaGaleriaPublica}
              >
                <Text style={styles.pillBtnDarkText}>
                  💾 Salvar na Galeria (writeOnly)
                </Text>
              </TouchableOpacity>
            </View>

            {statusUpload ? (
              <Text style={styles.uploadStatusText}>{statusUpload}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* ================================================================== */}
      {/* MÓDULO 3: EXPO-DOCUMENT-PICKER (PDF DE ATESTADO / JUSTIFICATIVA)   */}
      {/* ================================================================== */}
      <View style={styles.bentoCard}>
        <Text style={styles.eyebrow}>3. EXPO-DOCUMENT-PICKER</Text>
        <Text style={styles.sectionTitle}>
          Anexo de Justificativa ou Atestado (PDF)
        </Text>
        <Text style={styles.description}>
          Filtra exclusivamente arquivos application/pdf e copia para o diretório
          de cache para leitura imediata, anexando ao registro de ponto mais
          recente.
        </Text>

        <BotaoPress
          titulo="📄 Selecionar Documento PDF (getDocumentAsync)"
          variante="primary"
          onPress={selecionarDocumentoPdf}
        />

        {pdfSelecionado ? (
          <View style={styles.pdfMetaCard}>
            <Text style={styles.pdfTitle}>📄 {pdfSelecionado.nome}</Text>
            <Text style={styles.pdfDetail}>
              MIME Type: {pdfSelecionado.mimeType || 'application/pdf'}
            </Text>
            <Text style={styles.pdfDetail}>
              Tamanho:{' '}
              {typeof pdfSelecionado.tamanho === 'number'
                ? `${(pdfSelecionado.tamanho / 1024).toFixed(2)} KB (${pdfSelecionado.tamanho} bytes)`
                : 'Não informado pelo provedor de nuvem'}
            </Text>
            <Text style={styles.uriText} numberOfLines={1}>
              URI: {pdfSelecionado.uri}
            </Text>

            <TouchableOpacity
              style={[styles.pillBtnBlue, { marginTop: 10 }]}
              onPress={() => compartilharArquivoFisico(pdfSelecionado.uri)}
            >
              <Text style={styles.pillBtnBlueText}>
                📤 Compartilhar este PDF via expo-sharing
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* ================================================================== */}
      {/* MÓDULO 4: EXPO-FILE-SYSTEM (File & Paths) + 3 TERRITÓRIOS          */}
      {/* ================================================================== */}
      <View style={styles.bentoCard}>
        <Text style={styles.eyebrow}>
          4. EXPO-FILE-SYSTEM (FILE & PATHS — SDK 54)
        </Text>
        <Text style={styles.sectionTitle}>
          Relatório Físico Offline e os 3 Territórios
        </Text>
        <Text style={styles.description}>
          Gera um arquivo vistoria-ponto.txt diretamente em Paths.document
          (armazenamento privado persistente do aplicativo) e lê seu conteúdo
          com textSync().
        </Text>

        <BotaoPress
          titulo="📝 Gerar e Ler vistoria-ponto.txt (Paths.document)"
          variante="blue"
          onPress={gerarRelatorioOfflineTxt}
        />

        {conteudoRelatorioTxt ? (
          <View style={styles.consoleBox}>
            <Text style={styles.consoleTitle}>
              CONTEÚDO LIDO DE Paths.document/vistoria-ponto.txt:
            </Text>
            <Text style={styles.consoleText}>{conteudoRelatorioTxt}</Text>
          </View>
        ) : null}

        <View style={styles.territoriesGrid}>
          <View style={styles.territoryBox}>
            <Text style={styles.territoryBadge}>1. CACHE TEMPORÁRIO</Text>
            <Text style={styles.territoryText}>
              Destino inicial de Camera, ImagePicker e DocumentPicker. O sistema
              operacional pode limpar a qualquer momento; nunca salve a URI de
              cache como referência permanente no banco.
            </Text>
          </View>

          <View style={styles.territoryBox}>
            <Text style={styles.territoryBadge}>
              2. DIRETÓRIO DO APP (Paths.document)
            </Text>
            <Text style={styles.territoryText}>
              Armazenamento privado e persistente do aplicativo. Arquivos
              gravados aqui permanecem seguros offline até a desinstalação do
              app.
            </Text>
          </View>

          <View style={styles.territoryBox}>
            <Text style={styles.territoryBadge}>
              3. GALERIA PÚBLICA (MediaLibrary)
            </Text>
            <Text style={styles.territoryText}>
              Território compartilhado do usuário. Exige permissão explícita
              (requestPermissionsAsync) e persiste mesmo após desinstalar o app.
            </Text>
          </View>
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
    paddingTop: 52,
    paddingBottom: 40,
  },
  bentoCard: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: Radii.bento,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: AntigravityPalette.cobaltBlue,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: AntigravityPalette.slate,
    lineHeight: 19,
    marginBottom: 8,
  },
  mediaPreviewCard: {
    marginTop: 12,
    backgroundColor: AntigravityPalette.canvas,
    padding: 12,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  selectedImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    backgroundColor: AntigravityPalette.surfaceAlt,
  },
  uriText: {
    fontSize: 11,
    color: AntigravityPalette.muted,
    marginTop: 6,
  },
  inlineBtns: {
    marginTop: 10,
    gap: 8,
  },
  pillBtnBlue: {
    backgroundColor: AntigravityPalette.blueTint,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  pillBtnBlueText: {
    color: AntigravityPalette.cobaltBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  pillBtnDark: {
    backgroundColor: AntigravityPalette.obsidian,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  pillBtnDarkText: {
    color: AntigravityPalette.canvas,
    fontSize: 12,
    fontWeight: '700',
  },
  uploadStatusText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.emerald,
  },
  pdfMetaCard: {
    marginTop: 12,
    backgroundColor: AntigravityPalette.canvas,
    padding: 14,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    gap: 4,
  },
  pdfTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AntigravityPalette.obsidian,
  },
  pdfDetail: {
    fontSize: 12,
    color: AntigravityPalette.slate,
  },
  consoleBox: {
    marginTop: 12,
    backgroundColor: AntigravityPalette.obsidian,
    padding: 14,
    borderRadius: Radii.card,
  },
  consoleTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: AntigravityPalette.skyBlue,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  consoleText: {
    fontSize: 11,
    color: '#E5E8F0',
    lineHeight: 17,
  },
  territoriesGrid: {
    marginTop: 14,
    gap: 8,
  },
  territoryBox: {
    backgroundColor: AntigravityPalette.canvas,
    padding: 12,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  territoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: AntigravityPalette.obsidian,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  territoryText: {
    fontSize: 12,
    color: AntigravityPalette.slate,
    lineHeight: 17,
  },
});
