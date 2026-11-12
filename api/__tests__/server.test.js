const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, describe, it } = require('node:test');

const { createApp, sanitizarClientId } = require('../server');

describe('Krono API v2.3.0 — Contrato REST, Isolamento e Persistencia', () => {
  let tempDir;
  let server;
  let baseUrl;

  before(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'krono-api-test-'));
    const app = createApp({ dataDir: tempDir });
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('sanitiza identificadores de cliente de forma segura', () => {
    assert.equal(sanitizarClientId('krono_abc-123'), 'krono_abc-123');
    assert.equal(sanitizarClientId('../../../etc/passwd'), 'etcpasswd');
    assert.equal(sanitizarClientId('   '), 'default');
    assert.equal(sanitizarClientId(null), 'default');
  });

  it('responde /health e /clima com status 200 e CORS liberando X-Krono-Client-Id', async () => {
    const preflight = await fetch(`${baseUrl}/pontos`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:8081',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, X-Krono-Client-Id',
      },
    });
    assert.equal(preflight.status, 204);
    assert.match(
      preflight.headers.get('access-control-allow-headers') || '',
      /X-Krono-Client-Id/i
    );

    const rootResp = await fetch(`${baseUrl}/`);
    assert.equal(rootResp.status, 200);
    const rootJson = await rootResp.json();
    assert.equal(rootJson.status, 'online');
    assert.ok(rootJson.rotas.pontos.endsWith('/pontos'));

    const healthResp = await fetch(`${baseUrl}/health`);
    assert.equal(healthResp.status, 200);
    const health = await healthResp.json();
    assert.equal(health.status, 'ok');
    assert.equal(health.versao, '2.3.0');

    const climaResp = await fetch(`${baseUrl}/clima`);
    assert.equal(climaResp.status, 200);
    const clima = await climaResp.json();
    assert.equal(typeof clima.temperatura, 'number');
    assert.ok(clima.cidade.length > 0);
  });

  it('isola colecoes de pontos por X-Krono-Client-Id e executa CRUD completo', async () => {
    const headersA = {
      'Content-Type': 'application/json',
      'X-Krono-Client-Id': 'device_colaborador_A',
    };
    const headersB = {
      'Content-Type': 'application/json',
      'X-Krono-Client-Id': 'device_colaborador_B',
    };

    const inicialAResp = await fetch(`${baseUrl}/pontos`, { headers: headersA });
    assert.equal(inicialAResp.status, 200);
    const inicialA = await inicialAResp.json();
    assert.equal(inicialA.length, 5);

    const invalidoResp = await fetch(`${baseUrl}/pontos`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({ titulo: '' }),
    });
    assert.equal(invalidoResp.status, 400);

    const criarResp = await fetch(`${baseUrl}/pontos`, {
      method: 'POST',
      headers: headersA,
      body: JSON.stringify({
        titulo: 'Registro #6 - Entrada Regular',
        categoria: 'Entrada Regular',
        dataHora: '11/11/2026 08:00:00',
        localizacao: 'Unidade Asa Norte',
        latitude: -15.7588,
        longitude: -47.8832,
        observacao: 'Teste automatizado',
      }),
    });
    assert.equal(criarResp.status, 201);
    const criado = await criarResp.json();
    assert.equal(criado.sincronizadoApi, true);
    assert.equal(criado.categoria, 'Entrada Regular');

    const listaBResp = await fetch(`${baseUrl}/pontos`, { headers: headersB });
    const listaB = await listaBResp.json();
    assert.equal(listaB.length, 5);

    const putResp = await fetch(`${baseUrl}/pontos/${criado.id}`, {
      method: 'PUT',
      headers: headersA,
      body: JSON.stringify({
        titulo: 'Registro #6 - Entrada Ajustada',
        categoria: 'Entrada Regular',
        observacao: 'Com atestado PDF vinculado',
        anexoPdf: {
          uri: 'https://engine.lat/krono-api/uploads/atestado.pdf',
          nome: 'atestado.pdf',
          tamanho: 2048,
          mimeType: 'application/pdf',
        },
      }),
    });
    assert.equal(putResp.status, 200);
    const atualizado = await putResp.json();
    assert.equal(atualizado.titulo, 'Registro #6 - Entrada Ajustada');
    assert.equal(atualizado.anexoPdf.nome, 'atestado.pdf');

    const getIdResp = await fetch(`${baseUrl}/pontos/${criado.id}`, {
      headers: headersA,
    });
    assert.equal(getIdResp.status, 200);
    const lidoPorId = await getIdResp.json();
    assert.equal(lidoPorId.anexoPdf.nome, 'atestado.pdf');

    const naoExisteResp = await fetch(`${baseUrl}/pontos/99999`, {
      headers: headersA,
    });
    assert.equal(naoExisteResp.status, 404);
  });

  it('respeita exclusao total sem recriar mocks e persiste dados apos reinicio', async () => {
    const headersC = {
      'Content-Type': 'application/json',
      'X-Krono-Client-Id': 'device_limpo_C',
    };

    const listaResp = await fetch(`${baseUrl}/pontos`, { headers: headersC });
    const lista = await listaResp.json();
    assert.equal(lista.length, 5);

    for (const item of lista) {
      const delResp = await fetch(`${baseUrl}/pontos/${item.id}`, {
        method: 'DELETE',
        headers: headersC,
      });
      assert.equal(delResp.status, 204);
    }

    const vaziaResp = await fetch(`${baseUrl}/pontos`, { headers: headersC });
    const vazia = await vaziaResp.json();
    assert.deepEqual(vazia, []);

    const appReiniciado = createApp({ dataDir: tempDir });
    const server2 = await new Promise((resolve) => {
      const s = appReiniciado.listen(0, '127.0.0.1', () => resolve(s));
    });
    const url2 = `http://127.0.0.1:${server2.address().port}`;

    try {
      const vaziaPosReinicio = await (
        await fetch(`${url2}/pontos`, { headers: headersC })
      ).json();
      assert.deepEqual(vaziaPosReinicio, []);

      const listaAPosReinicio = await (
        await fetch(`${url2}/pontos`, {
          headers: { 'X-Krono-Client-Id': 'device_colaborador_A' },
        })
      ).json();
      assert.equal(listaAPosReinicio.length, 6);
      assert.equal(listaAPosReinicio[0].titulo, 'Registro #6 - Entrada Ajustada');
    } finally {
      await new Promise((resolve) => server2.close(resolve));
    }
  });

  it('grava arquivos reais no POST /upload e disponibiliza download em /uploads/*', async () => {
    const conteudoBinario = Buffer.from('%PDF-1.4 Conteudo de teste Krono\n', 'utf8');
    const boundary = '----KronoTestBoundary987654';
    const cabecalho = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="arquivo"; filename="atestado-medico.pdf"\r\n` +
        `Content-Type: application/pdf\r\n\r\n`,
      'utf8'
    );
    const rodape = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const payload = Buffer.concat([cabecalho, conteudoBinario, rodape]);

    const uploadResp = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'X-Forwarded-Proto': 'https',
        'X-Forwarded-Host': 'engine.lat',
        'X-Forwarded-Prefix': '/krono-api',
      },
      body: payload,
    });

    assert.equal(uploadResp.status, 201);
    const json = await uploadResp.json();
    assert.equal(json.status, 'Recebido com sucesso via FormData');
    assert.ok(json.arquivoUrl.startsWith('https://engine.lat/krono-api/uploads/'));
    assert.ok(json.arquivoNome.endsWith('.pdf'));

    const downloadResp = await fetch(`${baseUrl}/uploads/${json.arquivoNome}`);
    assert.equal(downloadResp.status, 200);
    const baixado = Buffer.from(await downloadResp.arrayBuffer());
    assert.deepEqual(baixado, conteudoBinario);
  });

  it('mantem compatibilidade com CRUD /filmes', async () => {
    const getResp = await fetch(`${baseUrl}/filmes`);
    assert.equal(getResp.status, 200);
    const filmes = await getResp.json();
    assert.equal(filmes.length, 2);

    const postResp = await fetch(`${baseUrl}/filmes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Duna', ano: 2021 }),
    });
    assert.equal(postResp.status, 201);
    const novo = await postResp.json();
    assert.equal(novo.titulo, 'Duna');
  });
});
