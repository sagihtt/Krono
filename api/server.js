const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = Number(process.env.PORT || 3000);
const DEFAULT_DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

const PONTOS_SEMENTE = [
  {
    id: '5',
    titulo: 'Plantão Extra',
    categoria: 'Hora Extra',
    dataHora: '10/11/2026 19:15:00',
    localizacao: 'Laboratório de TI - Campus Asa Sul',
    latitude: -15.8012,
    longitude: -47.8935,
    observacao: 'Autorizado previamente pela coordenação técnica.',
    sincronizadoApi: true,
  },
  {
    id: '4',
    titulo: 'Saída do Expediente',
    categoria: 'Saída Regular',
    dataHora: '10/11/2026 17:31:05',
    localizacao: 'Portaria Central',
    latitude: -15.7948,
    longitude: -47.8819,
    observacao: 'Fim de jornada normal cumprida.',
    sincronizadoApi: true,
  },
  {
    id: '3',
    titulo: 'Retorno do Almoço',
    categoria: 'Retorno',
    dataHora: '10/11/2026 13:04:18',
    localizacao: 'Sede Principal - Bloco A',
    latitude: -15.7941,
    longitude: -47.8821,
    observacao: 'Retorno pontual de intervalo intrajornada.',
    sincronizadoApi: true,
  },
  {
    id: '2',
    titulo: 'Saída para Almoço',
    categoria: 'Intervalo',
    dataHora: '10/11/2026 12:05:30',
    localizacao: 'Sede Principal - Refeitório',
    latitude: -15.7945,
    longitude: -47.8825,
    observacao: 'Saída de intervalo regular de 1 hora.',
    sincronizadoApi: true,
  },
  {
    id: '1',
    titulo: 'Entrada Matutina',
    categoria: 'Entrada Regular',
    dataHora: '10/11/2026 08:02:14',
    localizacao: 'Sede Principal - Bloco A',
    latitude: -15.7942,
    longitude: -47.8822,
    observacao: 'Registro confirmado via biometria facial e geolocalização.',
    sincronizadoApi: true,
  },
];

const FILMES_SEMENTE = [
  { id: 1, titulo: 'Interestelar', ano: 2014 },
  { id: 2, titulo: 'Matrix', ano: 1999 },
];

const EXTENSOES_PERMITIDAS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.txt',
]);

function clonar(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function sanitizarClientId(raw) {
  if (!raw || typeof raw !== 'string') return 'default';
  const limpo = raw.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return limpo || 'default';
}

function extrairPrimeiroArquivoMultipart(buffer, contentTypeHeader) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  const matchBoundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(
    contentTypeHeader || ''
  );
  if (!matchBoundary) return null;

  const boundaryStr = `--${(matchBoundary[1] || matchBoundary[2]).trim()}`;
  const boundaryBuf = Buffer.from(boundaryStr, 'latin1');
  const headerSep = Buffer.from('\r\n\r\n', 'latin1');

  let pos = buffer.indexOf(boundaryBuf);
  while (pos !== -1) {
    const startPart = pos + boundaryBuf.length;
    if (
      buffer[startPart] === 0x2d &&
      buffer[startPart + 1] === 0x2d
    ) {
      break; // "--" final boundary
    }

    const contentStart =
      buffer[startPart] === 0x0d && buffer[startPart + 1] === 0x0a
        ? startPart + 2
        : startPart;

    const nextBoundary = buffer.indexOf(boundaryBuf, contentStart);
    if (nextBoundary === -1) break;

    const headerEnd = buffer.indexOf(headerSep, contentStart);
    if (headerEnd !== -1 && headerEnd < nextBoundary) {
      const rawHeaders = buffer.subarray(contentStart, headerEnd).toString('utf8');
      const filenameMatch = /filename="([^"]*)"/i.exec(rawHeaders);
      if (filenameMatch && filenameMatch[1]) {
        const mimeMatch = /Content-Type:\s*([^\r\n;]+)/i.exec(rawHeaders);
        // Strip trailing \r\n before next boundary
        let bodyEnd = nextBoundary;
        if (
          bodyEnd >= 2 &&
          buffer[bodyEnd - 2] === 0x0d &&
          buffer[bodyEnd - 1] === 0x0a
        ) {
          bodyEnd -= 2;
        }
        const fileData = buffer.subarray(headerEnd + 4, bodyEnd);
        return {
          originalName: path.basename(filenameMatch[1]),
          mimeType: mimeMatch ? mimeMatch[1].trim() : 'application/octet-stream',
          data: fileData,
        };
      }
    }
    pos = nextBoundary;
  }
  return null;
}

