import { AntigravityHeader } from '@/components/AntigravityHeader';
import { BotaoPress } from '@/components/BotaoPress';
import { RegistroCard } from '@/components/RegistroCard';
import { PONTOS_INICIAIS } from '@/constants/pontosMock';
import { AntigravityPalette, Radii } from '@/constants/theme';
import { PontoRegistro } from '@/models/ponto';
import {
  ClimaApiStatus,
  consultarStatusApi,
  criarPontoApi,
  DEFAULT_API_BASE_URL,
  listarPontosApi,
} from '@/services/apiService';
import {
  carregarPontosStorage,
  carregarPreferenciasStorage,
  salvarPontosStorage,
  salvarPreferenciasStorage,
} from '@/services/storageService';
import dayjs from 'dayjs';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CATEGORIAS_RAPIDAS = [
  'Entrada Regular',
  'Intervalo',
  'Retorno',
  'Saída Regular',
  'Hora Extra',
];

export default function HomeScreen() {
  // ============================================================================
  // AULA 20: PERMISSÕES E REFERÊNCIA DE CÂMERA (expo-camera)
  // ============================================================================
  const [permissaoCamera, pedirPermissaoCamera] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // ============================================================================
  // AULA 20: GEOLOCALIZAÇÃO E TRATAMENTO DE ERRO (expo-location)
  // ============================================================================
  const [localizacaoAtual, setLocalizacaoAtual] =
    useState<Location.LocationObject | null>(null);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
  const [buscandoGps, setBuscandoGps] = useState<boolean>(false);

  // ============================================================================
  // LABS 1 A 5 + AULAS 17, 18 E 19: LISTA DE PONTOS, MODO COMPACTO E API REST
  // ============================================================================
  const [pontos, setPontos] = useState<PontoRegistro[]>(PONTOS_INICIAIS);
  const [modoCompacto, setModoCompacto] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_BASE_URL);
  const [climaStatus, setClimaStatus] = useState<ClimaApiStatus | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(false);

  // Campos para novo registro (POST /pontos)
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string>('Entrada Regular');
  const [observacaoInput, setObservacaoInput] = useState<string>('');

  // Etapa 8, 9 e 14 (Lab 5): Navegação programática com useRouter()
  const router = useRouter();

  const sincronizarDados = useCallback(async () => {
    setCarregandoDados(true);
    try {
      const prefs = await carregarPreferenciasStorage();
      setModoCompacto(prefs.modoCompacto);
      const urlAtiva = prefs.apiUrl || DEFAULT_API_BASE_URL;
      setApiUrl(urlAtiva);

      // 1. Carrega do AsyncStorage primeiro (garante funcionamento offline imediato)
      const pontosLocais = await carregarPontosStorage();
      setPontos(pontosLocais);

      // 2. Tenta consultar a API Express (Aulas 17 e 18: GET /clima e GET /pontos)
      try {
        const [clima, pontosRemotos] = await Promise.all([
          consultarStatusApi(urlAtiva),
          listarPontosApi(urlAtiva),
        ]);
        setClimaStatus(clima);
        setApiOnline(true);

        if (Array.isArray(pontosRemotos) && pontosRemotos.length > 0) {
          setPontos(pontosRemotos);
          await salvarPontosStorage(pontosRemotos);
        }
      } catch {
        // Se o servidor Node/Express não estiver rodando no momento, opera em modo Offline (AsyncStorage)
        setApiOnline(false);
        setClimaStatus(null);
      }
    } catch (erro) {
      console.error('Erro ao sincronizar registros:', erro);
    } finally {
      setCarregandoDados(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      sincronizarDados();
    }, [sincronizarDados])
  );

  // ============================================================================
  // AULA 20 (PRÁTICA): CAPTURAR FOTO E EXIBIR PRÉ-VISUALIZAÇÃO ABAIXO DA LENTE
  // ============================================================================
  const tirarFotoComprovante = async () => {
    if (!permissaoCamera?.granted) {
      const resp = await pedirPermissaoCamera();
      if (!resp.granted) {
        Alert.alert(
          'Permissão Negada',
          'É necessário liberar o acesso à câmera nas configurações para fotografar o comprovante.'
        );
        return;
      }
    }

    if (cameraRef.current) {
      try {
        const foto = await cameraRef.current.takePictureAsync({
          quality: 0.75,
        });
        if (foto?.uri) {
          setFotoUri(foto.uri);
        }
      } catch (erro) {
        console.error('Erro ao capturar foto:', erro);
        Alert.alert('Erro na Câmera', 'Não foi possível capturar a imagem.');
      }
    }
  };

  // ============================================================================
  // AULA 20 (PRÁTICA): OBTER COORDENADAS GPS COM TRATAMENTO DE NEGATIVA
  // ============================================================================
  const obterGpsAtual = async (): Promise<Location.LocationObject | null> => {
    setBuscandoGps(true);
    setErroLocalizacao(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErroLocalizacao(
          'Permissão de localização negada pelo usuário. Usando coordenadas padrão da Sede.'
        );
        return null;
      }

      const posicao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocalizacaoAtual(posicao);
      return posicao;
    } catch {
      setErroLocalizacao(
        'Não foi possível obter o sinal do GPS no momento. Verifique se a localização está ativa.'
      );
      return null;
    } finally {
      setBuscandoGps(false);
    }
  };

  // ============================================================================
  // REGISTRO DE PONTO COMPLETO (Biometria + Câmera + GPS + POST API + AsyncStorage)
  // ============================================================================
  const registrarPonto = async () => {
    // 1. Validação Biométrica Opcional
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirme sua identidade para registrar o ponto',
        });
        if (!authResult.success) {
          Alert.alert('Autenticação', 'Biometria cancelada ou não reconhecida.');
          return;
        }
      }
    } catch {
      // Em web ou emulador sem hardware biométrico, segue normalmente
    }

    // 2. Coordenadas GPS (Aula 20)
    const posicaoGps = localizacaoAtual ?? (await obterGpsAtual());
    const latitude = posicaoGps ? posicaoGps.coords.latitude : -23.55052;
    const longitude = posicaoGps ? posicaoGps.coords.longitude : -46.633308;

    // 3. Se a câmera estiver aberta e ainda não houver fotoUri, tenta capturar uma foto
    let uriFinalFoto = fotoUri;
    if (!uriFinalFoto && permissaoCamera?.granted && cameraRef.current) {
      try {
        const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        if (foto?.uri) {
          uriFinalFoto = foto.uri;
          setFotoUri(foto.uri);
        }
      } catch {
        // Caso o emulador não produza frame de câmera no instante, segue sem travar
      }
    }

    const agora = dayjs();
    const proximoNumero = pontos.length + 1;
    const payloadNovoPonto: PontoRegistro = {
      id: String(Date.now()),
      titulo: `Registro #${proximoNumero} - ${categoriaSelecionada}`,
      categoria: categoriaSelecionada,
      dataHora: agora.format('DD/MM/YYYY HH:mm:ss'),
      localizacao: posicaoGps
        ? 'Geolocalização GPS Confirmada'
        : 'Sede Principal - Bloco A (Fallback)',
      latitude,
      longitude,
      observacao:
        observacaoInput.trim() ||
        'Registro efetuado com validação de hardware (Aula 20) e persistência híbrida.',
      fotoUri: uriFinalFoto,
      sincronizadoApi: false,
    };

    try {
      let registroSalvo = payloadNovoPonto;

      // 4. Tenta enviar via POST /pontos para a API Node.js + Express (Aula 18)
      try {
        const criadoNaApi = await criarPontoApi(payloadNovoPonto, apiUrl);
        registroSalvo = { ...criadoNaApi, sincronizadoApi: true };
        setApiOnline(true);
      } catch {
        setApiOnline(false);
      }

      // 5. Persiste no AsyncStorage (Aula 19) e atualiza a FlatList
      const novaLista = [registroSalvo, ...pontos];
      setPontos(novaLista);
      await salvarPontosStorage(novaLista);
      setObservacaoInput('');

      Alert.alert(
        'Ponto Registrado',
        registroSalvo.sincronizadoApi
          ? 'Salvo na API Express (201 Created) e no AsyncStorage!'
          : 'Salvo localmente no AsyncStorage (Modo Offline).'
      );
    } catch (erro) {
      console.error('Erro ao salvar registro de ponto:', erro);
      Alert.alert('Erro', 'Não foi possível salvar o registro.');
    }
  };

  const alternarModoCompacto = async (valor: boolean) => {
    setModoCompacto(valor);
    try {
      const prefsAtuais = await carregarPreferenciasStorage();
      await salvarPreferenciasStorage({
        ...prefsAtuais,
        modoCompacto: valor,
      });
    } catch (erro) {
      console.error('Erro ao persistir modo compacto:', erro);
    }
  };

  // Etapa 8 (Lab 5): Navegação programática com router.push para rota fixa
  const abrirPrimeiroRegistro = useCallback(() => {
    router.push('/detalhes/1');
  }, [router]);

  // Etapa 9 (Lab 5): Navegação programática com envio dinâmico do ID do item
  const handleAbrirDetalhes = useCallback(
    (id: string) => {
      router.push(`/detalhes/${id}`);
    },
    [router]
  );

  return (
    <FlatList
      data={pontos}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContainer}
      ListHeaderComponent={
        <View>
          {/* HERO HEADER INSPIRADO NO https://antigravity.google/ */}
          <AntigravityHeader
            badgeText="✦ CHRONO WORKSPACE v2"
            title="Controle de Ponto Inteligente"
            subtitle="Integração completa de Câmera, GPS, AsyncStorage, Sistema de Arquivos e API REST Express."
            rightContent={
              <TouchableOpacity
                style={[
                  styles.statusBadge,
                  apiOnline ? styles.statusOnline : styles.statusOffline,
                ]}
                onPress={sincronizarDados}
              >
                {carregandoDados ? (
                  <ActivityIndicator size="small" color={AntigravityPalette.obsidian} />
                ) : (
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: apiOnline
                          ? AntigravityPalette.emerald
                          : AntigravityPalette.slate,
                      },
                    ]}
                  >
                    {apiOnline
                      ? `● API Express Online (${climaStatus?.temperatura ?? 26}°C)`
                      : '○ Modo Offline (AsyncStorage)'}
                  </Text>
                )}
              </TouchableOpacity>
            }
          />

          {/* =============================================================== */}
          {/* AULA 20: MÓDULO DE CÂMERA E CICLO DE PERMISSÕES                 */}
          {/* =============================================================== */}
          <View style={styles.bentoCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.sectionEyebrow}>AULA 20 • EXPO-CAMERA</Text>
                <Text style={styles.sectionTitle}>Reconhecimento Visual</Text>
              </View>
              {permissaoCamera?.granted && (
                <TouchableOpacity
                  style={styles.secondaryPillSmall}
                  onPress={() =>
                    setCameraFacing((atual) => (atual === 'front' ? 'back' : 'front'))
                  }
                >
                  <Text style={styles.secondaryPillSmallText}>
                    Lente: {cameraFacing === 'front' ? 'Frontal' : 'Traseira'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Validação de 3 estágios de permissão (Aula 20) */}
            {!permissaoCamera ? (
              <View style={styles.permissionBox}>
                <ActivityIndicator color={AntigravityPalette.electricBlue} />
                <Text style={styles.permissionText}>
                  Verificando permissões de hardware...
                </Text>
              </View>
            ) : !permissaoCamera.granted ? (
              /* Caminho Vermelho: Permissão ainda não concedida */
              <View style={styles.permissionBoxDenied}>
                <Text style={styles.permissionTitle}>
                  Acesso à Câmera Necessário
                </Text>
                <Text style={styles.permissionText}>
                  Precisamos do seu acesso à câmera para anexar a foto de comprovação no registro de ponto.
                </Text>
                <BotaoPress
                  titulo="Conceder Permissão de Câmera"
                  variante="blue"
                  onPress={pedirPermissaoCamera}
                />
              </View>
            ) : (
              /* Caminho Verde: Permissão concedida -> Renderiza CameraView */
              <View>
                <View style={styles.cameraContainer}>
                  <CameraView
                    style={styles.camera}
                    ref={cameraRef}
                    facing={cameraFacing}
                  />
                </View>

                <View style={styles.cameraActionsRow}>
                  <TouchableOpacity
                    style={styles.capturePillBtn}
                    onPress={tirarFotoComprovante}
                  >
                    <Text style={styles.capturePillText}>
                      📷 Capturar Foto (takePictureAsync)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Missão Prática Aula 20: Exibir <Image> abaixo da lente + Botão Limpar */}
            {fotoUri && (
              <View style={styles.previewBox}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewLabel}>
                    Pré-visualização Capturada (Cache Temporário):
                  </Text>
                  <TouchableOpacity
                    style={styles.clearPhotoPill}
                    onPress={() => setFotoUri(null)}
                  >
                    <Text style={styles.clearPhotoText}>Limpar foto</Text>
                  </TouchableOpacity>
                </View>
                <Image source={{ uri: fotoUri }} style={styles.previewImage} />
                <Text style={styles.uriCaption} numberOfLines={1}>
                  URI: {fotoUri}
                </Text>
              </View>
            )}
          </View>

          {/* =============================================================== */}
          {/* AULA 20: GEOLOCALIZAÇÃO GPS (expo-location)                     */}
          {/* =============================================================== */}
          <View style={styles.bentoCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.sectionEyebrow}>AULA 20 • EXPO-LOCATION</Text>
                <Text style={styles.sectionTitle}>Coordenadas de Presença</Text>
              </View>
              <TouchableOpacity
                style={styles.secondaryPillSmall}
                onPress={obterGpsAtual}
                disabled={buscandoGps}
              >
                <Text style={styles.secondaryPillSmallText}>
                  {buscandoGps ? 'Buscando...' : '📍 Atualizar GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            {erroLocalizacao ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️ {erroLocalizacao}</Text>
              </View>
            ) : null}

            <View style={styles.coordsGrid}>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LATITUDE</Text>
                <Text style={styles.coordValue}>
                  {localizacaoAtual
                    ? localizacaoAtual.coords.latitude.toFixed(6)
                    : '-23.550520 (Sede)'}
                </Text>
              </View>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LONGITUDE</Text>
                <Text style={styles.coordValue}>
                  {localizacaoAtual
                    ? localizacaoAtual.coords.longitude.toFixed(6)
                    : '-46.633308 (Sede)'}
                </Text>
              </View>
            </View>
          </View>

          {/* =============================================================== */}
          {/* AÇÃO PRINCIPAL: REGISTRAR PONTO (CREATE POST /pontos + Storage) */}
          {/* =============================================================== */}
          <View style={styles.bentoCard}>
            <Text style={styles.sectionEyebrow}>
              AULAS 18 & 19 • REGISTRO HÍBRIDO
            </Text>
            <Text style={styles.sectionTitle}>Novo Registro de Ponto</Text>

            <View style={styles.chipsRow}>
              {CATEGORIAS_RAPIDAS.map((cat) => {
                const ativo = categoriaSelecionada === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategoriaSelecionada(cat)}
                    style={[
                      styles.categoryChip,
                      ativo && styles.categoryChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        ativo && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.obsInput}
              placeholder="Observação opcional (ex: Home office, visita técnica...)"
              placeholderTextColor={AntigravityPalette.muted}
              value={observacaoInput}
              onChangeText={setObservacaoInput}
            />

            <TouchableOpacity
              style={styles.primaryCheckinBtn}
              onPress={registrarPonto}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryCheckinBtnText}>
                ✦ BATER PONTO AGORA
              </Text>
            </TouchableOpacity>
          </View>

          {/* =============================================================== */}
          {/* LAB 5 (ETAPAS 7, 8 E 14): LINK DECLARATIVO VS useRouter()       */}
          {/* =============================================================== */}
          <View style={styles.bentoCard}>
            <Text style={styles.sectionEyebrow}>LAB 5 • EXPO ROUTER</Text>
            <Text style={styles.sectionTitle}>
              Navegação Declarativa vs. Programática
            </Text>

            <View style={styles.navButtonsRow}>
              {/* Etapa 7: Link declarativo para rota fixa /detalhes/1 */}
              <Link href="/detalhes/1" style={styles.linkDeclarativo}>
                <Text style={styles.linkText}>
                  Link Declarativo (/detalhes/1)
                </Text>
              </Link>

              {/* Etapa 8: Botão programático com router.push */}
              <TouchableOpacity
                style={styles.programmaticNavBtn}
                onPress={abrirPrimeiroRegistro}
              >
                <Text style={styles.programmaticNavBtnText}>
                  useRouter.push (/detalhes/1)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* =============================================================== */}
          {/* LAB 5 (ETAPA 5): SWITCH MODO COMPACTO                           */}
          {/* =============================================================== */}
          <View style={styles.switchBar}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>
                {modoCompacto
                  ? 'Visualização Compacta Ativa'
                  : 'Visualização Detalhada (Bento Cards)'}
              </Text>
              <Text style={styles.switchSub}>
                {pontos.length} registros carregados • Toque em um card para editar ou excluir
              </Text>
            </View>
            <Switch
              value={modoCompacto}
              onValueChange={alternarModoCompacto}
              trackColor={{
                false: AntigravityPalette.border,
                true: AntigravityPalette.electricBlue,
              }}
              thumbColor={AntigravityPalette.canvas}
            />
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <RegistroCard
          titulo={item.titulo}
          categoria={item.categoria}
          dataHora={item.dataHora}
          localizacao={item.localizacao}
          temFoto={Boolean(item.fotoUri)}
          temAnexo={Boolean(item.anexoPdf)}
          sincronizadoApi={Boolean(item.sincronizadoApi)}
          modoCompacto={modoCompacto}
          onPress={() => handleAbrirDetalhes(String(item.id))}
        />
      )}
      ListFooterComponent={
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>
            Arquitetura Google Antigravity • PDM 2026
          </Text>
          <Text style={styles.footerItem}>
            • Aulas 16–21: UI Modular, API Express CRUD, AsyncStorage, Câmera, GPS e Arquivos
          </Text>
          <Text style={styles.footerItem}>
            • Labs 1–5: FlatList, State, Props, Rotas Dinâmicas [id].tsx, Link e useRouter
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 36,
    backgroundColor: AntigravityPalette.canvas,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  statusOnline: {
    backgroundColor: AntigravityPalette.emeraldTint,
    borderColor: '#A7F3D0',
  },
  statusOffline: {
    backgroundColor: AntigravityPalette.surfaceAlt,
    borderColor: AntigravityPalette.border,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bentoCard: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: Radii.bento,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: AntigravityPalette.cobaltBlue,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.3,
  },
  secondaryPillSmall: {
    backgroundColor: AntigravityPalette.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  secondaryPillSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  permissionBox: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  permissionBoxDenied: {
    backgroundColor: AntigravityPalette.coralTint,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AntigravityPalette.obsidian,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 13,
    color: AntigravityPalette.slate,
    lineHeight: 19,
  },
  cameraContainer: {
    height: 190,
    borderRadius: Radii.card,
    overflow: 'hidden',
    backgroundColor: AntigravityPalette.obsidian,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  cameraActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  capturePillBtn: {
    backgroundColor: AntigravityPalette.obsidian,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    width: '100%',
    alignItems: 'center',
  },
  capturePillText: {
    color: AntigravityPalette.canvas,
    fontSize: 13,
    fontWeight: '600',
  },
  previewBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: AntigravityPalette.canvas,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  clearPhotoPill: {
    backgroundColor: AntigravityPalette.coralTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  clearPhotoText: {
    color: AntigravityPalette.coralRed,
    fontSize: 11,
    fontWeight: '700',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    backgroundColor: AntigravityPalette.surfaceAlt,
  },
  uriCaption: {
    marginTop: 6,
    fontSize: 11,
    color: AntigravityPalette.muted,
  },
  errorBanner: {
    backgroundColor: AntigravityPalette.amberTint,
    padding: 10,
    borderRadius: Radii.input,
    marginBottom: 10,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  coordsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  coordItem: {
    flex: 1,
    backgroundColor: AntigravityPalette.canvas,
    padding: 12,
    borderRadius: Radii.input,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: AntigravityPalette.muted,
    letterSpacing: 0.6,
  },
  coordValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: AntigravityPalette.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  categoryChipActive: {
    backgroundColor: AntigravityPalette.obsidian,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.slate,
  },
  categoryChipTextActive: {
    color: AntigravityPalette.canvas,
  },
  obsInput: {
    backgroundColor: AntigravityPalette.canvas,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: AntigravityPalette.obsidian,
    marginBottom: 12,
  },
  primaryCheckinBtn: {
    backgroundColor: AntigravityPalette.obsidian,
    borderRadius: Radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryCheckinBtnText: {
    color: AntigravityPalette.canvas,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  navButtonsRow: {
    marginTop: 12,
    gap: 8,
  },
  linkDeclarativo: {
    backgroundColor: AntigravityPalette.surfaceAlt,
    borderRadius: Radii.pill,
    paddingVertical: 11,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  linkText: {
    color: AntigravityPalette.obsidian,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  programmaticNavBtn: {
    backgroundColor: AntigravityPalette.blueTint,
    borderRadius: Radii.pill,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  programmaticNavBtnText: {
    color: AntigravityPalette.cobaltBlue,
    fontWeight: '600',
    fontSize: 13,
  },
  switchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AntigravityPalette.surface,
    padding: 16,
    borderRadius: Radii.bento,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    marginBottom: 14,
    gap: 12,
  },
  switchInfo: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  switchSub: {
    fontSize: 12,
    color: AntigravityPalette.muted,
    marginTop: 2,
  },
  footerCard: {
    marginTop: 12,
    padding: 18,
    backgroundColor: AntigravityPalette.surface,
    borderRadius: Radii.bento,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    gap: 4,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AntigravityPalette.obsidian,
    marginBottom: 4,
  },
  footerItem: {
    fontSize: 12,
    color: AntigravityPalette.slate,
    lineHeight: 18,
  },
});
