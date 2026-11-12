import { AppShell } from '@/components/AppShell';
import { BotaoPress } from '@/components/BotaoPress';
import { RegistroCard } from '@/components/RegistroCard';
import { RelogioDigital } from '@/components/RelogioDigital';
import { PONTOS_INICIAIS } from '@/constants/pontosMock';
import { AntigravityPalette, Radii } from '@/constants/theme';
import { PontoRegistro } from '@/models/ponto';
import {
  consultarStatusApi,
  criarPontoApi,
  DEFAULT_API_BASE_URL,
  enviarArquivoFormDataApi,
  listarPontosApi,
} from '@/services/apiService';
import {
  carregarPontosStorage,
  carregarPreferenciasStorage,
  carregarTurnoFavoritoStorage,
  PREFERENCIAS_PADRAO,
  salvarPontosStorage,
  salvarPreferenciasStorage,
} from '@/services/storageService';
import {
  CATEGORIAS_JORNADA,
  formatarLinkMapa,
  sugerirProximaCategoria,
} from '@/utils/jornada';
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
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const GPS_CACHE_MAX_AGE_MS = 120_000;
const GPS_FAST_TIMEOUT_MS = 2200;
const GEOCODE_FAST_TIMEOUT_MS = 1800;
const CAMERA_FAST_TIMEOUT_MS = 2000;

