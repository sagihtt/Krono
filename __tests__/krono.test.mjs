import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

import ts from 'typescript';

async function carregarModuloTs(relPath) {
  const fullPath = path.join(ROOT, relPath);
  const codigo = fs.readFileSync(fullPath, 'utf8');
  const js = ts.transpileModule(codigo, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
  return import(dataUrl);
}

function listarArquivosRecursivo(dir, exts) {
  const resultado = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      resultado.push(...listarArquivosRecursivo(caminho, exts));
    } else if (exts.some((ext) => entrada.name.endsWith(ext))) {
      resultado.push(caminho);
    }
  }
  return resultado;
}

describe('Krono App v2.3.0 — Utilitarios, Regras de Negocio e Auditoria AGENTS.md', () => {
  it('aplica mascaras de CPF, telefone fixo/celular e data corretamente', async () => {
    const { maskCPF, maskPhone, maskDate } = await carregarModuloTs(
      'utils/masks.ts'
    );

    assert.equal(maskCPF('12345678901'), '123.456.789-01');
    assert.equal(maskCPF('123.456.789-01999'), '123.456.789-01');
    assert.equal(maskCPF('abc04589122177xyz'), '045.891.221-77');

    assert.equal(maskPhone('61988887777'), '(61) 98888-7777');
    assert.equal(maskPhone('6133224455'), '(61) 3322-4455');
    assert.equal(maskPhone('(61) 99999-888877'), '(61) 99999-8888');

    assert.equal(maskDate('15081998'), '15/08/1998');
    assert.equal(maskDate('15/08/199899'), '15/08/1998');
  });

  it('sugere automaticamente a proxima categoria da jornada na sequencia correta', async () => {
    const { sugerirProximaCategoria, formatarLinkMapa } = await carregarModuloTs(
      'utils/jornada.ts'
    );

    assert.equal(sugerirProximaCategoria([]), 'Entrada Regular');
    assert.equal(
      sugerirProximaCategoria([{ categoria: 'Entrada Regular' }]),
      'Intervalo'
    );
    assert.equal(
      sugerirProximaCategoria([{ categoria: 'Intervalo' }]),
      'Retorno'
    );
    assert.equal(
      sugerirProximaCategoria([{ categoria: 'Retorno' }]),
      'Saída Regular'
    );
    assert.equal(
      sugerirProximaCategoria([{ categoria: 'Saída Regular' }]),
      'Hora Extra'
    );
    assert.equal(
      sugerirProximaCategoria([{ categoria: 'Hora Extra' }]),
      'Entrada Regular'
    );

    assert.equal(
      formatarLinkMapa(-15.7942, -47.8822),
      'https://www.google.com/maps/search/?api=1&query=-15.7942,-47.8822'
    );
  });

  it('configura a URL padrao de producao para https://krono.engine.lat/api e timeout de rede', () => {
    const storageCodigo = fs.readFileSync(
      path.join(ROOT, 'services/storageService.ts'),
      'utf8'
    );
    const apiCodigo = fs.readFileSync(
      path.join(ROOT, 'services/apiService.ts'),
      'utf8'
    );

    assert.match(
      storageCodigo,
      /PRODUCTION_API_BASE_URL\s*=\s*['"]https:\/\/krono\.engine\.lat\/api['"]/
    );
    assert.match(apiCodigo, /AbortController/);
    assert.match(apiCodigo, /X-Krono-Client-Id/);
  });

  it('cumpre integralmente as regras de AGENTS.md (zero emojis e zero jargoes nas telas)', () => {
    const arquivosUi = [
      ...listarArquivosRecursivo(path.join(ROOT, 'app'), ['.ts', '.tsx']),
      ...listarArquivosRecursivo(path.join(ROOT, 'components'), ['.ts', '.tsx']),
    ];

    // Detecta pictogramas/emojis Unicode (excluindo simbolos tipograficos comuns como •)
    const regexEmoji = /\p{Extended_Pictographic}/u;
    const regexAulasProibidas = /\bAula\s*\d+\b/i;

    for (const arq of arquivosUi) {
      const rel = path.relative(ROOT, arq);
      if (rel === 'components/hello-wave.tsx') continue; // arquivo de template nao usado pelas abas
      const conteudo = fs.readFileSync(arq, 'utf8');
      assert.equal(
        regexEmoji.test(conteudo),
        false,
        `Emoji encontrado em ${rel}`
      );
      assert.equal(
        regexAulasProibidas.test(conteudo),
        false,
        `Referencia de aula encontrada em ${rel}`
      );
    }

    // Verifica zero emojis tambem na documentacao Markdown (AGENTS.md)
    for (const docRel of ['README.md', 'CHANGELOG.md', 'api/README.md']) {
      const docConteudo = fs.readFileSync(path.join(ROOT, docRel), 'utf8');
      assert.equal(
        regexEmoji.test(docConteudo),
        false,
        `Emoji encontrado na documentacao ${docRel}`
      );
    }

    // Verifica que detalhes/[id].tsx nao expoe latitude/longitude brutas no compartilhamento
    const detalhesCodigo = fs.readFileSync(
      path.join(ROOT, 'app/detalhes/[id].tsx'),
      'utf8'
    );
    assert.equal(
      /Coordenadas:\s*\$\{/.test(detalhesCodigo),
      false,
      'Coordenadas brutas ainda presentes em detalhes/[id].tsx'
    );
  });

  it('valida presenca de todos os icones e logo em alta resolucao', () => {
    const obrigatorios = [
      'assets/images/logo-krono.svg',
      'assets/images/icon.png',
      'assets/images/android-icon-foreground.png',
      'assets/images/android-icon-background.png',
      'assets/images/android-icon-monochrome.png',
      'assets/images/splash-icon.png',
      'assets/images/favicon.png',
      'assets/images/krono-mark.png',
    ];
    for (const item of obrigatorios) {
      const p = path.join(ROOT, item);
      assert.equal(fs.existsSync(p), true, `Asset ausente: ${item}`);
      assert.ok(fs.statSync(p).size > 500, `Asset vazio ou corrompido: ${item}`);
    }
  });
});
