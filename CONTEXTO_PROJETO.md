# Contexto do Projeto: Krono (`registroDePonto`)

**Data da última sessão:** 02/11/2026  
**Versão atual:** `v2.2.3` (Expo SDK 58 • React 19.3.0 • React Native 0.88.1)  
**Caminho do projeto:** `C:\Users\thiag\Desktop\Engine\2.Disciplinas\PDM\Laboratorios\lab_1\registroDePonto`  
**Notas de estudo vinculadas no Obsidian:** `C:\Users\thiag\Documents\Obsidian\antigravity\Semestre 2.2026\Programação para Dispositivos Móveis\`

---

## 1. Objetivo e Escopo

O aplicativo **Krono (Gestão de Jornada e Frequência)** evoluiu a base construída nos **Laboratórios 1 a 5** para atender integralmente às exigências teóricas e práticas das **Aulas 16 a 21** da disciplina de Programação para Dispositivos Móveis, operando como um produto oficial multiplataforma (Android, iOS e Web Responsiva).

---

## 2. Diretrizes de Design, UX e Linguagem (Regras de Continuidade)

Ao retomar ou expandir este projeto em sessões futuras, mantenha sempre as seguintes decisões definidas pelo autor:

1. **Identidade de Produto Oficial (`Krono`)**:
   - Não utilizar termos acadêmicos ou referências de sala de aula na interface do aplicativo (nunca exibir textos como `"Aula 20"`, `"Lab 5"`, `"Missão Prática"`, etc.).
   - Não expor detalhes técnicos de implementação nos botões ou legendas da UI (não exibir verbos HTTP como `POST /pontos`, `PUT`, `DELETE`, `JSON.stringify`, `FormData`, nem coordenadas brutas de latitude/longitude).
   - Não afirmar que o aplicativo pertence ao Google; apenas o sistema visual (paleta de cores, superfícies modulares e botões em formato pílula) é inspirado no site `https://antigravity.google/`.
2. **Zero Emojis**:
   - Não utilizar emojis na interface do aplicativo nem nos arquivos de documentação (`README.md`, `CHANGELOG.md`, `api/README.md`, `CONTEXTO_PROJETO.md`).
   - Utilizar exclusivamente ícones vetoriais da família `@expo/vector-icons/Feather`.
3. **Layout Adaptativo e Responsividade (`components/AppShell.tsx`)**:
   - **Mobile (`width < 960px`)**: Cabeçalho com botão de menu que abre uma gaveta lateral deslizante (estilo Gemini Android / WhatsApp), listando as seções do app, atalhos para as marcações recentes, controle de `Lista compacta` e dados do colaborador.
   - **Web / Desktop (`width >= 960px`)**: Barra lateral fixa à esquerda (`272px`) + área útil centralizada (`maxWidth: 1080px`) distribuída em grade de 2 colunas.
4. **Prevenção de Sobreposição (Flexbox)**:
   - Botões de ação secundária e cabeçalhos de seção devem usar `flexShrink: 0` nos botões e `flex: 1, minWidth: 0` nos blocos de texto ao lado para nunca estourar ou sobrepor elementos em telas estreitas de Android (`360px`).
   - Botões primários possuem texto centralizado e largura controlada (`width: '100%'`, `maxWidth: 320`, `alignSelf: 'center'`).

---

## 3. Fluxos Funcionais Implementados

### Aba 1: Jornada (`app/(tabs)/index.tsx`)
- **Relógio em tempo real** com data por extenso, turno ativo do colaborador e seletor de tipo de batida (`Entrada`, `Saída`, `Hora Extra`).
- **Fluxo automático ao tocar em `Registrar ponto`**:
  1. Autentica a identidade via biometria (`expo-local-authentication`, com fallback em dispositivos/navegadores sem leitor).
  2. Solicita permissão e captura as coordenadas GPS (`expo-location`).
  3. Converte automaticamente a latitude e longitude em **endereço aproximado legível** (rua, bairro e cidade) usando `Location.reverseGeocodeAsync` (com fallback para a API pública Nominatim/OpenStreetMap na Web) e disponibiliza o botão **Mapa** para abrir o local no Google Maps.
  4. Caso nenhuma foto tenha sido tirada previamente, solicita permissão da câmera (`useCameraPermissions`), abre o visor `<CameraView />` automaticamente, aguarda a inicialização do sensor e dispara a captura da foto (`takePictureAsync()`), exibindo a miniatura na tela junto ao botão **Remover foto**.
  5. Salva o registro na API Node.js/Express (`POST /pontos`) e no armazenamento local (`AsyncStorage`).