function comLimiteTempo<T>(promessa: Promise<T>, limiteMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Tempo esgotado')),
      limiteMs
    );
    promessa.then(
      (valor) => {
        clearTimeout(timer);
        resolve(valor);
      },
      (erro) => {
        clearTimeout(timer);
        reject(erro);
      }
    );
  });
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 880;
  const router = useRouter();

  const [permissaoCamera, pedirPermissaoCamera] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [cameraExpandida, setCameraExpandida] = useState<boolean>(true);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);

  const [localizacaoAtual, setLocalizacaoAtual] =
    useState<Location.LocationObject | null>(null);
  const ultimaLeituraGpsMsRef = useRef<number>(0);

  const [enderecoPrincipal, setEnderecoPrincipal] = useState<string>(
    'SGAN 601, Módulo B - Sede Principal'
  );
  const [enderecoSecundario, setEnderecoSecundario] = useState<string>(
    'Asa Norte • Brasília - DF'
  );
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
  const [buscandoGps, setBuscandoGps] = useState<boolean>(false);

  const [pontos, setPontos] = useState<PontoRegistro[]>(PONTOS_INICIAIS);
  const [modoCompacto, setModoCompacto] = useState<boolean>(false);
  const [turnoAtivo, setTurnoAtivo] = useState<string>(
    PREFERENCIAS_PADRAO.turnoFavorito
  );
  const [apiUrl, setApiUrl] = useState<string>(DEFAULT_API_BASE_URL);
  const [apiOnline, setApiOnline] = useState<boolean>(false);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(() =>
    sugerirProximaCategoria(PONTOS_INICIAIS)
  );
  const [observacaoInput, setObservacaoInput] = useState<string>('');
  const [feedbackRegistro, setFeedbackRegistro] = useState<string | null>(null);

  const sincronizarDados = useCallback(async () => {
    try {
      const [prefs, turnoSalvo, pontosLocais] = await Promise.all([
        carregarPreferenciasStorage(),
        carregarTurnoFavoritoStorage(),
        carregarPontosStorage(),
      ]);

      setModoCompacto(prefs.modoCompacto);
      setTurnoAtivo(
        turnoSalvo || prefs.turnoFavorito || PREFERENCIAS_PADRAO.turnoFavorito
      );
      const urlAtiva = prefs.apiUrl || DEFAULT_API_BASE_URL;
      setApiUrl(urlAtiva);
      setPontos(pontosLocais);
      setCategoriaSelecionada(sugerirProximaCategoria(pontosLocais));

      try {
        await consultarStatusApi(urlAtiva);
        setApiOnline(true);

        const pendentes = pontosLocais.filter(
          (item) => item.sincronizadoApi === false
        );
        if (pendentes.length > 0) {
          // envia do mais antigo ao mais recente antes de puxar a lista consolidada
          for (const itemPendente of [...pendentes].reverse()) {
            try {
              await criarPontoApi(itemPendente, urlAtiva);
            } catch {}
          }
        }

        const pontosRemotos = await listarPontosApi(urlAtiva);
        if (Array.isArray(pontosRemotos)) {
          setPontos(pontosRemotos);
          setCategoriaSelecionada(sugerirProximaCategoria(pontosRemotos));
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

  const resolverEnderecoAproximado = useCallback(
    async (
      latitude: number,
      longitude: number
    ): Promise<{ linha1: string; linha2: string; completo: string }> => {
      if (Platform.OS !== 'web') {
        try {
          const resultados = await comLimiteTempo(
            Location.reverseGeocodeAsync({ latitude, longitude }),
            GEOCODE_FAST_TIMEOUT_MS
          );
          if (resultados && resultados.length > 0) {
            const item = resultados[0];
            const rua = [item.street, item.streetNumber]
              .filter(Boolean)
              .join(', ');
            const linha1 =
              rua || item.name || item.district || 'Endereço localizado';
            const regiao = [
              item.district || item.subregion,
              item.city,
              item.region,
            ]
              .filter(Boolean)
              .join(' • ');
            const linha2 = regiao || 'Localização confirmada pelo aparelho';
            return {
              linha1,
              linha2,
              completo: regiao ? `${linha1} - ${regiao}` : linha1,
            };
          }
        } catch {}
      }

      // fallback via Nominatim na web ou se o geocoder nativo expirar
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GEOCODE_FAST_TIMEOUT_MS);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`,
          {
            headers: {
              Accept: 'application/json',
              'User-Agent': 'KronoApp/2.3',
            },
            signal: controller.signal,
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          const addr = data?.address || {};
          const rua = [addr.road || addr.pedestrian, addr.house_number]
            .filter(Boolean)
            .join(', ');
          const linha1 =
            rua || data?.name || addr.suburb || 'Endereço aproximado obtido';
          const regiao = [
            addr.suburb || addr.neighbourhood,
            addr.city || addr.town || addr.municipality,
            addr.state,
          ]
            .filter(Boolean)
            .join(' • ');
          const linha2 = regiao || 'Localização verificada';
          return {
            linha1,
            linha2,
            completo: regiao ? `${linha1} - ${regiao}` : linha1,
          };
        }
      } catch {
      } finally {
        clearTimeout(timer);
      }

      return {
        linha1: 'Unidade Corporativa - Presencial',
        linha2: 'Localização confirmada no dispositivo',
        completo: 'Unidade Corporativa - Presencial',
      };
    },
    []
  );

  const obterGpsAtual = useCallback(async (): Promise<{
    posicao: Location.LocationObject | null;
    enderecoCompleto: string;
  }> => {
    setBuscandoGps(true);
    setErroLocalizacao(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErroLocalizacao(
          'Permissão de localização não concedida. Utilizando endereço padrão da unidade.'
        );
        return {
          posicao: null,
          enderecoCompleto: `${enderecoPrincipal} - ${enderecoSecundario}`,
        };
      }

      const posicao = await comLimiteTempo(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        4000
      );
      setLocalizacaoAtual(posicao);
      ultimaLeituraGpsMsRef.current = Date.now();

      const end = await resolverEnderecoAproximado(
        posicao.coords.latitude,
        posicao.coords.longitude
      );
      setEnderecoPrincipal(end.linha1);
      setEnderecoSecundario(end.linha2);

      return { posicao, enderecoCompleto: end.completo };
    } catch {
      setErroLocalizacao(
        'Sinal de localização indisponível. Utilizando endereço padrão da unidade.'
      );
      return {
        posicao: null,
        enderecoCompleto: `${enderecoPrincipal} - ${enderecoSecundario}`,
      };
    } finally {
      setBuscandoGps(false);
    }
  }, [enderecoPrincipal, enderecoSecundario, resolverEnderecoAproximado]);

  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then((perm) => {
        if (perm.granted) {
          obterGpsAtual();
        }
      })
      .catch(() => {});
  }, [obterGpsAtual]);

  const obterLocalizacaoRapidaNoClique = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
    endereco: string;
  }> => {
    const enderecoCache = `${enderecoPrincipal} - ${enderecoSecundario}`;
    const idadeCache = Date.now() - ultimaLeituraGpsMsRef.current;

    if (localizacaoAtual && idadeCache < GPS_CACHE_MAX_AGE_MS) {
      return {
        latitude: localizacaoAtual.coords.latitude,
        longitude: localizacaoAtual.coords.longitude,
        endereco: enderecoCache,
      };
    }

    try {
      const perm = await Location.getForegroundPermissionsAsync();
      let concedida = perm.granted;
      if (!concedida && Platform.OS !== 'web') {
        const pedido = await Location.requestForegroundPermissionsAsync();
        concedida = pedido.granted;
      }

      if (!concedida) {
        return {
          latitude: localizacaoAtual?.coords.latitude ?? -15.7588,
          longitude: localizacaoAtual?.coords.longitude ?? -47.8832,
          endereco: enderecoCache,
        };
      }

      let pos = await Location.getLastKnownPositionAsync().catch(() => null);
      if (!pos) {
        pos = await comLimiteTempo(
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          GPS_FAST_TIMEOUT_MS
        ).catch(() => null);
      }

      if (pos) {
        setLocalizacaoAtual(pos);
        ultimaLeituraGpsMsRef.current = Date.now();

        // atualiza o endereço em background para não atrasar o clique
        resolverEnderecoAproximado(pos.coords.latitude, pos.coords.longitude)
          .then((end) => {
            setEnderecoPrincipal(end.linha1);
            setEnderecoSecundario(end.linha2);
          })
          .catch(() => {});

        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          endereco: enderecoCache,
        };
      }
    } catch {}

    return {
      latitude: localizacaoAtual?.coords.latitude ?? -15.7588,
      longitude: localizacaoAtual?.coords.longitude ?? -47.8832,
      endereco: enderecoCache,
    };
  }, [
    enderecoPrincipal,
    enderecoSecundario,
    localizacaoAtual,
    resolverEnderecoAproximado,
  ]);

  const tirarFotoComprovante = async (
    modoRapido: boolean = false
  ): Promise<string | null> => {
    let cameraLiberada = Boolean(permissaoCamera?.granted);
    if (!cameraLiberada) {
      if (modoRapido && Platform.OS === 'web') {
        return null;
      }
      const resp = await pedirPermissaoCamera();
      cameraLiberada = resp.granted;
      if (!cameraLiberada) {
        if (!modoRapido) {
          Alert.alert(
            'Acesso à câmera',
            'Ative a permissão da câmera para anexar a foto do comprovante.'
          );
        }
        return null;
      }
    }

    if (!cameraExpandida && !modoRapido) {
      setCameraExpandida(true);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    if (cameraRef.current && cameraExpandida) {
      try {
        const foto = await comLimiteTempo(
          cameraRef.current.takePictureAsync({
            quality: 0.6,
            skipProcessing: true,
          }),
          CAMERA_FAST_TIMEOUT_MS
        );
        if (foto?.uri) {
          if (!modoRapido) {
            setFotoUri(foto.uri);
          }
          return foto.uri;
        }
      } catch {}
    }
    return null;
  };

  const abrirNoMapa = () => {
    const lat = localizacaoAtual ? localizacaoAtual.coords.latitude : -15.7588;
    const lon = localizacaoAtual ? localizacaoAtual.coords.longitude : -47.8832;
    Linking.openURL(formatarLinkMapa(lat, lon)).catch(() => {});
  };

  const registrarPonto = async () => {
    if (registrando) return;
    setRegistrando(true);
    setFeedbackRegistro(null);

    try {
      if (Platform.OS !== 'web') {
        try {
          const [hasHardware, isEnrolled] = await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
          ]);
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
        } catch {}
      }

      const [dadosGps, fotoCapturadaAgora] = await Promise.all([
        obterLocalizacaoRapidaNoClique(),
        fotoUri ? Promise.resolve(fotoUri) : tirarFotoComprovante(true),
      ]);

      const uriFinalFoto = fotoCapturadaAgora ?? fotoUri;
      const agora = dayjs();
      const idTemporario = `temp_${Date.now()}`;
      const categoriaMarcada = categoriaSelecionada;
      const proximoNumero = pontos.length + 1;

      const registroOtimista: PontoRegistro = {
        id: idTemporario,
        titulo: `Registro #${proximoNumero} - ${categoriaMarcada}`,
        categoria: categoriaMarcada,
        dataHora: agora.format('DD/MM/YYYY HH:mm:ss'),
        localizacao: dadosGps.endereco,
        latitude: dadosGps.latitude,
        longitude: dadosGps.longitude,
        observacao:
          observacaoInput.trim() ||
          'Marcação confirmada com localização verificada.',
        fotoUri: uriFinalFoto,
        sincronizadoApi: false,
      };

      const listaOtimista = [registroOtimista, ...pontos];
      setPontos(listaOtimista);
      setCategoriaSelecionada(sugerirProximaCategoria(listaOtimista));
      setObservacaoInput('');
      setFotoUri(null);
      setFeedbackRegistro(
        `Marcação de ${categoriaMarcada} registrada às ${agora.format('HH:mm:ss')}.`
      );
      setRegistrando(false);

      await salvarPontosStorage(listaOtimista);

      // sobe foto e batida em background e substitui o id temporário quando confirmar
      (async () => {
        try {
          let uriFotoRemota = uriFinalFoto;
          if (uriFinalFoto && !uriFinalFoto.startsWith('http')) {
            try {
              const up = await enviarArquivoFormDataApi(
                {
                  uri: uriFinalFoto,
                  name: `ponto-${Date.now()}.jpg`,
                  mimeType: 'image/jpeg',
                },
                apiUrl
              );
              if (up.arquivoUrl) {
                uriFotoRemota = up.arquivoUrl;
              }
            } catch {}
          }

          const criadoNaApi = await criarPontoApi(
            {
              ...registroOtimista,
              fotoUri: uriFotoRemota,
            },
            apiUrl
          );

          const consolidado: PontoRegistro = {
            ...criadoNaApi,
            sincronizadoApi: true,
          };

          setApiOnline(true);
          setPontos((listaAtual) => {
            const substituida = listaAtual.map((item) =>
              item.id === idTemporario ? consolidado : item
            );
            salvarPontosStorage(substituida).catch(() => {});
            return substituida;
          });
        } catch {
          setApiOnline(false);
        }
      })();
    } catch {
      Alert.alert('Erro', 'Não foi possível concluir o registro.');
      setRegistrando(false);
    }
  };

  const alternarModoCompacto = useCallback(async (valor: boolean) => {
    setModoCompacto(valor);
    try {
      const prefsAtuais = await carregarPreferenciasStorage();
      await salvarPreferenciasStorage({
        ...prefsAtuais,
        modoCompacto: valor,
      });
    } catch {}
  }, []);

  const ultimoRegistroId = pontos[0]?.id ? String(pontos[0].id) : null;

  const abrirUltimoRegistro = useCallback(() => {
    if (ultimoRegistroId) {
      router.push(`/detalhes/${ultimoRegistroId}`);
    }
  }, [router, ultimoRegistroId]);

  const handleAbrirDetalhes = useCallback(
    (id: string) => {
      router.push(`/detalhes/${id}`);
    },
    [router]
  );

  const renderItemHistorico = useCallback(
    ({ item }: { item: PontoRegistro }) => (
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
    ),
    [handleAbrirDetalhes, modoCompacto]
  );

  const renderPainelControle = () => (
    <View style={styles.controlColumn}>
      <View style={styles.clockCard}>
        <RelogioDigital turnoLabel={turnoAtivo} />

        <Text style={styles.clockSubtitle}>
          Próxima batida sugerida automaticamente
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
            style={[
              styles.primaryActionBtn,
              registrando && styles.primaryActionBtnDisabled,
            ]}
            onPress={registrarPonto}
            disabled={registrando}
            activeOpacity={0.85}
          >
            {registrando ? (
              <ActivityIndicator size="small" color={AntigravityPalette.canvas} />
            ) : (
              <Feather
                name="check-circle"
                size={17}
                color={AntigravityPalette.canvas}
              />
            )}
            <Text style={styles.primaryActionBtnText}>
              {registrando ? 'Registrando batida...' : 'Registrar ponto'}
            </Text>
          </TouchableOpacity>
        </View>

        {feedbackRegistro ? (
          <View style={styles.successBanner}>
            <Feather
              name="check"
              size={14}
              color={AntigravityPalette.emerald}
            />
            <Text style={styles.successBannerText}>{feedbackRegistro}</Text>
          </View>
        ) : null}
      </View>

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
            <View style={styles.headerTextWrap}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                Localização e foto
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
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
              {buscandoGps ? 'Buscando...' : 'Atualizar'}
            </Text>
          </TouchableOpacity>
        </View>

        {erroLocalizacao ? (
          <View style={styles.noticeBanner}>
            <Feather name="info" size={14} color="#92400E" />
            <Text style={styles.noticeBannerText}>{erroLocalizacao}</Text>
          </View>
        ) : null}

        <View style={styles.addressBox}>
          <View style={styles.addressTextCol}>
            <Text style={styles.addressLabel}>Endereço aproximado</Text>
            <Text style={styles.addressPrimary} numberOfLines={2}>
              {enderecoPrincipal}
            </Text>
            <Text style={styles.addressSecondary} numberOfLines={1}>
              {enderecoSecundario}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.mapLinkPill}
            onPress={abrirNoMapa}
            activeOpacity={0.75}
          >
            <Feather
              name="navigation"
              size={12}
              color={AntigravityPalette.cobaltBlue}
            />
            <Text style={styles.mapLinkText}>Mapa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.cameraHeaderRow}>
          <Text style={styles.subSectionLabel} numberOfLines={1}>
            Câmera de comprovação
          </Text>
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
              {cameraExpandida ? 'Recolher' : 'Expandir'}
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
                  Permissão da câmera necessária
                </Text>
                <Text style={styles.permissionText}>
                  Autorize o uso da câmera para fotografar automaticamente no momento do registro.
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
                    style={styles.cameraHalfBtnSecondary}
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
                    <Text
                      style={styles.cameraHalfBtnSecondaryText}
                      numberOfLines={1}
                    >
                      Alternar lente
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cameraHalfBtnPrimary}
                    onPress={() => tirarFotoComprovante(false)}
                  >
                    <Feather
                      name="camera"
                      size={14}
                      color={AntigravityPalette.canvas}
                    />
                    <Text
                      style={styles.cameraHalfBtnPrimaryText}
                      numberOfLines={1}
                    >
                      Fotografar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {fotoUri && (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>
              Foto pronta para anexar ao próximo registro
            </Text>
            <Image source={{ uri: fotoUri }} style={styles.previewImage} />
            <View style={styles.previewFooter}>
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => setFotoUri(null)}
              >
                <Feather
                  name="trash-2"
                  size={13}
                  color={AntigravityPalette.coralRed}
                />
                <Text style={styles.removePhotoText}>Remover foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderCabecalhoHistorico = () => (
    <View style={styles.historyHeaderCard}>
      <View style={styles.historyTopRow}>
        <View style={styles.historyTitleCol}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            Histórico de marcações
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {pontos.length} {pontos.length === 1 ? 'registro disponível' : 'registros disponíveis'}
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

      {ultimoRegistroId ? (
        <View style={styles.quickShortcutsRow}>
          <Link href={`/detalhes/${ultimoRegistroId}`} style={styles.shortcutLink}>
            <Text style={styles.shortcutLinkText}>Marcação mais recente</Text>
          </Link>

          <TouchableOpacity
            style={styles.shortcutButton}
            onPress={abrirUltimoRegistro}
          >
            <Text style={styles.shortcutButtonText}>Abrir comprovante</Text>
            <Feather
              name="arrow-up-right"
              size={13}
              color={AntigravityPalette.cobaltBlue}
            />
          </TouchableOpacity>
        </View>
      ) : null}
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
          renderItem={renderItemHistorico}
        />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  mobileListContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 36,
  },
  wideScrollContainer: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 42,
  },
  wideGrid: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  wideLeftCol: {
    flex: 1,
    maxWidth: 460,
  },
  wideRightCol: {
    flex: 1.15,
  },
  controlColumn: {
    gap: 16,
    marginBottom: 16,
  },
  clockCard: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  clockSubtitle: {
    fontSize: 13,
    color: AntigravityPalette.slate,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
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
    borderRadius: Radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 13,
    color: AntigravityPalette.obsidian,
    marginBottom: 14,
  },
  centeredBtnWrap: {
    alignItems: 'center',
    width: '100%',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AntigravityPalette.obsidian,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radii.pill,
    width: '100%',
    maxWidth: 340,
  },
  primaryActionBtnDisabled: {
    opacity: 0.68,
  },
  primaryActionBtnText: {
    color: AntigravityPalette.canvas,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: AntigravityPalette.emeraldTint,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radii.pill,
    marginTop: 12,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.emerald,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  headerIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  softIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AntigravityPalette.blueTint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
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
    gap: 5,
    backgroundColor: AntigravityPalette.canvas,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    flexShrink: 0,
  },
  ghostPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AntigravityPalette.amberTint,
    padding: 11,
    borderRadius: 12,
    marginBottom: 12,
  },
  noticeBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: AntigravityPalette.canvas,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  addressTextCol: {
    flex: 1,
    minWidth: 0,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AntigravityPalette.muted,
    marginBottom: 2,
  },
  addressPrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    lineHeight: 18,
  },
  addressSecondary: {
    fontSize: 12,
    color: AntigravityPalette.slate,
    marginTop: 2,
  },
  mapLinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AntigravityPalette.blueTint,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    flexShrink: 0,
  },
  mapLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.cobaltBlue,
  },
  divider: {
    height: 1,
    backgroundColor: AntigravityPalette.border,
    marginVertical: 15,
  },
  cameraHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  subSectionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  cameraSection: {
    marginTop: 12,
  },
  permissionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 22,
    backgroundColor: AntigravityPalette.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  permissionDeniedBox: {
    backgroundColor: AntigravityPalette.canvas,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    alignItems: 'center',
    gap: 8,
  },
  permissionDeniedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 12,
    color: AntigravityPalette.slate,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 4,
  },
  cameraContainer: {
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cameraHalfBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.canvas,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  cameraHalfBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.obsidian,
  },
  cameraHalfBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AntigravityPalette.obsidian,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
  },
  cameraHalfBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.canvas,
  },
  previewBox: {
    marginTop: 14,
    backgroundColor: AntigravityPalette.canvas,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AntigravityPalette.muted,
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 156,
    borderRadius: 10,
    backgroundColor: AntigravityPalette.surfaceAlt,
  },
  previewFooter: {
    alignItems: 'center',
    marginTop: 10,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AntigravityPalette.coralTint,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  removePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.coralRed,
  },
  historyHeaderCard: {
    backgroundColor: AntigravityPalette.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: AntigravityPalette.border,
    marginBottom: 12,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  historyTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  compactToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  compactToggleLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: AntigravityPalette.slate,
  },
  quickShortcutsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AntigravityPalette.border,
  },
  shortcutLink: {
    paddingVertical: 4,
  },
  shortcutLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.slate,
  },
  shortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AntigravityPalette.blueTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  shortcutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AntigravityPalette.cobaltBlue,
  },
});
