import { PONTOS_INICIAIS } from '@/constants/pontosMock';
import {
  PerfilColaborador,
  PontoRegistro,
  PreferenciasApp,
} from '@/models/ponto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PRODUCTION_API_BASE_URL = 'https://krono.engine.lat/api';
export const DEFAULT_API_URL_FALLBACK =
  process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_BASE_URL;

export const STORAGE_KEYS = {
  PONTOS: '@antigravity_ponto:registros',
  PERFIL: '@antigravity_ponto:perfil',
  PREFERENCIAS: '@antigravity_ponto:preferencias',
  TURNO_FAVORITO: '@antigravity_ponto:turno_favorito',
  CLIENT_ID: '@antigravity_ponto:client_id',
} as const;

export const PREFERENCIAS_PADRAO: PreferenciasApp = {
  modoCompacto: false,
  turnoFavorito: 'Diurno (08h às 17h)',
  apiUrl: DEFAULT_API_URL_FALLBACK,
};

let cachedClientId: string | null = null;

export async function obterOuCriarClientIdStorage(): Promise<string> {
  if (cachedClientId) return cachedClientId;

  try {
    const salvo = await AsyncStorage.getItem(STORAGE_KEYS.CLIENT_ID);
    if (salvo && salvo.trim().length > 0) {
      cachedClientId = salvo.trim();
      return cachedClientId;
    }

    const novoId = `krono_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    await AsyncStorage.setItem(STORAGE_KEYS.CLIENT_ID, novoId);
    cachedClientId = novoId;
    return novoId;
  } catch {
    if (!cachedClientId) {
      cachedClientId = `krono_mem_${Math.random().toString(36).slice(2, 10)}`;
    }
    return cachedClientId;
  }
}

export async function salvarTurnoFavoritoStorage(turno: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TURNO_FAVORITO, turno);
}

export async function carregarTurnoFavoritoStorage(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.TURNO_FAVORITO);
}

export async function removerTurnoFavoritoStorage(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.TURNO_FAVORITO);
}

export async function salvarPerfilStorage(
  perfil: PerfilColaborador
): Promise<void> {
  const payload = JSON.stringify({
    ...perfil,
    atualizadoEm: new Date().toLocaleString('pt-BR'),
  });
  await AsyncStorage.setItem(STORAGE_KEYS.PERFIL, payload);
}

export async function carregarPerfilStorage(): Promise<PerfilColaborador | null> {
  const texto = await AsyncStorage.getItem(STORAGE_KEYS.PERFIL);
  return texto ? (JSON.parse(texto) as PerfilColaborador) : null;
}

export async function removerPerfilStorage(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.PERFIL);
}

export async function salvarPontosStorage(
  pontos: PontoRegistro[]
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PONTOS, JSON.stringify(pontos));
}

export async function carregarPontosStorage(): Promise<PontoRegistro[]> {
  const texto = await AsyncStorage.getItem(STORAGE_KEYS.PONTOS);
  if (texto === null) {
    await salvarPontosStorage(PONTOS_INICIAIS);
    return PONTOS_INICIAIS;
  }
  try {
    const lista = JSON.parse(texto) as PontoRegistro[];
    return Array.isArray(lista) ? lista : PONTOS_INICIAIS;
  } catch {
    return PONTOS_INICIAIS;
  }
}

export async function buscarPontoStoragePorId(
  id: string
): Promise<PontoRegistro | null> {
  const lista = await carregarPontosStorage();
  return lista.find((item) => String(item.id) === String(id)) ?? null;
}

export async function atualizarPontoNoStorage(
  pontoAtualizado: PontoRegistro
): Promise<PontoRegistro[]> {
  const lista = await carregarPontosStorage();
  const novaLista = lista.map((item) =>
    String(item.id) === String(pontoAtualizado.id) ? pontoAtualizado : item
  );
  await salvarPontosStorage(novaLista);
  return novaLista;
}

export async function excluirPontoDoStorage(
  id: string
): Promise<PontoRegistro[]> {
  const lista = await carregarPontosStorage();
  const novaLista = lista.filter((item) => String(item.id) !== String(id));
  await salvarPontosStorage(novaLista);
  return novaLista;
}

export async function salvarPreferenciasStorage(
  prefs: PreferenciasApp
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCIAS, JSON.stringify(prefs));
}

export async function carregarPreferenciasStorage(): Promise<PreferenciasApp> {
  const texto = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCIAS);
  if (!texto) return PREFERENCIAS_PADRAO;

  try {
    const lido = JSON.parse(texto) as Partial<PreferenciasApp>;
    const urlSalva = lido.apiUrl?.trim();
    // migra valores legados gravados em versões anteriores do app
    const urlFinal =
      !urlSalva || urlSalva === 'http://localhost:3000'
        ? DEFAULT_API_URL_FALLBACK
        : urlSalva;

    const turnoSalvo =
      lido.turnoFavorito === 'Diurno Comercial (08h às 17h)'
        ? PREFERENCIAS_PADRAO.turnoFavorito
        : lido.turnoFavorito || PREFERENCIAS_PADRAO.turnoFavorito;

    return {
      ...PREFERENCIAS_PADRAO,
      ...lido,
      turnoFavorito: turnoSalvo,
      apiUrl: urlFinal,
    };
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}

export async function listarChavesStorage(): Promise<readonly string[]> {
  return AsyncStorage.getAllKeys();
}

export async function inspecionarMultiGetStorage(): Promise<
  Record<string, string | null>
> {
  const chaves = await AsyncStorage.getAllKeys();
  if (chaves.length === 0) return {};
  const pares = await AsyncStorage.multiGet(chaves);
  const mapa: Record<string, string | null> = {};
  for (const [k, v] of pares) {
    mapa[k] = v;
  }
  return mapa;
}

export async function limparTodoStorage(): Promise<void> {
  cachedClientId = null;
  await AsyncStorage.clear();
}
