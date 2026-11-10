# Krono: Gestão de Jornada e Frequência (`v2.2.3` • Expo SDK 58)

Aplicativo móvel multiplataforma (Android, iOS e Web Responsiva) desenvolvido em React Native com Expo SDK 58 e Expo Router, integrado a uma API REST em Node.js e Express para registro, auditoria e comprovação de jornada de trabalho.

[![Android APK](https://img.shields.io/badge/Download-APK%20Android%20v2.2.3-00B95C?logo=android&logoColor=white)](https://github.com/sagihtt/Krono/releases/download/v2.2.3/krono-v2.2.3.apk)
[![GitHub Release](https://img.shields.io/badge/Release-v2.2.3-121317?logo=github&logoColor=white)](https://github.com/sagihtt/Krono/releases/tag/v2.2.3)
[![EAS Build](https://img.shields.io/badge/EAS%20Build-Finished-3186FF?logo=expo&logoColor=white)](https://expo.dev/accounts/sagihtt/projects/registrodeponto/builds)

---

## 1. Identificação do Aplicativo

- **Nome da aplicação:** Krono (`com.sagihtt.krono`)
- **Problema que busca resolver:** O controle de frequência em regimes presenciais, híbridos ou em trabalho externo costuma apresentar falhas quando depende de anotações manuais, planilhas descentralizadas ou sistemas que exigem conexão constante com a internet. Essas limitações dificultam a comprovação de horário e local da batida, geram perda de comprovantes ou atestados médicos e impedem o registro quando o profissional está sem sinal de rede. O Krono resolve esse problema ao unificar a marcação de ponto com verificação biométrica, geolocalização convertida em endereço postal e fotografia imediata no momento do registro, operando em arquitetura offline-first que armazena os dados no próprio aparelho e os sincroniza com o servidor assim que a conexão é restabelecida.

---

## 2. Principais Funcionalidades Implementadas

1. **Registro de Ponto com Relógio em Tempo Real (`app/(tabs)/index.tsx`):**
   Exibição contínua de data e horário atualizados a cada segundo, seleção da categoria de batida (`Entrada Regular`, `Intervalo`, `Retorno`, `Saída Regular` e `Hora Extra`), campo para observações e execução automatizada do fluxo de comprovação (autenticação local, leitura de GPS e captura de foto).
2. **Histórico de Marcações e Controle de Densidade (`app/(tabs)/index.tsx` e `components/RegistroCard.tsx`):**
   Listagem cronológica das marcações com indicadores visuais de sincronização (`Sincronizado` com a API ou `Salvo no aparelho`), sinalização de anexos (foto e PDF) e alternância para o modo de visualização compacta.
3. **Consulta, Edição e Exclusão de Comprovantes (`app/detalhes/[id].tsx`):**
   Tela de detalhes acessada por rota dinâmica que exibe todas as informações do comprovante, permite atualizar descrição, categoria, endereço e observações (`PUT`), remover o registro do histórico (`DELETE`), abrir a coordenada exata no Google Maps e compartilhar o recibo.
4. **Central de Documentos, Atestados e Espelho de Ponto (`app/(tabs)/explore.tsx`):**
   Módulo para anexar justificativas e atestados em PDF vinculados ao último registro, selecionar fotos da galeria com recorte proporcional para envio ao servidor (`POST /upload`), gerar arquivos físicos de espelho de ponto (`vistoria-ponto.txt`) na memória interna do dispositivo e salvar cópias de comprovantes fotográficos no álbum do sistema.
5. **Perfil Cadastral e Escala de Trabalho (`app/(tabs)/cadastro.tsx`):**
   Formulário cadastral do colaborador com aplicação de máscaras em tempo real para CPF, telefone e data de nascimento, seletor de turno em grade 2x2 (`Diurno`, `Flexível`, `Escala 12x36` e `Remoto / Híbrido`) e persistência local dos dados.

---

## 3. Recursos Tecnológicos Utilizados

| Categoria | Recurso / Tecnologia | Onde e Como Foi Utilizado |
| :--- | :--- | :--- |
| **React Hooks** | `useState`, `useEffect`, `useCallback`, `useRef`, `useFocusEffect` | Gerenciamento de estado dos formulários, listas, câmera e GPS (`useState`); relógio digital com `setInterval` e leitura inicial de permissões/dados (`useEffect`); referência imperativa da lente `<CameraView />` (`useRef`); recarregamento ao focar nas abas (`useFocusEffect`). |
| **Listas e UI Nativos** | `FlatList`, `ScrollView`, `Switch`, `TextInput`, `TouchableOpacity`, `Alert`, `Image`, `ActivityIndicator`, `KeyboardAvoidingView` | Renderização otimizada do histórico de ponto mobile com `FlatList` (`keyExtractor`, `renderItem` e `ListHeaderComponent` em `app/(tabs)/index.tsx`); chaveamento do modo compacto (`Switch`); entradas controladas e alertas nativos de confirmação. |
| **Otimização e Animações** | `React.memo`, `Animated`, `useWindowDimensions` | Prevenção de renderizações desnecessárias nos cartões da lista (`components/RegistroCard.tsx`); animação de mola nos botões (`components/BotaoPress.tsx`) e no menu gaveta (`components/AppShell.tsx`); adaptação automática entre layout mobile e desktop. |
| **Navegação** | `React Navigation` (`@react-navigation/native`, `bottom-tabs`) e `Expo Router` (`Stack`, `Tabs`, `Link`, `useRouter`, `useLocalSearchParams`) | Navegação em abas inferiores (`Jornada`, `Documentos`, `Perfil` em `app/(tabs)/_layout.tsx`), pilha de telas (`app/_layout.tsx`), rota dinâmica por identificador (`app/detalhes/[id].tsx`), links declarativos (`<Link>`) e navegação programática (`router.push`, `router.back`). |
| **Persistência Local** | `AsyncStorage` (`@react-native-async-storage/async-storage`) | Serviço dedicado (`services/storageService.ts`) com serialização `JSON.stringify` e `JSON.parse`, utilizando `setItem`, `getItem`, `removeItem`, `getAllKeys`, `multiGet` e `clear` para gravar histórico de pontos, perfil do colaborador e preferências no disco do aparelho. |
| **APIs e Backend** | `fetch()`, `FormData`, `Node.js` + `Express` (`api/server.js`) e OpenStreetMap Nominatim | Cliente HTTP (`services/apiService.ts`) consumindo o servidor Express nas rotas `GET /clima`, `GET /pontos`, `GET /pontos/:id`, `POST /pontos`, `PUT /pontos/:id`, `DELETE /pontos/:id` e upload multipart em `POST /upload`, além de geocodificação reversa. |

---

## 4. Recursos Nativos Implementados e Demonstrados

O projeto implementa e integra os seguintes recursos nativos do dispositivo móvel:

1. **Câmera do Dispositivo (`expo-camera` em `app/(tabs)/index.tsx`):**
   Gerenciamento do ciclo de permissões via `useCameraPermissions()`, exibição do visor em tempo real com `<CameraView />`, inversão entre câmera frontal e traseira e captura fotográfica (`takePictureAsync`) vinculada automaticamente ao registro de ponto e exibida na pré-visualização.
2. **Geolocalização GPS e Geocodificação Reversa (`expo-location` em `app/(tabs)/index.tsx` e `app/detalhes/[id].tsx`):**
   Solicitação de permissão em primeiro plano (`requestForegroundPermissionsAsync`), obtenção das coordenadas físicas de latitude e longitude (`getCurrentPositionAsync`) e tradução da coordenada para logradouro, bairro e cidade (`reverseGeocodeAsync`).
3. **Autenticação Biométrica / Identidade Local (`expo-local-authentication` em `app/(tabs)/index.tsx`):**
   Inspeção do sensor biométrico do aparelho (`hasHardwareAsync` e `isEnrolledAsync`) e acionamento do leitor de impressão digital ou reconhecimento facial do sistema operacional (`authenticateAsync`) para autorizar a marcação do ponto.
4. **Sistema de Arquivos Físico (`expo-file-system` em `app/(tabs)/explore.tsx`):**
   Gravação e leitura direta de arquivos no diretório interno de documentos do aplicativo (`Paths.document` com a classe `File`) para gerar o relatório offline `vistoria-ponto.txt`.
5. **Seleção de Documentos PDF e Galeria de Imagens (`expo-document-picker` e `expo-image-picker` em `app/(tabs)/explore.tsx`):**
   Abertura do seletor nativo de arquivos filtrando documentos `application/pdf` (`getDocumentAsync`) para anexar atestados médicos, e abertura da galeria de mídia com recorte 4:3 e compressão de imagem (`launchImageLibraryAsync`).
6. **Compartilhamento Nativo, Álbum de Fotos, Deep Linking e Resposta Tátil (`expo-sharing`, `Share`, `expo-media-library`, `Linking` e `expo-haptics`):**
   Envio de arquivos físicos via folha de compartilhamento do sistema (`Sharing.shareAsync`), exportação de comprovantes em texto (`Share.share`), gravação de fotos na galeria pública com permissão restrita de escrita (`MediaLibrary.saveToLibraryAsync`), abertura do aplicativo de mapas externo (`Linking.openURL`) e feedback tátil nas abas (`HapticTab`).

---

## 5. APK de Instalação e Repositório Git

- **Repositório no GitHub:** [https://github.com/sagihtt/Krono](https://github.com/sagihtt/Krono)
- **Download Direto do APK (Versão Final `v2.2.3`):** [krono-v2.2.3.apk](https://github.com/sagihtt/Krono/releases/download/v2.2.3/krono-v2.2.3.apk)
- **Página da Release Oficial:** [https://github.com/sagihtt/Krono/releases/tag/v2.2.3](https://github.com/sagihtt/Krono/releases/tag/v2.2.3)

---

## 6. Registros Visuais da Aplicação (Interface Mobile)

As capturas abaixo demonstram as funcionalidades e os recursos nativos em execução:

### Fluxo Operacional de Registro de Ponto

| 01. Jornada Principal | 02. Histórico de Ponto | 03. Menu Lateral Deslizante |
| :---: | :---: | :---: |
| <img src="docs/screenshots/01-mobile-jornada.png" width="260" alt="Jornada Principal" /> | <img src="docs/screenshots/02-mobile-historico.png" width="260" alt="Histórico de Ponto" /> | <img src="docs/screenshots/03-mobile-menu-lateral.png" width="260" alt="Menu Lateral" /> |
| Relógio em tempo real, seleção de tipo de ponto, GPS e câmera | Listagem em `FlatList` com badges de sincronização e modo compacto | Menu gaveta com registros recentes e atalhos rápidos |

### Gestão Documental, Perfil e Comprovantes

| 04. Anexos e Documentos | 05. Dados Cadastrais | 06. Grade de Turnos 2x2 | 07. Comprovante Digital |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/04-mobile-documentos.png" width="200" alt="Documentos" /> | <img src="docs/screenshots/05-mobile-perfil.png" width="200" alt="Perfil" /> | <img src="docs/screenshots/06-mobile-perfil-turnos.png" width="200" alt="Grade de Turnos" /> | <img src="docs/screenshots/07-mobile-comprovante.png" width="200" alt="Comprovante" /> |
| Atestados em PDF, fotos da galeria e geração de espelho em TXT | Dados do colaborador com máscaras dinâmicas de validação | Seletor simétrico de turnos com persistência em `AsyncStorage` | Rota dinâmica com endereço reverso, edição, exclusão e compartilhamento |

---

## 7. Sistema Visual e Navegação Adaptativa

Tokens de design aplicados em `constants/theme.ts`, `components/AppShell.tsx` e `components/AntigravityHeader.tsx`:

| Token | Valor | Aplicação no App |
| :--- | :--- | :--- |
| **Obsidian Ink** | `#121317` | Tipografia principal, botões primários em formato pílula e barra de status |
| **Pure Canvas** | `#FFFFFF` | Plano de fundo limpo de alto contraste |
| **Bento Surface** | `#F8F9FC` | Superfície dos cartões modulares (`borderRadius: 20px`) |
| **Pill Surface** | `#EEF1F8` | Botões secundários, seletores de turno e badges informativos (`borderRadius: 9999px`) |
| **Spectrum Accents** | `#3186FF` / `#00B95C` / `#FC413D` / `#FBBC04` | Indicadores de status (Entrada, Saída, Hora Extra e Sincronização com Servidor) |

### Layout Responsivo (`components/AppShell.tsx`)
- **Android e iOS (`width < 960px`):** Menu lateral deslizante acionado pelo topo da tela, com atalhos para as seções principais, lista de marcações recentes para acesso rápido aos comprovantes, controle de densidade visual (`Lista compacta`) e resumo do colaborador.
- **Web e Telas Grandes (`width >= 960px`):** Barra lateral fixa à esquerda e área de conteúdo centralizada (`maxWidth: 1080px`) distribuída em grade de duas colunas.

---

## 8. Arquitetura Modular de Pastas

```text
registroDePonto/
├── api/                          # Servidor Backend Node.js + Express
│   ├── package.json
│   ├── README.md
│   └── server.js                 # Rotas /clima, CRUD /pontos, CRUD /filmes e POST /upload
├── app/                          # Rotas do Expo Router (File-based routing)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Navegação em 3 abas principais (Jornada, Documentos, Perfil)
│   │   ├── index.tsx             # Aba 1: Relógio em tempo real, Biometria, Câmera, GPS e FlatList
│   │   ├── cadastro.tsx          # Aba 2: Perfil do Colaborador, grade 2x2 de turnos e AsyncStorage
│   │   └── explore.tsx           # Aba 3: Central de Documentos, Share, ImagePicker, PDF e FileSystem
│   ├── detalhes/
│   │   └── [id].tsx              # Rota dinâmica de comprovante com leitura por ID, PUT, DELETE e Share
│   └── _layout.tsx
├── components/                   # Componentes de UI reutilizáveis e desacoplados
│   ├── AppShell.tsx              # Shell adaptativo (menu lateral mobile + barra lateral fixa Web)
│   ├── AntigravityHeader.tsx     # Cabeçalho com indicador de conectividade
│   ├── BotaoPress.tsx            # Botão pílula com animação de mola (Animated.spring)
│   ├── RegistroCard.tsx          # Card otimizado com React.memo e badges semânticos
│   └── cadastro/                 # Inputs com máscara, PickerModal e Checkbox
├── constants/
│   ├── pontosMock.ts             # 5 registros iniciais padronizados
│   └── theme.ts                  # Paleta AntigravityPalette, Radii e fontes
├── models/
│   └── ponto.ts                  # Contratos TypeScript (PontoRegistro, PerfilColaborador, AnexoDocumento)
├── services/                     # Camada de serviços isolada da interface
│   ├── apiService.ts             # Cliente HTTP fetch() para GET, POST, PUT, DELETE e FormData
│   └── storageService.ts         # Persistência local com AsyncStorage e serialização JSON
├── krono-v2.2.3.apk              # Pacote de instalação Android correspondente à versão final
├── CHANGELOG.md                  # Histórico completo do Versionamento Semântico (v1.0.0 a v2.2.3)
└── README.md
```

---

## 9. Como Executar o Projeto Completo

### 1. Iniciar a API Local Node.js + Express (Modo Online)

Em um terminal separado, inicie o servidor na porta `3000`:

```bash
cd api
npm install
npm start
```

> **Operação Híbrida (Online e Offline):** O aplicativo possui fallback automático para o `AsyncStorage`. Caso o servidor Express não esteja em execução, o app continua operando localmente e sincroniza quando o servidor estiver disponível.

### 2. Iniciar o Aplicativo Expo (SDK 58)

Na raiz do projeto `registroDePonto`:

```bash
npm install
npx expo start
```

- Pressione **`w`** para abrir no navegador Web.
- Pressione **`a`** para abrir no emulador Android ou escaneie o QR Code no aplicativo **Expo Go (SDK 58)**.

### 3. Instalação Direta no Android (APK Standalone)

Para instalar o aplicativo diretamente em qualquer smartphone Android sem depender do Expo Go:

1. Baixe o instalador `krono-v2.2.3.apk` na seção de [Releases do repositório](https://github.com/sagihtt/Krono/releases/tag/v2.2.3) ou utilize o arquivo `krono-v2.2.3.apk` presente neste diretório.
2. Transfira o arquivo para o dispositivo móvel ou faça o download diretamente pelo navegador do celular.
3. Autorize a instalação de fontes desconhecidas nas configurações do Android e conclua a instalação.

Para reproduzir o empacotamento com o EAS CLI:

```bash
npx eas-cli build -p android --profile preview
```
