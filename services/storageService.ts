import { PONTOS_INICIAIS } from '@/constants/pontosMock';
import {
  PerfilColaborador,
  PontoRegistro,
  PreferenciasApp,
} from '@/models/ponto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_BASE_URL } from './apiService';

export const STORAGE_KEYS = {
  PONTOS: '@antigravity_ponto:registros',
  PERFIL: '@antigravity_ponto:perfil',
  PREFERENCIAS: '@antigravity_ponto:preferencias',
  TURNO_FAVORITO: '@antigravity_ponto:turno_favorito',
} as const;

export const PREFERENCIAS_PADRAO: PreferenciasApp = {
  modoCompacto: false,
  turnoFavorito: 'Diurno Comercial (08h às 17h)',
  apiUrl: DEFAULT_API_BASE_URL,
};

// ============================================================================
// PRÁTICA 1 A 3 (AULA 19): String Simples (setItem, getItem, removeItem)
// ============================================================================
export async function salvarTurnoFavoritoStorage(turno: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TURNO_FAVORITO, turno);
}

export async function carregarTurnoFavoritoStorage(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.TURNO_FAVORITO);
}

export async function removerTurnoFavoritoStorage(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.TURNO_FAVORITO);
}

// ============================================================================
// PRÁTICA 5 (AULA 19): Objetos JSON com JSON.stringify() e JSON.parse()
// Nota de Segurança (Aula 19): Senhas NUNCA são salvas no AsyncStorage por
// não possuir criptografia padrão.
// ============================================================================
export async function salvarPerfilStorage(perfil: PerfilColaborador): Promise<void> {
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

// ============================================================================
// PERSISTÊNCIA DA LISTA DE REGISTROS DE PONTO (JSON Array)
// ============================================================================
export async function salvarPontosStorage(pontos: PontoRegistro[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PONTOS, JSON.stringify(pontos));
}

export async function carregarPontosStorage(): Promise<PontoRegistro[]> {
  const texto = await AsyncStorage.getItem(STORAGE_KEYS.PONTOS);
  if (!texto) {
    await salvarPontosStorage(PONTOS_INICIAIS);
    return PONTOS_INICIAIS;
  }
  const lista = JSON.parse(texto) as PontoRegistro[];
  return Array.isArray(lista) && lista.length > 0 ? lista : PONTOS_INICIAIS;
}

export async function buscarPontoStoragePorId(id: string): Promise<PontoRegistro | null> {
  const lista = await carregarPontosStorage();
  return lista.find((item) => String(item.id) === String(id)) ?? null;
}

export async function atualizarPontoNoStorage(pontoAtualizado: PontoRegistro): Promise<PontoRegistro[]> {
  const lista = await carregarPontosStorage();
  const novaLista = lista.map((item) =>
    String(item.id) === String(pontoAtualizado.id) ? pontoAtualizado : item
  );
  await salvarPontosStorage(novaLista);
  return novaLista;
}

export async function excluirPontoDoStorage(id: string): Promise<PontoRegistro[]> {
  const lista = await carregarPontosStorage();
  const novaLista = lista.filter((item) => String(item.id) !== String(id));
  await salvarPontosStorage(novaLista);
  return novaLista;
}

// ============================================================================
// PREFERÊNCIAS DO APLICATIVO E MÉTODOS EM LOTE (getAllKeys, multiGet, clear)
// ============================================================================
export async function salvarPreferenciasStorage(prefs: PreferenciasApp): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCIAS, JSON.stringify(prefs));
}

export async function carregarPreferenciasStorage(): Promise<PreferenciasApp> {
  const texto = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCIAS);
  if (!texto) return PREFERENCIAS_PADRAO;
  return { ...PREFERENCIAS_PADRAO, ...(JSON.parse(texto) as Partial<PreferenciasApp>) };
}

export async function listarChavesStorage(): Promise<readonly string[]> {
  return AsyncStorage.getAllKeys();
}

export async function inspecionarMultiGetStorage(): Promise<Record<string, string | null>> {
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
  await AsyncStorage.clear();
}
