# Krono: Gestão de Jornada e Frequência (`v2.2.3` • Expo SDK 58)

Aplicativo multiplataforma (Android, iOS e Web Responsiva) em **React Native (Expo SDK 58 + Expo Router)** acompanhado de servidor **Node.js + Express**, evoluído desde os **Laboratórios 1 a 5** até cumprir todos os requisitos das **Aulas 16 a 21** de Programação para Dispositivos Móveis.

A interface adota o sistema visual extraído do portal **[https://antigravity.google/](https://antigravity.google/)**, combinando tipografia de alto contraste, cartões modulares, botões centralizados em formato pílula e navegação adaptativa com menu lateral deslizante no celular e barra lateral fixa com layout de duas colunas na Web.

---

## Sistema Visual e Navegação Adaptativa

Tokens de design aplicados em `constants/theme.ts`, `components/AppShell.tsx` e `components/AntigravityHeader.tsx`:

| Token | Valor | Aplicação no App |
| :--- | :--- | :--- |
| **Obsidian Ink** | `#121317` | Tipografia principal, botões primários em formato pílula e barra de status |
| **Pure Canvas** | `#FFFFFF` | Plano de fundo limpo de alto contraste |
| **Bento Surface** | `#F8F9FC` | Superfície dos cartões modulares (`borderRadius: 20px`) |
| **Pill Surface** | `#EEF1F8` | Botões secundários, seletores de turno e badges informativos (`borderRadius: 9999px`) |
| **Spectrum Accents** | `#3186FF` / `#00B95C` / `#FC413D` / `#FBBC04` | Indicadores de status (Entrada, Saída, Hora Extra e Sincronização com Servidor) |

### Layout Responsivo (`components/AppShell.tsx`)
- **Android e iOS (`width < 960px`)**: Menu lateral deslizante acionado pelo topo da tela, com atalhos para as seções principais, lista de marcações recentes para acesso rápido aos comprovantes, controle de densidade visual (`Lista compacta`) e resumo do colaborador.
- **Web e Telas Grandes (`width >= 960px`)**: Barra lateral fixa à esquerda e área de conteúdo centralizada (`maxWidth: 1080px`) distribuída em grade de duas colunas.

---

## Arquitetura Modular de Pastas (Aula 16)

```text
registroDePonto/
├── api/                          # Servidor Backend Node.js + Express (Aulas 17 e 18)
│   ├── package.json
│   ├── README.md
│   └── server.js                 # Rotas /clima, CRUD /pontos, CRUD /filmes e POST /upload
├── app/                          # Rotas do Expo Router (File-based routing)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Navegação em 3 abas principais (Jornada, Documentos, Meu Perfil)
│   │   ├── index.tsx             # Aba 1: Relógio em tempo real, Câmera, GPS com endereço aproximado e Histórico
│   │   ├── cadastro.tsx          # Aba 2: Perfil do Colaborador, grade 2x2 de turnos e persistência AsyncStorage
│   │   └── explore.tsx           # Aba 3: Central de Documentos, Share, ImagePicker, PDF e FileSystem
│   ├── detalhes/
│   │   └── [id].tsx              # Rota dinâmica de comprovante com leitura por ID, edição (PUT), exclusão (DELETE) e Share
│   └── _layout.tsx
├── components/                   # Componentes de UI reutilizáveis e desacoplados
│   ├── AppShell.tsx              # Shell adaptativo (menu lateral mobile + barra lateral fixa Web)
│   ├── AntigravityHeader.tsx     # Cabeçalho com indicador de conectividade
│   ├── BotaoPress.tsx            # Botão pílula com animação de mola (Animated.spring)
│   ├── RegistroCard.tsx          # Card otimizado com React.memo e badges semânticos
│   └── cadastro/                 # Inputs com máscara, PickerModal e Checkbox
├── constants/
│   ├── pontosMock.ts             # 5 registros iniciais padronizados (Labs 1-5)
│   └── theme.ts                  # Paleta AntigravityPalette, Radii e fontes
├── models/
│   └── ponto.ts                  # Contratos TypeScript (PontoRegistro, PerfilColaborador, AnexoDocumento)
├── services/                     # Camada de serviços isolada da interface (Aula 16)
│   ├── apiService.ts             # Cliente HTTP fetch() para GET, POST, PUT, DELETE e FormData
│   └── storageService.ts         # Persistência local com AsyncStorage e serialização JSON
├── CHANGELOG.md                  # Histórico completo do Versionamento Semântico (v1.0.0 a v2.2.3)
└── README.md
```

---

## Como Executar o Projeto Completo

### 1. Iniciar a API Local Node.js + Express (Opcional: Modo Online)

Em um terminal separado, inicie o servidor na porta `3000`:

```bash
cd api
npm install
npm start
```

> **Nota sobre Operação Híbrida (Online e Offline):** O aplicativo possui fallback automático para o `AsyncStorage`. Caso o servidor Express não esteja em execução, o app continua operando localmente e sincroniza quando o servidor estiver disponível.

### 2. Iniciar o Aplicativo Expo (SDK 58)

Na raiz do projeto `registroDePonto`:

```bash
npm install
npx expo start
```

- Pressione **`w`** para abrir no navegador Web.
- Pressione **`a`** para abrir no emulador Android ou escaneie o QR Code no aplicativo **Expo Go (SDK 58)**.

---

## Mapeamento Completo de Requisitos (Labs 1 a 5 e Aulas 16 a 21)

### Laboratórios 1 a 5 (Preservados e Integrados)
- **Lista com mínimo de 5 itens iniciais (`PONTOS_INICIAIS`)**: Definida em `constants/pontosMock.ts` e renderizada em `app/(tabs)/index.tsx`.
- **Estado alterando a interface (`modoCompacto`)**: Controlado por `Switch` em `app/(tabs)/index.tsx` e no menu lateral `components/AppShell.tsx`, com persistência no `AsyncStorage`.
- **Rota Dinâmica (`app/detalhes/[id].tsx`)**: Extração do parâmetro com `useLocalSearchParams<{ id: string }>()`, exibição do código do comprovante e retorno com `router.back()`.
- **Diferenciação entre `<Link>` e `useRouter()`**: Navegação declarativa e programática integradas na listagem de marcações e no menu lateral.

### Aula 16: Boas Práticas no Desenvolvimento de Apps
- **Separação de responsabilidades**: Divisão em `app/`, `components/`, `services/`, `models/` e `constants/`.
- **Performance em listas e imagens**: `RegistroCard` envolvido em `React.memo` e compressão `quality: 0.75 / 0.8` nas capturas de imagem.
- **Feedback de estado para o usuário**: Indicadores `ActivityIndicator`, status de sincronização no cabeçalho e modais de confirmação.

### Aulas 17 e 18: Construindo uma API Local (Parte 1 e Parte 2 CRUD)
- **Servidor Express (`api/server.js`)**: Configurado com `app.use(express.json())` e cabeçalhos CORS.
- **4 Operações CRUD e Status HTTP semânticos**:
  - **CREATE (`POST /pontos` e `POST /filmes`)**: Lê `req.body`, valida campos obrigatórios (`400 Bad Request`) e retorna `201 Created`.
  - **READ (`GET /clima`, `GET /pontos`, `GET /pontos/:id`, `GET /filmes`, `GET /filmes/:id`)**: Busca com `.find()` via `req.params.id` (`200 OK` ou `404 Not Found`).
  - **UPDATE (`PUT /pontos/:id` e `PUT /filmes/:id`)**: Combina `req.params.id` e `req.body` (`200 OK`, `400 Bad Request` ou `404 Not Found`).
  - **DELETE (`DELETE /pontos/:id` e `DELETE /filmes/:id`)**: Localiza com `.findIndex()`, remove com `.splice(index, 1)` e retorna `204 No Content`.

### Aula 19: Armazenamento Local com `AsyncStorage`
- **Operações fundamentais (`services/storageService.ts` e `app/(tabs)/cadastro.tsx`)**:
  - Strings simples com `AsyncStorage.setItem`, `AsyncStorage.getItem` e `AsyncStorage.removeItem`.
  - Objetos e listas JSON com `JSON.stringify()` ao salvar e `JSON.parse()` ao carregar.
  - Operações em lote com `AsyncStorage.getAllKeys()`, `AsyncStorage.multiGet()` e `AsyncStorage.clear()`.
  - Seletor de turno padrão organizado em grade simétrica 2x2 (2 linhas com 2 opções em cada).
- **Segurança**: Credenciais sensíveis não são gravadas em texto puro no `AsyncStorage`.

### Aula 20: Câmera, Geolocalização e Permissões
- **Câmera (`expo-camera` em `app/(tabs)/index.tsx`)**:
  - Hook `useCameraPermissions()` validando os estágios de carregamento, permissão negada com justificativa ao colaborador e permissão concedida com `<CameraView />`.
  - Fluxo contínuo ao tocar em **Registrar ponto**: autenticação biométrica (`expo-local-authentication`), leitura do GPS, abertura automática da lente e disparo automático da foto com `cameraRef.current.takePictureAsync()`, exibindo a prévia `<Image source={{ uri: fotoUri }} />` e o botão **Remover foto**.
- **Geolocalização e Endereço Aproximado (`expo-location` em `app/(tabs)/index.tsx` e `app/detalhes/[id].tsx`)**:
  - Solicitação com `Location.requestForegroundPermissionsAsync()` e leitura de posição via `Location.getCurrentPositionAsync()`.
  - Conversão automática das coordenadas em endereço aproximado legível (rua, bairro e cidade) via geocodificação reversa (`Location.reverseGeocodeAsync` com fallback para OpenStreetMap Nominatim na Web) e botão de atalho **Mapa** para abrir o local no Google Maps.

### Aula 21: Compartilhamento, Seleção de Mídia, PDFs e Sistema de Arquivos
- **Implementado em `app/(tabs)/explore.tsx` e `app/detalhes/[id].tsx`**:
  1. **`Share` nativo (`react-native`)**: Compartilhamento de textos do espelho de ponto e comprovantes individuais.
  2. **`expo-sharing`**: Compartilhamento de arquivos físicos locais após checar `Sharing.isAvailableAsync()`.
  3. **`expo-image-picker` + `FormData`**: Escolha de imagem da galeria com recorte `4:3` e envio via `FormData` (`multipart/form-data`) para `POST /upload`, evitando `Base64` na memória RAM.
  4. **`expo-document-picker`**: Seleção de documentos `application/pdf` com `copyToCacheDirectory: true`, leitura de metadados (`name`, `size`, `mimeType`, `uri`) e vínculo com o registro de ponto.
  5. **`expo-file-system` (`File` e `Paths`)**: Escrita e leitura do relatório offline `new File(Paths.document, 'vistoria-ponto.txt')` no diretório privado do app.
  6. **`expo-media-library`**: Exportação de fotos para a galeria pública aplicando o Princípio do Menor Privilégio (`MediaLibrary.requestPermissionsAsync(true)`).

---

## Versionamento Semântico (Git Tags)

O histórico do repositório está organizado nas seguintes versões semânticas:

| Tag | Descrição da Release |
| :--- | :--- |
| **`v1.0.0`** | Baseline original dos Laboratórios 1 a 5 |
| **`v1.1.0`** | Aula 16: Arquitetura modular, modelagem TypeScript e Design System `https://antigravity.google/` |
| **`v1.2.0`** | Aulas 17 e 18: API Local Node.js + Express (`api/server.js`) e cliente HTTP (`services/apiService.ts`) |
| **`v1.3.0`** | Aula 19: Persistência local com `AsyncStorage` (`services/storageService.ts` e aba `cadastro.tsx`) |
| **`v1.4.0`** | Aula 20: Câmera com pré-visualização, Geolocalização GPS e tela de detalhes com `PUT` e `DELETE` |
| **`v2.0.0`** | Aula 21: Central de Arquivos (`Share`, `expo-sharing`, `ImagePicker`, `DocumentPicker`, `FileSystem`, `MediaLibrary`) e documentação |
| **`v2.1.0`** | Upgrade completo para Expo SDK 58 (`expo@^58.0.0`, `react@19.3.0`, `react-native@0.88.1`) |
| **`v2.2.0`** | Identidade de produto oficial Krono, menu lateral estilo Gemini (`AppShell.tsx`), ícones Feather e layout responsivo Web/Mobile |
| **`v2.2.1`** | Fluxo contínuo de autenticação + captura automática de foto em `Registrar ponto` e ajustes de Flexbox sem sobreposição |
| **`v2.2.2`** | Grade 2x2 para turno de trabalho padrão no perfil e endereço aproximado via geocodificação reversa com atalho para o Mapa |
| **`v2.2.3`** | Atualização completa da documentação (`README.md`, `CHANGELOG.md` e `api/README.md`) sem emojis |

Para inspecionar as versões no Git:

```bash
git tag -n
git log --oneline --decorate
```
