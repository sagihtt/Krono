import { PontoRegistro } from '@/models/ponto';

export const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export type ClimaApiStatus = {
  cidade: string;
  temperatura: number;
  status: string;
  servidor?: string;
};

/**
 * Consulta a rota GET /clima (Aula 17) para verificar conectividade com o servidor Express
 */
export async function consultarStatusApi(
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<ClimaApiStatus> {
  const resposta = await fetch(`${baseUrl}/clima`);
  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao consultar /clima`);
  }
  return resposta.json();
}

/**
 * READ (GET /pontos) — Lista todos os registros de ponto do servidor Node.js/Express
 */
export async function listarPontosApi(
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<PontoRegistro[]> {
  const resposta = await fetch(`${baseUrl}/pontos`);
  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao listar pontos`);
  }
  return resposta.json();
}

/**
 * READ por ID (GET /pontos/:id) — Busca um registro específico via req.params
 */
export async function buscarPontoPorIdApi(
  id: string,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<PontoRegistro> {
  const resposta = await fetch(`${baseUrl}/pontos/${id}`);
  if (resposta.status === 404) {
    throw new Error('Registro não encontrado na API (404 Not Found)');
  }
  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao buscar ponto #${id}`);
  }
  return resposta.json();
}

/**
 * CREATE (POST /pontos) — Envia novo registro em JSON no req.body (Retorna 201 Created)
 */
export async function criarPontoApi(
  dados: Partial<PontoRegistro> & { titulo: string; categoria: string },
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<PontoRegistro> {
  const resposta = await fetch(`${baseUrl}/pontos`, {
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

/**
 * UPDATE (PUT /pontos/:id) — Atualiza registro combinando req.params.id e req.body (Retorna 200 OK)
 */
export async function atualizarPontoApi(
  id: string,
  dados: Partial<PontoRegistro> & { titulo: string; categoria: string },
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<PontoRegistro> {
  const resposta = await fetch(`${baseUrl}/pontos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  if (resposta.status === 404) {
    throw new Error('Registro não encontrado para atualização (404 Not Found)');
  }
  if (resposta.status === 400) {
    const erroBody = await resposta.json();
    throw new Error(erroBody.erro || 'Faltam dados obrigatórios (400 Bad Request)');
  }
  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao atualizar registro`);
  }
  return resposta.json();
}

/**
 * DELETE (DELETE /pontos/:id) — Exclui registro do servidor (Retorna 204 No Content)
 */
export async function excluirPontoApi(
  id: string,
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<void> {
  const resposta = await fetch(`${baseUrl}/pontos/${id}`, {
    method: 'DELETE',
  });

  if (resposta.status === 404) {
    throw new Error('Registro não encontrado para exclusão (404 Not Found)');
  }
  if (resposta.status !== 204 && !resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status} ao excluir registro`);
  }
}

/**
 * UPLOAD (POST /upload) — Envia arquivo via FormData multipart/form-data (Aula 21)
 * Evita converter imagens grandes para Base64 na memória RAM do aparelho.
 */
export async function enviarArquivoFormDataApi(
  arquivo: { uri: string; name: string; mimeType: string },
  baseUrl: string = DEFAULT_API_BASE_URL
): Promise<{ status: string; recebidoEm: string }> {
  const formData = new FormData();
  formData.append('arquivo', {
    uri: arquivo.uri,
    name: arquivo.name,
    type: arquivo.mimeType,
  } as any);

  const resposta = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!resposta.ok) {
    throw new Error(`Falha no upload FormData: HTTP ${resposta.status}`);
  }
  return resposta.json();
}
