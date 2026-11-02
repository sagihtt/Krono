const express = require('express');

const app = express();
const PORT = 3000;

// Middleware essencial (Aula 18): interpreta pacotes JSON recebidos no req.body
app.use(express.json());

// Middleware CORS para permitir chamadas do Expo Web e dispositivos móveis na rede local
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});

// ============================================================================
// ROTA AULA 17: Exemplo introdutório de endpoint RESTful (/clima)
// ============================================================================
app.get('/clima', (req, res) => {
  res.status(200).json({
    cidade: 'Brasília - Sede IESB',
    temperatura: 27,
    status: 'Ensolarado',
    servidor: 'Antigravity Express API v1.2.0',
  });
});

// ============================================================================
// BANCO DE DADOS EM MEMÓRIA VOLÁTIL (RAM) — REGISTROS DE PONTO
// ============================================================================
let pontos = [
  {
    id: '1',
    titulo: 'Entrada Matutina',
    categoria: 'Entrada Regular',
    dataHora: '21/09/2026 08:02:14',
    localizacao: 'Sede Principal - Bloco A',
    latitude: -15.7942,
    longitude: -47.8822,
    observacao: 'Registro confirmado via biometria facial e geolocalização.',
    sincronizadoApi: true,
  },
  {
    id: '2',
    titulo: 'Saída para Almoço',
    categoria: 'Intervalo',
    dataHora: '21/09/2026 12:05:30',
    localizacao: 'Sede Principal - Refeitório',
    latitude: -15.7945,
    longitude: -47.8825,
    observacao: 'Saída de intervalo regular de 1 hora.',
    sincronizadoApi: true,
  },
  {
    id: '3',
    titulo: 'Retorno do Almoço',
    categoria: 'Retorno',
    dataHora: '21/09/2026 13:04:18',
    localizacao: 'Sede Principal - Bloco A',
    latitude: -15.7941,
    longitude: -47.8821,
    observacao: 'Retorno pontual de intervalo intrajornada.',
    sincronizadoApi: true,
  },
  {
    id: '4',
    titulo: 'Saída do Expediente',
    categoria: 'Saída Regular',
    dataHora: '21/09/2026 17:31:05',
    localizacao: 'Portaria Central',
    latitude: -15.7948,
    longitude: -47.8819,
    observacao: 'Fim de jornada normal cumprida com sucesso.',
    sincronizadoApi: true,
  },
  {
    id: '5',
    titulo: 'Plantão Extra',
    categoria: 'Hora Extra',
    dataHora: '21/09/2026 19:15:00',
    localizacao: 'Laboratório de TI - Campus Asa Sul',
    latitude: -15.8012,
    longitude: -47.8935,
    observacao: 'Autorizado previamente pela coordenação técnica.',
    sincronizadoApi: true,
  },
];
let proximoPontoId = 6;

// 1. READ (GET /pontos) — Listar todos os registros de ponto
app.get('/pontos', (req, res) => {
  res.status(200).json(pontos);
});

// 2. READ (GET /pontos/:id) — Consultar registro específico por ID na URL (req.params)
app.get('/pontos/:id', (req, res) => {
  const id = String(req.params.id);
  const ponto = pontos.find((p) => String(p.id) === id);

  if (!ponto) {
    return res.status(404).json({ mensagem: 'Registro de ponto não encontrado' });
  }

  res.status(200).json(ponto);
});

// 3. CREATE (POST /pontos) — Cadastrar novo registro via pacote JSON (req.body)
app.post('/pontos', (req, res) => {
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
  } = req.body;

  if (!titulo || !categoria) {
    return res.status(400).json({
      erro: 'Dados inválidos: titulo e categoria são obrigatórios',
    });
  }

  const novoPonto = {
    id: String(proximoPontoId++),
    titulo,
    categoria,
    dataHora: dataHora || new Date().toLocaleString('pt-BR'),
    localizacao: localizacao || 'Sede Principal - Bloco A',
    latitude: Number(latitude ?? -15.7942),
    longitude: Number(longitude ?? -47.8822),
    observacao: observacao || 'Registrado via API RESTful.',
    fotoUri: fotoUri || null,
    anexoPdf: anexoPdf || null,
    sincronizadoApi: true,
  };

  pontos.unshift(novoPonto);
  res.status(201).json(novoPonto);
});