- **Histórico de Marcações**: Lista com pesquisa textual, filtros por categoria, alternância de densidade (`Lista compacta`) e navegação para o comprovante detalhado (`/detalhes/[id]`).

### Tela de Comprovante (`app/detalhes/[id].tsx`)
- Exibe código de identificação, status de sincronização, endereço aproximado (calculado também para registros antigos via geocodificação reversa) com botão **Ver no mapa**, foto de validação com exportação para a galeria (`expo-media-library`) ou compartilhamento (`expo-sharing`), edição de modalidade/observação (`PUT /pontos/:id`), compartilhamento de texto (`Share` nativo) e exclusão (`DELETE /pontos/:id`).

### Aba 2: Documentos (`app/(tabs)/explore.tsx`)
- **Envio de Comprovantes e Atestados**: Seleção de imagem com recorte `4:3` (`expo-image-picker`) + envio via `FormData` (`POST /upload`) e seleção de arquivos PDF (`expo-document-picker`) vinculados ao registro de ponto mais recente.
- **Folha de Ponto e Exportação**: Geração de espelho consolidado em `.txt` no diretório privado do aplicativo (`new File(Paths.document, 'vistoria-ponto.txt')` via `expo-file-system`), leitura instantânea em tela, compartilhamento nativo (`Share`) e envio de arquivo (`expo-sharing`).

### Aba 3: Meu Perfil (`app/(tabs)/cadastro.tsx`)
- Dados cadastrais do colaborador com máscaras de CPF, telefone e data.
- **Cargo e Jornada**: Grade simétrica **2x2** (2 linhas com 2 opções em cada) para seleção do turno de trabalho padrão (`08:00 às 17:00`, `09:00 às 18:00`, `13:00 às 22:00`, `Escala 12x36`).
- **Sincronização e Preferências**: Configuração do endereço do servidor Express e limpeza seletiva dos dados locais (`AsyncStorage`).

### Servidor Backend (`api/server.js`)
- API RESTful em Node.js + Express na porta `3000` com suporte a CORS e `express.json()`.
- Endpoints ativos: `GET /clima`, `GET /pontos`, `GET /pontos/:id`, `POST /pontos`, `PUT /pontos/:id`, `DELETE /pontos/:id`, CRUD `/filmes` e `POST /upload`.

---

## 4. Histórico de Versões Semânticas (Git Tags)

| Tag | Resumo |
| :--- | :--- |
| `v1.0.0` | Baseline original dos Laboratórios 1 a 5 |
| `v1.1.0` | Aula 16: Arquitetura modular, tipagem TypeScript e Design System `https://antigravity.google/` |
| `v1.2.0` | Aulas 17 e 18: Servidor Node.js + Express (`api/server.js`) e cliente HTTP (`services/apiService.ts`) |
| `v1.3.0` | Aula 19: Persistência local com `AsyncStorage` (`services/storageService.ts` e `app/(tabs)/cadastro.tsx`) |
| `v1.4.0` | Aula 20: Câmera com pré-visualização, Geolocalização GPS e tela de detalhes com `PUT` e `DELETE` |
| `v2.0.0` | Aula 21: Central de Arquivos (`Share`, `expo-sharing`, `ImagePicker`, `DocumentPicker`, `FileSystem`, `MediaLibrary`) |
| `v2.1.0` | Upgrade completo de Expo SDK 54 para **Expo SDK 58** (`react@19.3.0`, `react-native@0.88.1`) para compatibilidade com o Expo Go |
| `v2.2.0` | Redesign para produto oficial **Krono**, `AppShell.tsx` com menu lateral estilo Gemini e layout Web de 2 colunas |
| `v2.2.1` | Fluxo contínuo de autenticação + captura automática de foto ao bater ponto e correções de Flexbox |
| `v2.2.2` | Grade 2x2 de turnos na aba Meu Perfil e endereço aproximado via geocodificação reversa com botão Mapa |
| `v2.2.3` | Atualização integral da documentação (`README.md`, `CHANGELOG.md`, `api/README.md`) sem emojis |

---

## 5. Como Retomar o Desenvolvimento Rapidamente

1. **Subir o servidor Express (Terminal 1)**:
   ```bash
   cd "C:\Users\thiag\Desktop\Engine\2.Disciplinas\PDM\Laboratorios\lab_1\registroDePonto\api"
   npm start
   ```
2. **Subir o aplicativo Expo SDK 58 (Terminal 2)**:
   ```bash
   cd "C:\Users\thiag\Desktop\Engine\2.Disciplinas\PDM\Laboratorios\lab_1\registroDePonto"
   npx expo start
   ```
3. **Verificações de qualidade**:
   ```bash
   npx tsc --noEmit
   npx expo lint
   ```
