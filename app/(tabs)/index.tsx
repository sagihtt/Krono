import { AppShell } from '@/components/AppShell';
import { BotaoPress } from '@/components/BotaoPress';
import { RegistroCard } from '@/components/RegistroCard';
import { PONTOS_INICIAIS } from '@/constants/pontosMock';
import { AntigravityPalette, Radii } from '@/constants/theme';
import { PontoRegistro } from '@/models/ponto';
import {
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
import Feather from '@expo/vector-icons/Feather';
import dayjs from 'dayjs';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Location from 'expo-location';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const CATEGORIAS_JORNADA = [
  'Entrada Regular',
  'Intervalo',
  'Retorno',
  'Saída Regular',
  'Hora Extra',
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 880;
  const router = useRouter();

  // Relógio em tempo real para dar vida à tela inicial
  const [horarioAtual, setHorarioAtual] = useState(() =>
    dayjs().format('HH:mm:ss')
  );
  const [dataAtual, setDataAtual] = useState(() =>
    dayjs().format('DD/MM/YYYY')
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const agora = dayjs();
      setHorarioAtual(agora.format('HH:mm:ss'));
      setDataAtual(agora.format('DD/MM/YYYY'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Câmera e pré-visualização
  const [permissaoCamera, pedirPermissaoCamera] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [cameraExpandida, setCameraExpandida] = useState<boolean>(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Geolocalização
  const [localizacaoAtual, setLocalizacaoAtual] =
    useState<Location.LocationObject | null>(null);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
  const [buscandoGps, setBuscandoGps] = useState<boolean>(false);

  // Lista de registros e estado da interface
  const [pontos, setPontos] = useState<PontoRegistro[]>(PONTOS_INICIAIS);
  const [modoCompacto, setModoCompacto] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_BASE_URL);
  const [apiOnline, setApiOnline] = useState<boolean>(false);

  // Formulário de novo registro
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string>('Entrada Regular');
  const [observacaoInput, setObservacaoInput] = useState<string>('');

  const sincronizarDados = useCallback(async () => {
    try {
      const prefs = await carregarPreferenciasStorage();
      setModoCompacto(prefs.modoCompacto);
      const urlAtiva = prefs.apiUrl || DEFAULT_API_BASE_URL;
      setApiUrl(urlAtiva);

      const pontosLocais = await carregarPontosStorage();
      setPontos(pontosLocais);

      try {
        const [, pontosRemotos] = await Promise.all([
          consultarStatusApi(urlAtiva),
          listarPontosApi(urlAtiva),
        ]);
        setApiOnline(true);

        if (Array.isArray(pontosRemotos) && pontosRemotos.length > 0) {
          setPontos(pontosRemotos);
          await salvarPontosStorage(pontosRemotos);
        }
      } catch {
        setApiOnline(false);
      }
    } catch (erro) {
      console.error('Erro ao carregar registros:', erro);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      sincronizarDados();
    }, [sincronizarDados])
  );

  const tirarFotoComprovante = async () => {
    if (!permissaoCamera?.granted) {
      const resp = await pedirPermissaoCamera();
      if (!resp.granted) {
        Alert.alert(
          'Acesso à câmera',
          'Ative a permissão da câmera nas configurações do aparelho para anexar fotos.'
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
      } catch {
        Alert.alert(
          'Câmera indisponível',
          'Não foi possível capturar a imagem neste momento.'
        );
      }
    }
  };

  const obterGpsAtual = async (): Promise<Location.LocationObject | null> => {
    setBuscandoGps(true);
    setErroLocalizacao(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErroLocalizacao(
          'Permissão de localização não concedida. Utilizando endereço padrão da unidade.'
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
        'Sinal de localização indisponível. Utilizando endereço padrão da unidade.'
      );
      return null;
    } finally {
      setBuscandoGps(false);
    }
  };

  const registrarPonto = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirme sua identidade para registrar o ponto',
        });
        if (!authResult.success) {
          Alert.alert(
            'Verificação necessária',
            'A confirmação de identidade não foi concluída.'
          );
          return;
        }
      }
    } catch {
      // Ambientes web ou sem biometria seguem normalmente
    }

    const posicaoGps = localizacaoAtual ?? (await obterGpsAtual());
    const latitude = posicaoGps ? posicaoGps.coords.latitude : -23.55052;
    const longitude = posicaoGps ? posicaoGps.coords.longitude : -46.633308;

    let uriFinalFoto = fotoUri;
    if (
      !uriFinalFoto &&
      cameraExpandida &&
      permissaoCamera?.granted &&
      cameraRef.current
    ) {
      try {
        const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        if (foto?.uri) {
          uriFinalFoto = foto.uri;
          setFotoUri(foto.uri);
        }
      } catch {
        // Segue sem foto se o sensor não responder
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
        ? 'Localização confirmada via GPS'
        : 'Sede Principal - Bloco A',
      latitude,
      longitude,
      observacao:
        observacaoInput.trim() || 'Registro efetuado pelo aplicativo.',
      fotoUri: uriFinalFoto,
      sincronizadoApi: false,
    };

    try {
      let registroSalvo = payloadNovoPonto;
      try {
        const criadoNaApi = await criarPontoApi(payloadNovoPonto, apiUrl);
        registroSalvo = { ...criadoNaApi, sincronizadoApi: true };
        setApiOnline(true);
      } catch {
        setApiOnline(false);
      }

      const novaLista = [registroSalvo, ...pontos];
      setPontos(novaLista);
      await salvarPontosStorage(novaLista);
      setObservacaoInput('');

      Alert.alert(
        'Ponto registrado',
        `${categoriaSelecionada} registrada às ${agora.format('HH:mm')}.`
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível concluir o registro.');
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
    } catch {
      // Silencioso
    }
  };

  const abrirPrimeiroRegistro = useCallback(() => {
    router.push('/detalhes/1');
  }, [router]);

  const handleAbrirDetalhes = useCallback(
    (id: string) => {
      router.push(`/detalhes/${id}`);
    },
    [router]
  );

  const renderPainelControle = () => (
    <View style={styles.controlColumn}>
      {/* Card Principal: Relógio e Registro de Ponto */}
      <View style={styles.clockCard}>
        <View style={styles.clockTopRow}>
          <View style={styles.dateBadge}>
            <Feather
              name="calendar"
              size={12}
              color={AntigravityPalette.slate}
            />
            <Text style={styles.dateBadgeText}>{dataAtual}</Text>
          </View>
          <Text style={styles.shiftHint}>Expediente regular</Text>
        </View>

        <Text style={styles.clockDigits}>{horarioAtual}</Text>
        <Text style={styles.clockSubtitle}>
          Selecione o tipo de marcação abaixo
        </Text>

        <View style={styles.chipsContainer}>
          {CATEGORIAS_JORNADA.map((cat) => {
            const ativo = categoriaSelecionada === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoriaSelecionada(cat)}
                style={[
                  styles.categoryChip,
                  ativo && styles.categoryChipActive,
                ]}
                activeOpacity={0.8}
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
          placeholder="Adicionar observação (opcional)"
          placeholderTextColor={AntigravityPalette.muted}
          value={observacaoInput}
          onChangeText={setObservacaoInput}
        />

        <View style={styles.centeredBtnWrap}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={registrarPonto}
            activeOpacity={0.85}
          >
            <Feather
              name="check-circle"
              size={17}
              color={AntigravityPalette.canvas}
            />
            <Text style={styles.primaryActionBtnText}>Registrar ponto</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card de Localização e Comprovante Fotográfico */}
      <View style={styles.surfaceCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.headerIconTitle}>
            <View style={styles.softIconCircle}>
              <Feather
                name="map-pin"
                size={15}
                color={AntigravityPalette.cobaltBlue}
              />
            </View>
            <View>
              <Text style={styles.cardTitle}>Localização e foto</Text>
              <Text style={styles.cardSubtitle}>
                Dados anexados ao comprovante
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.ghostPillBtn}
            onPress={obterGpsAtual}
            disabled={buscandoGps}
          >
            <Feather
              name="refresh-cw"
              size={12}
              color={AntigravityPalette.obsidian}
            />
            <Text style={styles.ghostPillText}>
              {buscandoGps ? 'Localizando...' : 'Atualizar'}
            </Text>
          </TouchableOpacity>
        </View>

        {erroLocalizacao ? (
          <View style={styles.noticeBanner}>
            <Feather name="info" size={14} color="#92400E" />
            <Text style={styles.noticeBannerText}>{erroLocalizacao}</Text>
          </View>
        ) : null}

        <View style={styles.coordsGrid}>
          <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>Latitude</Text>
            <Text style={styles.coordValue}>
              {localizacaoAtual
                ? localizacaoAtual.coords.latitude.toFixed(5)
                : '-23.55052'}
            </Text>
          </View>
          <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>Longitude</Text>
            <Text style={styles.coordValue}>
              {localizacaoAtual
                ? localizacaoAtual.coords.longitude.toFixed(5)
                : '-46.63331'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Controle da câmera */}
        <View style={styles.cameraHeaderRow}>
          <Text style={styles.subSectionLabel}>Registro fotográfico</Text>
          <TouchableOpacity
            style={styles.ghostPillBtn}
            onPress={() => setCameraExpandida((prev) => !prev)}
          >
            <Feather
              name="camera"
              size={12}
              color={AntigravityPalette.obsidian}
            />
            <Text style={styles.ghostPillText}>
              {cameraExpandida ? 'Ocultar câmera' : 'Abrir câmera'}
            </Text>
          </TouchableOpacity>
        </View>

        {cameraExpandida && (
          <View style={styles.cameraSection}>
            {!permissaoCamera ? (
              <View style={styles.permissionBox}>
                <ActivityIndicator color={AntigravityPalette.electricBlue} />
                <Text style={styles.permissionText}>
                  Verificando acesso à câmera...
                </Text>
              </View>
            ) : !permissaoCamera.granted ? (
              <View style={styles.permissionDeniedBox}>
                <Text style={styles.permissionDeniedTitle}>
                  Permissão da câmera desativada
                </Text>
                <Text style={styles.permissionText}>
                  Autorize o uso da câmera para anexar uma foto ao seu comprovante de ponto.
                </Text>
                <View style={styles.centeredBtnWrap}>
                  <BotaoPress
                    titulo="Permitir acesso à câmera"
                    variante="blue"
                    onPress={pedirPermissaoCamera}
                  />
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.cameraContainer}>
                  <CameraView
                    style={styles.camera}
                    ref={cameraRef}
                    facing={cameraFacing}
                  />
                </View>
                <View style={styles.cameraControlsRow}>
                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={() =>
                      setCameraFacing((atual) =>
                        atual === 'front' ? 'back' : 'front'
                      )
                    }
                  >
                    <Feather
                      name="repeat"
                      size={14}
                      color={AntigravityPalette.obsidian}
                    />
                    <Text style={styles.secondaryActionBtnText}>
                      Alternar lente
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shutterBtn}
                    onPress={tirarFotoComprovante}
                  >
                    <Feather
                      name="camera"
                      size={14}
                      color={AntigravityPalette.canvas}
                    />
                    <Text style={styles.shutterBtnText}>Fotografar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {fotoUri && (
          <View style={styles.previewBox}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewLabel}>Foto anexada ao próximo ponto</Text>
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => setFotoUri(null)}
              >
                <Feather
                  name="trash-2"
                  size={12}
                  color={AntigravityPalette.coralRed}
                />
                <Text style={styles.removePhotoText}>Remover foto</Text>
              </TouchableOpacity>
            </View>
            <Image source={{ uri: fotoUri }} style={styles.previewImage} />
          </View>
        )}
      </View>
    </View>
  );

  const renderCabecalhoHistorico = () => (
    <View style={styles.historyHeaderCard}>
      <View style={styles.historyTopRow}>
        <View>
          <Text style={styles.cardTitle}>Histórico de marcações</Text>
          <Text style={styles.cardSubtitle}>
            {pontos.length} registros disponíveis
          </Text>
        </View>

        <View style={styles.compactToggleRow}>
          <Text style={styles.compactToggleLabel}>Compacto</Text>
          <Switch
            value={modoCompacto}
            onValueChange={alternarModoCompacto}
            trackColor={{
              false: AntigravityPalette.border,
              true: AntigravityPalette.obsidian,
            }}
            thumbColor={AntigravityPalette.canvas}
          />
        </View>
      </View>

      {/* Atalhos rápidos (preservando Link e useRouter exigidos pela arquitetura) */}
      <View style={styles.quickShortcutsRow}>
        <Link href="/detalhes/1" style={styles.shortcutLink}>
          <Text style={styles.shortcutLinkText}>Primeiro registro do dia</Text>
        </Link>

        <TouchableOpacity
          style={styles.shortcutButton}
          onPress={abrirPrimeiroRegistro}
        >
          <Text style={styles.shortcutButtonText}>Abrir comprovante</Text>
          <Feather
            name="arrow-up-right"
            size={13}
            color={AntigravityPalette.cobaltBlue}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <AppShell
      title="Jornada de hoje"
      subtitle="Controle de frequência e comprovantes"
      onlineStatus={apiOnline}
      onRefresh={sincronizarDados}
      modoCompacto={modoCompacto}
      onToggleCompacto={alternarModoCompacto}
    >
      {isWide ? (
        /* Layout Responsivo de 2 Colunas para Web / Telas Grandes */
        <ScrollView contentContainerStyle={styles.wideScrollContainer}>
          <View style={styles.wideGrid}>
            <View style={styles.wideLeftCol}>{renderPainelControle()}</View>
            <View style={styles.wideRightCol}>
              {renderCabecalhoHistorico()}
              {pontos.map((item) => (
                <RegistroCard
                  key={String(item.id)}
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
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Layout Mobile Otimizado com FlatList */
        <FlatList
          data={pontos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.mobileListContainer}
          ListHeaderComponent={
            <View>
              {renderPainelControle()}
              {renderCabecalhoHistorico()}
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
        />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  wideScrollContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  wideGrid: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  wideLeftCol: {
    width: 420,
  },
  wideRightCol: {
    flex: 1,
  },
  mobileListContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  controlColumn: {
    gap: 14,
    marginBottom: 14,
  },
  clockCard: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  clockTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.canvas,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.slate,
  },
  shiftHint: {
    fontSize: 12,
    color: AntigravityPalette.muted,
    fontWeight: '500',
  },
  clockDigits: {
    fontSize: 38,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -1,
    textAlign: 'center',
    marginTop: 4,
  },
  clockSubtitle: {
    fontSize: 13,
    color: AntigravityPalette.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: AntigravityPalette.canvas,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  categoryChipActive: {
    backgroundColor: AntigravityPalette.obsidian,
    borderColor: AntigravityPalette.obsidian,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: AntigravityPalette.slate,
  },
  categoryChipTextActive: {
    color: AntigravityPalette.canvas,
    fontWeight: '600',
  },
  obsInput: {
    backgroundColor: AntigravityPalette.canvas,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: AntigravityPalette.obsidian,
    marginBottom: 14,
  },
  centeredBtnWrap: {
    alignItems: 'center',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AntigravityPalette.obsidian,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: Radii.pill,
    minWidth: 220,
  },
  primaryActionBtnText: {
    color: AntigravityPalette.canvas,
    fontSize: 14,
    fontWeight: '600',
  },
  surfaceCard: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  headerIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  softIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AntigravityPalette.blueTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: AntigravityPalette.muted,
    marginTop: 1,
  },
  ghostPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.canvas,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  ghostPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: AntigravityPalette.obsidian,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AntigravityPalette.amberTint,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  noticeBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  coordsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  coordBox: {
    flex: 1,
    backgroundColor: AntigravityPalette.canvas,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: AntigravityPalette.muted,
  },
  coordValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  divider: {
    height: 1,
    backgroundColor: AntigravityPalette.border,
    marginVertical: 14,
  },
  cameraHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  cameraSection: {
    marginTop: 12,
  },
  permissionBox: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  permissionDeniedBox: {
    backgroundColor: AntigravityPalette.canvas,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    gap: 6,
  },
  permissionDeniedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 13,
    color: AntigravityPalette.slate,
    textAlign: 'center',
    lineHeight: 19,
  },
  cameraContainer: {
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: AntigravityPalette.obsidian,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  cameraControlsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.canvas,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: AntigravityPalette.obsidian,
  },
  shutterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.obsidian,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  shutterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AntigravityPalette.canvas,
  },
  previewBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: AntigravityPalette.canvas,
    borderRadius: 14,
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
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AntigravityPalette.coralTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  removePhotoText: {
    color: AntigravityPalette.coralRed,
    fontSize: 11,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    backgroundColor: AntigravityPalette.surfaceAlt,
  },
  historyHeaderCard: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    marginBottom: 12,
    gap: 12,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactToggleLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: AntigravityPalette.slate,
  },
  quickShortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shortcutLink: {
    backgroundColor: AntigravityPalette.canvas,
    borderRadius: Radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  shortcutLinkText: {
    color: AntigravityPalette.slate,
    fontWeight: '500',
    fontSize: 12,
  },
  shortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AntigravityPalette.blueTint,
    borderRadius: Radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  shortcutButtonText: {
    color: AntigravityPalette.cobaltBlue,
    fontWeight: '600',
    fontSize: 12,
  },
});
