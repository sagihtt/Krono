# Changelog

Todas as mudanças notáveis do projeto **Google Antigravity Chrono (`registroDePonto`)** estão documentadas neste arquivo.

O formato segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota o [Versionamento Semântico (SemVer)](https://semver.org/lang/pt-BR/).

---

## [2.1.0] - 2026-11-02 (Upgrade para Expo SDK 58 — Compatibilidade com Expo Go Atualizado)

### Alterado
- **Migração de Expo SDK 54 para Expo SDK 58 (`^58.0.0`)**: Atualização completa do ecossistema (`react@19.3.0`, `react-native@0.88.1`, `expo-router@~58.0.29`, `expo-camera@~58.0.14`, `expo-location@~58.0.20`, `expo-file-system@~58.0.13`, `expo-image-picker@~58.0.10`, `expo-document-picker@~58.0.4`, `expo-sharing@~58.0.21`, `expo-media-library@~58.0.13` e `typescript@~6.0.3`) para execução direta no aplicativo **Expo Go (SDK 58)**.
- **Adequação ao React Compiler (React 19.3)**: Uso de `useAnimatedValue(1)` em `components/BotaoPress.tsx` e ajustes de tipagem em `components/ui/icon-symbol.tsx` e `components/haptic-tab.tsx`.

---

## [2.0.0] - 2026-11-02 (Aula 21: Compartilhamento, Seleção de Mídia, PDFs e Sistema de Arquivos + Documentação)

### Adicionado
- **Compartilhamento Nativo (`Share` do `react-native`)**: Exportação de resumos formatados do espelho de ponto e comprovantes individuais nas telas `app/(tabs)/explore.tsx` e `app/detalhes/[id].tsx`.
- **Compartilhamento de Arquivos Físicos (`expo-sharing`)**: Verificação com `Sharing.isAvailableAsync()` e envio de relatórios `.txt`, anexos `.pdf` e fotos via `Sharing.shareAsync(uri)`, tratando a indisponibilidade em navegadores web.
- **Seleção de Imagens com Privacidade (`expo-image-picker`)**: Uso de `ImagePicker.launchImageLibraryAsync` com recorte `4:3`, `allowsEditing: true` e compressão `quality: 0.8`.
- **Upload via `FormData` (`multipart/form-data`)**: Envio de arquivos da URI local para a rota `POST /upload` sem conversão para `Base64`, preservando a memória RAM do dispositivo.
- **Seleção de Documentos PDF (`expo-document-picker`)**: Filtro `type: 'application/pdf'` com `copyToCacheDirectory: true`, leitura de metadados (`name`, `size`, `mimeType`, `uri`) e vínculo automático com o registro de ponto mais recente.
- **Sistema de Arquivos Físico (`expo-file-system` SDK 54 `File` e `Paths`)**: Geração e leitura offline do relatório `vistoria-ponto.txt` dentro de `Paths.document` (`arquivo.write()` e `arquivo.textSync()`), acompanhado do painel explicativo dos 3 territórios de armazenamento (`Cache`, `Paths.document` e `MediaLibrary`).
- **Exportação para Galeria Pública (`expo-media-library`)**: Aplicação do Princípio do Menor Privilégio com `MediaLibrary.requestPermissionsAsync(true)` (`writeOnly`) e gravação com `MediaLibrary.saveToLibraryAsync(uri)`.
- **Documentação Completa**: Criação de `CHANGELOG.md`, `api/README.md` e atualização detalhada do `README.md`.

---

## [1.4.0] - 2026-11-02 (Aula 20: Câmera, Pré-visualização, Geolocalização GPS e Detalhes CRUD)

### Adicionado
- **Módulo de Câmera (`expo-camera`)**: Implementação do ciclo de permissões em 3 estágios (`!permissaoCamera`, Caminho Vermelho com justificativa amigável e Caminho Verde com `<CameraView />`), alternância de lente frontal/traseira e captura de foto com `takePictureAsync()`.
- **Missão Prática de Pré-visualização de Foto**: Renderização do componente `<Image source={{ uri: fotoUri }} />` abaixo da lente da câmera assim que a foto é capturada, exibindo a URI temporária e o botão **Limpar foto** (`setFotoUri(null)`).
- **Geolocalização (`expo-location`)**: Solicitação de permissão em primeiro plano com `Location.requestForegroundPermissionsAsync()`, leitura de `latitude` e `longitude` via `Location.getCurrentPositionAsync()` e banner de aviso amigável (`erroLocalizacao`) caso o usuário negue a permissão.
- **Edição e Exclusão na Rota Dinâmica (`app/detalhes/[id].tsx`)**: Integração dos métodos `PUT /pontos/:id` e `DELETE /pontos/:id` diretamente na tela de detalhes, sincronizando API Express e `AsyncStorage`.

---

## [1.3.0] - 2026-11-02 (Aula 19: Persistência Local com AsyncStorage)

### Adicionado
- **Camada de Armazenamento (`services/storageService.ts`)**: Abstração das operações assíncronas do `@react-native-async-storage/async-storage` (`setItem`, `getItem`, `removeItem`, `getAllKeys`, `multiGet` e `clear`).
- **Serialização de Objetos e Listas**: Uso de `JSON.stringify()` na gravação e `JSON.parse()` na leitura do perfil do colaborador, preferências do app e histórico de pontos.
- **Painel Comparativo de Memória (`app/(tabs)/cadastro.tsx`)**: Demonstração prática da diferença entre memória de curto prazo (`useState` na RAM) e memória de longo prazo (`AsyncStorage` no disco), além do aviso de segurança sobre nunca persistir senhas em texto puro no `AsyncStorage`.

---

## [1.2.0] - 2026-11-02 (Aulas 17 e 18: API Local Node.js + Express e CRUD Completo)

### Adicionado
- **Servidor Backend (`api/server.js` e `api/package.json`)**: API RESTful em Node.js e Express na porta `3000` com suporte a CORS e middleware `express.json()`.
- **Rotas REST e Status Codes**:
  - `GET /clima` (`200 OK`)
  - `GET /pontos` e `GET /pontos/:id` (`200 OK` / `404 Not Found`)
  - `POST /pontos` (`201 Created` / `400 Bad Request`)
  - `PUT /pontos/:id` (`200 OK` / `400 Bad Request` / `404 Not Found`)
  - `DELETE /pontos/:id` (`204 No Content` / `404 Not Found`)
  - CRUD completo para `/filmes` (exercício original da Aula 18) e `POST /upload`.
- **Cliente HTTP (`services/apiService.ts`)**: Funções tipadas para consumo das rotas da API via `fetch()`.

---

## [1.1.0] - 2026-11-02 (Aula 16: Boas Práticas de UI/UX, Arquitetura Modular e Design System Antigravity)

### Adicionado
- **Identidade Visual `https://antigravity.google/` (`constants/theme.ts` e `components/AntigravityHeader.tsx`)**: Paleta oficial com `Obsidian Ink (#121317)`, `Pure Canvas (#FFFFFF)`, `Bento Surface (#F8F9FC)`, `Pill Surface (#EEF1F8)`, `Electric Blue (#3186FF)`, `Emerald (#00B95C)`, `Coral Red (#FC413D)` e `Solar Amber (#FBBC04)`, botões em formato pílula (`borderRadius: 9999`) e cards Bento (`borderRadius: 20`).
- **Modelagem Tipada (`models/ponto.ts`)**: Interfaces `PontoRegistro`, `PerfilColaborador`, `PreferenciasApp` e `AnexoDocumento`.
- **Otimização de Componentes**: Aplicação de `React.memo` em `components/RegistroCard.tsx` e refinamento visual dos componentes de formulário em `components/cadastro/*`.

---

## [1.0.0] - 2026-11-02 (Baseline: Laboratórios 1 a 5)

### Adicionado
- Estrutura inicial do aplicativo construída ao longo dos Laboratórios 1 a 5:
  - Listagem de no mínimo 5 registros iniciais com `FlatList` e `RegistroCard`.
  - Controle de estado `modoCompacto` com `Switch`.
  - Rotas dinâmicas do Expo Router (`app/detalhes/[id].tsx`) com `useLocalSearchParams`.
  - Comparação entre navegação declarativa (`<Link>`) e navegação programática (`useRouter()`).
  - Formulário de cadastro componentizado com máscara de CPF, telefone e data.
