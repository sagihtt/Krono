# Krono — Gestão de Jornada e Frequência (`v2.2.1` • Expo SDK 58)

Aplicativo multiplataforma (Android, iOS e Web Responsiva) em **React Native (Expo SDK 58 + Expo Router)** acompanhado de servidor **Node.js + Express**, evoluído desde os **Laboratórios 1 a 5** até cumprir todos os requisitos das **Aulas 16 a 21** de Programação para Dispositivos Móveis.

A interface segue o sistema visual extraído do portal oficial **[https://antigravity.google/](https://antigravity.google/)**.

---

## 🎨 Sistema Visual (`https://antigravity.google/`)

Tokens de design inspecionados diretamente do site oficial e aplicados em `constants/theme.ts` e `components/AntigravityHeader.tsx`:

| Token | Valor | Aplicação no App |
| :--- | :--- | :--- |
| **Obsidian Ink** | `#121317` | Tipografia principal, botões primários em formato pílula e console de arquivos |
| **Pure Canvas** | `#FFFFFF` | Plano de fundo limpo de alto contraste |
| **Bento Surface** | `#F8F9FC` | Superfície dos cartões modulares (`borderRadius: 20px`) |
| **Pill Surface** | `#EEF1F8` | Botões secundários, chips de categoria e badges informativos (`borderRadius: 9999px`) |
| **Spectrum Accents** | `#3186FF` / `#00B95C` / `#FC413D` / `#FBBC04` | Partículas do cabeçalho e indicadores de status (Entrada, Saída, Hora Extra, Sincronização API) |

---

## 🗂️ Arquitetura Modular de Pastas (Aula 16)

```text
registroDePonto/
├── api/                          # Servidor Backend Node.js + Express (Aulas 17 e 18)
│   ├── package.json
│   ├── README.md
│   └── server.js                 # Rotas /clima, CRUD /pontos, CRUD /filmes e POST /upload
├── app/                          # Rotas do Expo Router (File-based routing)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Navegação em 3 abas estilizadas
│   │   ├── index.tsx             # Aba 1: Ponto, Câmera, GPS, FlatList e Sincronização API
│   │   ├── cadastro.tsx          # Aba 2: Perfil do Colaborador e Painel AsyncStorage (Aula 19)
│   │   └── explore.tsx           # Aba 3: Central de Arquivos, Share, ImagePicker, PDF e FileSystem (Aula 21)
│   ├── detalhes/
│   │   └── [id].tsx              # Rota dinâmica com leitura por ID, edição (PUT), exclusão (DELETE) e Share
│   └── _layout.tsx
├── components/                   # Componentes de UI reutilizáveis e desacoplados
│   ├── AntigravityHeader.tsx     # Cabeçalho com partículas inspiradas no antigravity.google
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
├── CHANGELOG.md                  # Histórico completo do Versionamento Semântico (v1.0.0 a v2.0.0)
└── README.md
```

---

## 🚀 Como Executar o Projeto Completo

### 1. Iniciar a API Local Node.js + Express (Opcional — Modo Online)

Em um terminal separado, inicie o servidor na porta `3000`:

```bash
cd api
npm install
npm start
```

> **Nota sobre Modo Híbrido (Online/Offline):** O aplicativo possui fallback automático para o `AsyncStorage`. Caso o servidor Express não esteja em execução, o app continua operando normalmente em **Modo Offline (`AsyncStorage`)** e sincroniza assim que a API estiver disponível.

### 2. Iniciar o Aplicativo Expo (SDK 54)

Na raiz do projeto `registroDePonto`:

```bash
npm install
npx expo start
```

- Pressione **`w`** para abrir no navegador Web.
- Pressione **`a`** para abrir no emulador Android (ou escaneie o QR Code no Expo Go).

---

## ✅ Mapeamento Completo de Requisitos (Labs 1–5 e Aulas 16–21)

### Laboratórios 1 a 5 (Preservados e Integrados)
- **Lista com mínimo de 5 itens iniciais (`PONTOS_INICIAIS`)**: Definida em `constants/pontosMock.ts` e renderizada via `FlatList` em `app/(tabs)/index.tsx`.
- **Estado alterando a interface (`modoCompacto`)**: Controlado por `Switch` em `app/(tabs)/index.tsx` e persistido no `AsyncStorage`.
- **Rota Dinâmica (`app/detalhes/[id].tsx`)**: Extração do parâmetro com `useLocalSearchParams<{ id: string }>()`, exibição explícita do ID selecionado e retorno via `router.back()`.
- **Diferenciação entre `<Link>` e `useRouter()`**: Demonstrada lado a lado em `app/(tabs)/index.tsx`.

### Aula 16 — Boas Práticas no Desenvolvimento de Apps
- **Separação de responsabilidades**: Divisão em `app/`, `components/`, `services/`, `models/` e `constants/`.
- **Performance em listas e imagens**: `RegistroCard` envolvido em `React.memo`, `keyExtractor` estável na `FlatList` e compressão `quality: 0.75 / 0.8` nas capturas de imagem.
- **Feedback de estado para o usuário**: Indicadores `ActivityIndicator`, banners de status Online/Offline e alertas claros.

### Aulas 17 e 18 — Construindo uma API Local (Parte 1 e Parte 2 CRUD)
- **Servidor Express (`api/server.js`)**: Configurado com `app.use(express.json())` e cabeçalhos CORS.
- **4 Operações CRUD + Status HTTP semânticos**:
  - **CREATE (`POST /pontos` e `POST /filmes`)**: Lê `req.body`, valida campos obrigatórios (`400 Bad Request`) e retorna `201 Created`.
  - **READ (`GET /clima`, `GET /pontos`, `GET /pontos/:id`, `GET /filmes`, `GET /filmes/:id`)**: Busca com `.find()` via `req.params.id` (`200 OK` ou `404 Not Found`).
  - **UPDATE (`PUT /pontos/:id` e `PUT /filmes/:id`)**: Combina `req.params.id` e `req.body` (`200 OK`, `400 Bad Request` ou `404 Not Found`).
  - **DELETE (`DELETE /pontos/:id` e `DELETE /filmes/:id`)**: Localiza com `.findIndex()`, remove com `.splice(index, 1)` e retorna `204 No Content`.

### Aula 19 — Armazenamento Local com `AsyncStorage`
- **Operações fundamentais (`services/storageService.ts` e `app/(tabs)/cadastro.tsx`)**:
  - Strings simples com `AsyncStorage.setItem`, `AsyncStorage.getItem` e `AsyncStorage.removeItem`.
  - Objetos e listas JSON com `JSON.stringify()` ao salvar e `JSON.parse()` ao carregar.
  - Operações em lote com `AsyncStorage.getAllKeys()`, `AsyncStorage.multiGet()` e `AsyncStorage.clear()`.
- **Segurança**: Senhas nunca são gravadas no `AsyncStorage` por ausência de criptografia nativa.

### Aula 20 — Câmera, Geolocalização e Permissões
- **Câmera (`expo-camera` em `app/(tabs)/index.tsx`)**:
  - Hook `useCameraPermissions()` validando os 3 estágios: carregando (`!permissaoCamera`), negado ("Caminho Vermelho" com explicação ao usuário) e permitido ("Caminho Verde" com `<CameraView />`).
  - Captura com `cameraRef.current.takePictureAsync()` e exibição imediata da pré-visualização `<Image source={{ uri: fotoUri }} />` abaixo da lente da câmera, acompanhada do botão **Limpar foto** (`setFotoUri(null)`).
- **Geolocalização (`expo-location` em `app/(tabs)/index.tsx`)**:
  - Solicitação com `Location.requestForegroundPermissionsAsync()`, leitura de `latitude` e `longitude` exatas com `Location.getCurrentPositionAsync()` e tratamento de negativa sem travar o app (`erroLocalizacao`).

### Aula 21 — Compartilhamento, Seleção de Mídia, PDFs e Sistema de Arquivos
- **Implementado em `app/(tabs)/explore.tsx` e `app/detalhes/[id].tsx`**:
  1. **`Share` nativo (`react-native`)**: Compartilhamento de textos e links do espelho de ponto.
  2. **`expo-sharing`**: Compartilhamento de arquivos físicos locais após checar `Sharing.isAvailableAsync()`.
  3. **`expo-image-picker` + `FormData`**: Escolha de imagem da galeria com recorte `4:3` e envio via `FormData` (`multipart/form-data`) para `POST /upload`, evitando `Base64` na memória RAM.
  4. **`expo-document-picker`**: Seleção de documentos `application/pdf` com `copyToCacheDirectory: true`, exibição de metadados (`name`, `size`, `mimeType`, `uri`) e vínculo com o registro de ponto.
  5. **`expo-file-system` (`File` e `Paths` — SDK 54)**: Escrita e leitura do relatório offline `new File(Paths.document, 'vistoria-ponto.txt')` no diretório privado do app.
  6. **`expo-media-library`**: Exportação de fotos para a galeria pública aplicando o Princípio do Menor Privilégio (`MediaLibrary.requestPermissionsAsync(true)`).

---

## 🏷️ Versionamento Semântico (Git Tags)

O histórico do repositório foi organizado em 6 versões semânticas:

| Tag | Descrição da Release |
| :--- | :--- |
| **`v1.0.0`** | Baseline original dos Laboratórios 1 a 5 |
| **`v1.1.0`** | Aula 16: Arquitetura modular, modelagem TypeScript e Design System `https://antigravity.google/` |
| **`v1.2.0`** | Aulas 17 e 18: API Local Node.js + Express (`api/server.js`) e cliente HTTP (`services/apiService.ts`) |
| **`v1.3.0`** | Aula 19: Persistência local com `AsyncStorage` (`services/storageService.ts` e aba `cadastro.tsx`) |
| **`v1.4.0`** | Aula 20: Câmera com pré-visualização, Geolocalização GPS e tela de detalhes com `PUT` e `DELETE` |
| **`v2.0.0`** | Aula 21: Central de Arquivos (`Share`, `expo-sharing`, `ImagePicker`, `DocumentPicker`, `FileSystem`, `MediaLibrary`) e documentação completa |

Para inspecionar as versões no Git:

```bash
git tag -n
git log --oneline --decorate
```