function obterPublicBaseUrl(req) {
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http')
    .toString()
    .split(',')[0]
    .trim();
  const host = (
    req.headers['x-forwarded-host'] ||
    req.headers.host ||
    `localhost:${DEFAULT_PORT}`
  )
    .toString()
    .split(',')[0]
    .trim();
  const prefix = (req.headers['x-forwarded-prefix'] || '')
    .toString()
    .replace(/\/+$/, '');
  return `${proto}://${host}${prefix}`;
}

function createApp(options = {}) {
  const dataDir = options.dataDir || DEFAULT_DATA_DIR;
  const uploadsDir = path.join(dataDir, 'uploads');
  const dbPath = path.join(dataDir, 'db.json');

  fs.mkdirSync(uploadsDir, { recursive: true });

  function criarEstadoInicial() {
    return {
      versao: 1,
      clientes: {
        default: {
          proximoPontoId: 6,
          pontos: clonar(PONTOS_SEMENTE),
        },
      },
      filmes: {
        proximoFilmeId: 3,
        lista: clonar(FILMES_SEMENTE),
      },
    };
  }

  function carregarBanco() {
    try {
      if (fs.existsSync(dbPath)) {
        const lido = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (lido && typeof lido === 'object' && lido.clientes) {
          if (!lido.filmes) {
            lido.filmes = { proximoFilmeId: 3, lista: clonar(FILMES_SEMENTE) };
          }
          return lido;
        }
      }
    } catch (erro) {
      console.error('Aviso: falha ao ler db.json, recriando estrutura:', erro);
    }
    const inicial = criarEstadoInicial();
    salvarBancoAtomico(inicial);
    return inicial;
  }

  function salvarBancoAtomico(estado) {
    const tmpPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(estado, null, 2), 'utf8');
    fs.renameSync(tmpPath, dbPath);
  }

  const db = carregarBanco();

  function obterColecaoCliente(req) {
    const rawId = req.headers['x-krono-client-id'] || req.query.clientId || 'default';
    const chave = sanitizarClientId(String(rawId));
    if (!db.clientes[chave]) {
      db.clientes[chave] = {
        proximoPontoId: 6,
        pontos: clonar(PONTOS_SEMENTE),
      };
      salvarBancoAtomico(db);
    }
    return db.clientes[chave];
  }

  const app = express();
  app.disable('x-powered-by');

  // CORS completo com suporte ao header X-Krono-Client-Id
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Krono-Client-Id'
    );
    if (req.method === 'OPTIONS') {
      return res.status(204).send();
    }
    next();
  });

  // Arquivos enviados disponiveis em /uploads/*
  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

  // Rota /upload usa parser binario dedicado antes do express.json()
  app.post(
    '/upload',
    express.raw({ type: () => true, limit: '12mb' }),
    (req, res) => {
      const contentType = req.headers['content-type'] || '';
      const recebidoEm = new Date().toISOString();
      const extraido = extrairPrimeiroArquivoMultipart(req.body, contentType);

      if (!extraido) {
        return res.status(201).json({
          status: 'Recebido com sucesso via FormData',
          contentType,
          recebidoEm,
        });
      }

      let ext = path.extname(extraido.originalName).toLowerCase();
      if (!EXTENSOES_PERMITIDAS.has(ext)) {
        if (extraido.mimeType === 'application/pdf') ext = '.pdf';
        else if (extraido.mimeType === 'image/png') ext = '.png';
        else ext = '.jpg';
      }

      const sufixo = crypto.randomBytes(6).toString('hex');
      const nomeSeguro = `comprovante-${Date.now()}-${sufixo}${ext}`;
      const destino = path.join(uploadsDir, nomeSeguro);
      fs.writeFileSync(destino, extraido.data);

      const arquivoUrl = `${obterPublicBaseUrl(req)}/uploads/${nomeSeguro}`;
      return res.status(201).json({
        status: 'Recebido com sucesso via FormData',
        contentType,
        recebidoEm,
        arquivoNome: nomeSeguro,
        arquivoUrl,
      });
    }
  );

  app.use(express.json({ limit: '5mb' }));

  // Rota raiz da API (exibida ao acessar https://krono.engine.lat/api no navegador)
  app.get('/', (req, res) => {
    const base = obterPublicBaseUrl(req);
    res.status(200).json({
      status: 'online',
      servico: 'Krono Express API',
      versao: '2.3.0',
      rotas: {
        health: `${base}/health`,
        clima: `${base}/clima`,
        pontos: `${base}/pontos`,
        upload: `${base}/upload`,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Healthcheck de producao e Docker
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      servico: 'krono-api',
      versao: '2.3.0',
      clientesAtivos: Object.keys(db.clientes).length,
      timestamp: new Date().toISOString(),
    });
  });

  // Verificacao de conectividade utilizada pelo aplicativo (/clima)
  app.get('/clima', (req, res) => {
    res.status(200).json({
      cidade: 'Brasília - Sede Principal',
      temperatura: 27,
      status: 'Ensolarado',
      servidor: 'Krono Express API v2.3.0',
    });
  });

  // 1. READ (GET /pontos)
  app.get('/pontos', (req, res) => {
    const colecao = obterColecaoCliente(req);
    res.status(200).json(colecao.pontos);
  });

  // 2. READ por ID (GET /pontos/:id)
  app.get('/pontos/:id', (req, res) => {
    const colecao = obterColecaoCliente(req);
    const id = String(req.params.id);
    const ponto = colecao.pontos.find((p) => String(p.id) === id);

    if (!ponto) {
      return res.status(404).json({ mensagem: 'Registro de ponto não encontrado' });
    }

    res.status(200).json(ponto);
  });

  // 3. CREATE (POST /pontos)
  app.post('/pontos', (req, res) => {
    const colecao = obterColecaoCliente(req);
    const {
      titulo,
      categoria,
      dataHora,
      localizacao,
      latitude,
      longitude,
      observacao,
      fotoUri,
      anexoPdf,
    } = req.body || {};

    if (!titulo || !categoria) {
      return res.status(400).json({
        erro: 'Dados inválidos: titulo e categoria são obrigatórios',
      });
    }

    let novoId = String(colecao.proximoPontoId++);
    while (colecao.pontos.some((p) => String(p.id) === novoId)) {
      novoId = String(colecao.proximoPontoId++);
    }

    const novoPonto = {
      id: novoId,
      titulo: String(titulo).trim(),
      categoria: String(categoria).trim(),
      dataHora: dataHora || new Date().toLocaleString('pt-BR'),
      localizacao: localizacao || 'Sede Principal - Bloco A',
      latitude: Number(latitude ?? -15.7942),
      longitude: Number(longitude ?? -47.8822),
      observacao: observacao || 'Registrado via servidor online.',
      fotoUri: fotoUri || null,
      anexoPdf: anexoPdf || null,
      sincronizadoApi: true,
    };

    colecao.pontos.unshift(novoPonto);
    salvarBancoAtomico(db);
    res.status(201).json(novoPonto);
  });

  // 4. UPDATE (PUT /pontos/:id)
  app.put('/pontos/:id', (req, res) => {
    const colecao = obterColecaoCliente(req);
    const id = String(req.params.id);
    const ponto = colecao.pontos.find((p) => String(p.id) === id);

    if (!ponto) {
      return res.status(404).json({ mensagem: 'Registro de ponto não encontrado' });
    }

    const {
      titulo,
      categoria,
      dataHora,
      localizacao,
      latitude,
      longitude,
      observacao,
      fotoUri,
      anexoPdf,
    } = req.body || {};

    if (!titulo || !categoria) {
      return res
        .status(400)
        .json({ erro: 'Faltam dados obrigatórios (titulo e categoria)' });
    }

    ponto.titulo = String(titulo).trim();
    ponto.categoria = String(categoria).trim();
    if (dataHora !== undefined) ponto.dataHora = dataHora;
    if (localizacao !== undefined) ponto.localizacao = localizacao;
    if (latitude !== undefined) ponto.latitude = Number(latitude);
    if (longitude !== undefined) ponto.longitude = Number(longitude);
    if (observacao !== undefined) ponto.observacao = observacao;
    if (fotoUri !== undefined) ponto.fotoUri = fotoUri;
    if (anexoPdf !== undefined) ponto.anexoPdf = anexoPdf;
    ponto.sincronizadoApi = true;

    salvarBancoAtomico(db);
    res.status(200).json(ponto);
  });

  // 5. DELETE (DELETE /pontos/:id)
  app.delete('/pontos/:id', (req, res) => {
    const colecao = obterColecaoCliente(req);
    const id = String(req.params.id);
    const indice = colecao.pontos.findIndex((p) => String(p.id) === id);

    if (indice === -1) {
      return res.status(404).json({ erro: 'Registro de ponto não encontrado' });
    }

    colecao.pontos.splice(indice, 1);
    salvarBancoAtomico(db);
    res.status(204).send();
  });

  // Rotas /filmes mantidas com persistencia
  app.get('/filmes', (req, res) => {
    res.json(db.filmes.lista);
  });

  app.get('/filmes/:id', (req, res) => {
    const id = Number(req.params.id);
    const filme = db.filmes.lista.find((f) => f.id === id);
    if (!filme) return res.status(404).json({ mensagem: 'Não encontrado' });
    res.json(filme);
  });

  app.post('/filmes', (req, res) => {
    const { titulo, ano } = req.body || {};
    if (!titulo || !ano) {
      return res.status(400).json({ erro: 'Dados inválidos' });
    }
    const novoFilme = {
      id: db.filmes.proximoFilmeId++,
      titulo,
      ano: Number(ano),
    };
    db.filmes.lista.push(novoFilme);
    salvarBancoAtomico(db);
    res.status(201).json(novoFilme);
  });

  app.put('/filmes/:id', (req, res) => {
    const id = Number(req.params.id);
    const filme = db.filmes.lista.find((f) => f.id === id);
    if (!filme) return res.status(404).json({ mensagem: 'Não encontrado' });

    const { titulo, ano } = req.body || {};
    if (!titulo || !ano) return res.status(400).json({ erro: 'Faltam dados' });

    filme.titulo = titulo;
    filme.ano = Number(ano);
    salvarBancoAtomico(db);
    res.json(filme);
  });

  app.delete('/filmes/:id', (req, res) => {
    const id = Number(req.params.id);
    const indice = db.filmes.lista.findIndex((f) => f.id === id);
    if (indice === -1) {
      return res.status(404).json({ erro: 'Não encontrado' });
    }
    db.filmes.lista.splice(indice, 1);
    salvarBancoAtomico(db);
    res.status(204).send();
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(DEFAULT_PORT, '0.0.0.0', () => {
    console.log(`Krono API v2.3.0 executando em http://0.0.0.0:${DEFAULT_PORT}`);
  });
}

module.exports = { createApp, sanitizarClientId };