// 4. UPDATE (PUT /pontos/:id) — Atualizar registro existente combinando req.params e req.body
app.put('/pontos/:id', (req, res) => {
  const id = String(req.params.id);
  const ponto = pontos.find((p) => String(p.id) === id);

  if (!ponto) {
    return res.status(404).json({ mensagem: 'Registro de ponto não encontrado' });
  }

  const { titulo, categoria, localizacao, observacao, fotoUri, anexoPdf } = req.body;
  if (!titulo || !categoria) {
    return res.status(400).json({ erro: 'Faltam dados obrigatórios (titulo e categoria)' });
  }

  ponto.titulo = titulo;
  ponto.categoria = categoria;
  if (localizacao !== undefined) ponto.localizacao = localizacao;
  if (observacao !== undefined) ponto.observacao = observacao;
  if (fotoUri !== undefined) ponto.fotoUri = fotoUri;
  if (anexoPdf !== undefined) ponto.anexoPdf = anexoPdf;
  ponto.sincronizadoApi = true;

  res.status(200).json(ponto);
});

// 5. DELETE (DELETE /pontos/:id) — Excluir registro com splice e retornar 204 No Content
app.delete('/pontos/:id', (req, res) => {
  const id = String(req.params.id);
  const indice = pontos.findIndex((p) => String(p.id) === id);

  if (indice === -1) {
    return res.status(404).json({ erro: 'Registro de ponto não encontrado' });
  }

  pontos.splice(indice, 1);
  res.status(204).send();
});

// ============================================================================
// ROTAS ESPELHO DA AULA 18 (/filmes) — Compatibilidade com roteiro Thunder Client
// ============================================================================
let filmes = [
  { id: 1, titulo: 'Interestelar', ano: 2014 },
  { id: 2, titulo: 'Matrix', ano: 1999 },
];
let proximoFilmeId = 3;

app.get('/filmes', (req, res) => {
  res.json(filmes);
});

app.get('/filmes/:id', (req, res) => {
  const id = Number(req.params.id);
  const filme = filmes.find((f) => f.id === id);
  if (!filme) return res.status(404).json({ mensagem: 'Não encontrado' });
  res.json(filme);
});

app.post('/filmes', (req, res) => {
  const { titulo, ano } = req.body;
  if (!titulo || !ano) {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }
  const novoFilme = { id: proximoFilmeId++, titulo, ano: Number(ano) };
  filmes.push(novoFilme);
  res.status(201).json(novoFilme);
});

app.put('/filmes/:id', (req, res) => {
  const id = Number(req.params.id);
  const filme = filmes.find((f) => f.id === id);
  if (!filme) return res.status(404).json({ mensagem: 'Não encontrado' });

  const { titulo, ano } = req.body;
  if (!titulo || !ano) return res.status(400).json({ erro: 'Faltam dados' });

  filme.titulo = titulo;
  filme.ano = Number(ano);
  res.json(filme);
});

app.delete('/filmes/:id', (req, res) => {
  const id = Number(req.params.id);
  const indice = filmes.findIndex((f) => f.id === id);
  if (indice === -1) {
    return res.status(404).json({ erro: 'Não encontrado' });
  }
  filmes.splice(indice, 1);
  res.status(204).send();
});

// ============================================================================
// ROTA AULA 21 (/upload) — Recebimento de arquivos via FormData (multipart/form-data)
// ============================================================================
app.post('/upload', (req, res) => {
  const contentType = req.headers['content-type'] || '';
  res.status(201).json({
    status: 'Recebido com sucesso via FormData',
    contentType,
    recebidoEm: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`API RESTful executando em http://localhost:${PORT}`);
});
