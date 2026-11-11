import { PontoRegistro } from '@/models/ponto';
import { Platform } from 'react-native';
import {
  DEFAULT_API_URL_FALLBACK,
  obterOuCriarClientIdStorage,
} from './storageService';

export const DEFAULT_API_BASE_URL = DEFAULT_API_URL_FALLBACK;

const DEFAULT_JSON_TIMEOUT_MS = 4500;
const DEFAULT_UPLOAD_TIMEOUT_MS = 15000;

export type ClimaApiStatus = {
  cidade: string;
  temperatura: number;
  status: string;
  servidor?: string;
};

export type UploadApiResposta = {
  status: string;
  recebidoEm: string;
  arquivoNome?: string;
  arquivoUrl?: string;
};

function normalizarUrl(baseUrl: string): string {
  return (baseUrl || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
}

export async function fetchComTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_JSON_TIMEOUT_MS
): Promise<Response> {
  const clientId = await obterOuCriarClientIdStorage();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(init.headers || {});
  if (!headers.has('X-Krono-Client-Id')) {
    headers.set('X-Krono-Client-Id', clientId);
  }

  try {
    return await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function consultarStatusApi(
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<ClimaApiStatus> {
  const resposta = await fetchComTimeout(`${normalizarUrl(baseUrl)}/clima`);
  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao consultar /clima`);
  }
  return resposta.json();
}

export async function listarPontosApi(
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<PontoRegistro[]> {
  const resposta = await fetchComTimeout(`${normalizarUrl(baseUrl)}/pontos`);
  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao listar pontos`);
  }
  return resposta.json();
}

export async function buscarPontoPorIdApi(
  id: string,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<PontoRegistro> {
  const resposta = await fetchComTimeout(
    `${normalizarUrl(baseUrl)}/pontos/${encodeURIComponent(id)}`
  );
  if (resposta.status === 404) {
    throw new Error('Registro não encontrado na API (404 Not Found)');
  }
  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao buscar ponto #${id}`);
  }
  return resposta.json();
}

export async function criarPontoApi(
  dados: Partial<PontoRegistro> & { titulo: string; categoria: string },
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<PontoRegistro> {
  const resposta = await fetchComTimeout(`${normalizarUrl(baseUrl)}/pontos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  if (resposta.status === 400) {
    const erroBody = await resposta.json();
    throw new Error(erroBody.erro || 'Dados inválidos (400 Bad Request)');
  }
  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao criar registro`);
  }
  return resposta.json();
}

export async function atualizarPontoApi(
  id: string,
  dados: Partial<PontoRegistro> & { titulo: string; categoria: string },
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<PontoRegistro> {
  const resposta = await fetchComTimeout(
    `${normalizarUrl(baseUrl)}/pontos/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    }
  );

  if (resposta.status === 404) {
    throw new Error('Registro não encontrado para atualização (404 Not Found)');
  }
  if (resposta.status === 400) {
    const erroBody = await resposta.json();
    throw new Error(
      erroBody.erro || 'Faltam dados obrigatórios (400 Bad Request)'
    );
  }
  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao atualizar registro`);
  }
  return resposta.json();
}

export async function excluirPontoApi(
  id: string,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<void> {
  const resposta = await fetchComTimeout(
    `${normalizarUrl(baseUrl)}/pontos/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );

  if (resposta.status === 404) {
    throw new Error('Registro não encontrado para exclusão (404 Not Found)');
  }
  if (resposta.status !== 204 && !resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao excluir registro`);
  }
}

export async function enviarArquivoFormDataApi(
  arquivo: { uri: string; name: string; mimeType: string },
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<UploadApiResposta> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const respLocal = await fetch(arquivo.uri);
    const blob = await respLocal.blob();
    formData.append('arquivo', blob, arquivo.name);
  } else {
    formData.append('arquivo', {
      uri: arquivo.uri,
      name: arquivo.name,
      type: arquivo.mimeType,
    } as any);
  }

  const resposta = await fetchComTimeout(
    `${normalizarUrl(baseUrl)}/upload`,
    {
      method: 'POST',
      body: formData,
    },
    DEFAULT_UPLOAD_TIMEOUT_MS
  );

  if (!resposta.ok) {
    throw new Error(`Falha no upload: HTTP ${resposta.status}`);
  }
  return resposta.json();
}
