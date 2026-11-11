# Krono: Gestão de Jornada e Frequência (`v2.3.0`)

<p align="left">
  <img src="docs/screenshots/logo-krono.png" width="96" alt="Logotipo oficial do Krono" />
</p>

Aplicativo multiplataforma (Android, iOS e Web) construído em React Native com Expo SDK 58 e Expo Router, conectado em tempo real à API REST em Node.js e Express hospedada em produção (`https://krono.engine.lat/api`).

[![Android APK](https://img.shields.io/badge/Download-APK%20Android%20v2.3.0-00B95C?logo=android&logoColor=white)](https://github.com/sagihtt/Krono/releases/download/v2.3.0/krono-v2.3.0.apk)
[![GitHub Release](https://img.shields.io/badge/Release-v2.3.0-121317?logo=github&logoColor=white)](https://github.com/sagihtt/Krono/releases/tag/v2.3.0)
[![Web App](https://img.shields.io/badge/Web%20App-krono.engine.lat-3186FF?logo=googlechrome&logoColor=white)](https://krono.engine.lat)
[![API Online](https://img.shields.io/badge/API-Online%20200%20OK-00B95C?logo=nodedotjs&logoColor=white)](https://krono.engine.lat/api/health)

---

## 1. Identificação do Aplicativo

- **Nome da aplicação:** Krono (`com.sagihtt.krono`)
- **Problema que busca resolver:** Equipes presenciais, híbridas ou em campo frequentemente enfrentam atrasos no fechamento de folha quando o controle de ponto depende de anotações manuais, planilhas soltas ou sistemas que travam sem sinal de celular. Isso gera divergências sobre o horário e o local da batida, perda de atestados médicos e lentidão na hora de registrar entradas e intervalos. O Krono resolve esse fluxo reunindo confirmação biométrica, localização convertida em endereço legível e fotografia de comprovação em uma única tela rápida. Os registros vão direto para o servidor em nuvem (`https://krono.engine.lat/api`) com histórico isolado por aparelho, mantendo o armazenamento local como contingência automática quando o dispositivo fica sem internet.

---

## 2. Principais Funcionalidades

1. **Marcação de Ponto Instantânea com Pré-seleção Inteligente (`app/(tabs)/index.tsx` e `utils/jornada.ts`):**
   Exibe data, turno ativo e relógio digital contínuo, sugere automaticamente a próxima batida do dia na ordem natural da jornada (`Entrada Regular`, `Intervalo`, `Retorno`, `Saída Regular` e `Hora Extra`) e atualiza a tela na hora do toque enquanto sincroniza foto e dados em segundo plano.
2. **Histórico Sincronizado e Modo Compacto (`app/(tabs)/index.tsx` e `components/RegistroCard.tsx`):**
   Lista cronológica das marcações com selos que indicam se o registro já está salvo na nuvem (`Sincronizado`) ou aguardando conexão (`Salvo no aparelho`), indicadores de foto ou PDF anexado e chave para alternar a densidade visual dos cartões.
3. **Comprovante Individual com Edição, Exclusão e Mapa (`app/detalhes/[id].tsx`):**
   Tela dedicada para cada registro que mostra todos os metadados da batida, abre a posição no Google Maps, compartilha o recibo formatado, edita informações (`PUT /pontos/:id`) e remove marcações com confirmação direta (`DELETE /pontos/:id`).
4. **Central de Documentos, Atestados e Espelho de Ponto (`app/(tabs)/explore.tsx`):**
   Permite anexar justificativas em PDF ao registro mais recente, enviar fotos da galeria ao servidor via `multipart/form-data` (`POST /upload`), gerar o relatório `vistoria-ponto.txt` no armazenamento interno do celular e salvar cópias de comprovantes fotográficos no álbum do aparelho.
5. **Perfil do Colaborador e Escala de Trabalho (`app/(tabs)/cadastro.tsx`):**
   Cadastro com máscaras automáticas para CPF, telefone e data de nascimento, grade 2x2 para escolha do turno de trabalho (`Diurno`, `Flexível`, `Escala 12x36` e `Remoto / Híbrido`) e configuração do endereço da API.

---

## 3. Recursos Tecnológicos Utilizados

| Categoria | Recursos Utilizados | Aplicação no Projeto |
| :--- | :--- | :--- |
| **React Hooks** | `useState`, `useEffect`, `useCallback`, `useRef`, `useFocusEffect` | Controle dos campos, listas, permissões e estados de carregamento (`useState`); ciclo do relógio isolado em `components/RelogioDigital.tsx` e aquecimento de GPS (`useEffect`); referência da câmera e cache temporal (`useRef`); atualização ao alternar abas (`useFocusEffect`). |
| **Componentes Nativos e Listas** | `FlatList`, `ScrollView`, `Switch`, `TextInput`, `Pressable`, `TouchableOpacity`, `Alert`, `Image`, `ActivityIndicator`, `KeyboardAvoidingView`, `Modal` | Listagem virtualizada do histórico com `FlatList` (`keyExtractor`, `renderItem` e `ListHeaderComponent`); alternância do modo compacto (`Switch`); formulários controlados com máscaras em `utils/masks.ts`; gaveta lateral em `Modal`. |
| **Desempenho e Layout** | `React.memo`, `Animated`, `useWindowDimensions`, `AbortController` | Cartões memorizados em `components/RegistroCard.tsx`; animações de mola nos botões (`components/BotaoPress.tsx`) e no menu deslizante (`components/AppShell.tsx`); layout adaptativo entre celular (`< 960px`) e Web (`>= 960px`); timeout controlado nas chamadas de rede. |
| **Navegação** | `React Navigation` (`@react-navigation/native`, `bottom-tabs`) e `Expo Router` (`Stack`, `Tabs`, `Link`, `useRouter`, `useLocalSearchParams`, `usePathname`) | Abas inferiores (`Jornada`, `Documentos` e `Perfil` em `app/(tabs)/_layout.tsx`), pilha principal (`app/_layout.tsx`), rota dinâmica de comprovantes (`app/detalhes/[id].tsx`), links declarativos (`<Link>`) e navegação imperativa (`router.push`, `router.replace`). |
| **Persistência Local** | `AsyncStorage` (`@react-native-async-storage/async-storage`) | Camada `services/storageService.ts` com `setItem`, `getItem`, `removeItem` e serialização `JSON.stringify` / `JSON.parse` para guardar perfil, preferências, identificador do aparelho (`X-Krono-Client-Id`) e fila offline de registros. |
| **APIs e Servidor** | `fetch()`, `FormData`, `Node.js` + `Express` (`api/server.js`), Docker, Nginx e OpenStreetMap Nominatim | Cliente HTTP (`services/apiService.ts`) integrado às rotas `GET /health`, `GET /clima`, `GET /pontos`, `GET /pontos/:id`, `POST /pontos`, `PUT /pontos/:id`, `DELETE /pontos/:id` e `POST /upload`, com persistência em disco no servidor `krono.engine.lat` e geocodificação reversa de endereços. |

---

## 4. Recursos Nativos Implementados e Demonstrados

O aplicativo utiliza seis integrações nativas do sistema operacional móvel, destacando-se na operação diária:

1. **Câmera Integrada (`expo-camera` em `app/(tabs)/index.tsx`):**
   Solicita permissão pelo hook `useCameraPermissions()`, renderiza o visor ao vivo com `<CameraView />`, alterna entre lente frontal e traseira e dispara a captura rápida (`takePictureAsync({ quality: 0.45, skipProcessing: true })`) no ato da batida, exibindo a miniatura anexada e enviando o arquivo ao servidor.
2. **Geolocalização GPS e Geocodificação Reversa (`expo-location` em `app/(tabs)/index.tsx` e `app/detalhes/[id].tsx`):**
   Requisita acesso em primeiro plano (`requestForegroundPermissionsAsync`), lê coordenadas físicas com reaproveitamento de leitura recente (`getLastKnownPositionAsync` e `getCurrentPositionAsync`) e converte latitude e longitude em rua, bairro e cidade (`reverseGeocodeAsync`), oferecendo atalho direto para abrir o ponto no mapa.
3. **Biometria do Dispositivo (`expo-local-authentication` em `app/(tabs)/index.tsx`):**
   Consulta a presença de leitor biométrico cadastrado (`hasHardwareAsync` e `isEnrolledAsync`) e exige confirmação por impressão digital ou reconhecimento facial (`authenticateAsync`) antes de efetivar a marcação no celular.
4. **Sistema de Arquivos Interno (`expo-file-system` em `app/(tabs)/explore.tsx`):**
   Grava e lê o arquivo físico `vistoria-ponto.txt` dentro do diretório privado do aplicativo (`Paths.document` e classe `File`) para emissão offline do espelho de jornada.
5. **Seletor de Documentos PDF e Galeria (`expo-document-picker` e `expo-image-picker` em `app/(tabs)/explore.tsx`):**
   Abre o seletor nativo filtrando arquivos `application/pdf` (`getDocumentAsync`) para vincular atestados médicos ao ponto e acessa a galeria com corte `4:3` (`launchImageLibraryAsync`).
6. **Compartilhamento Nativo, Galeria Pública e Resposta Tátil (`expo-sharing`, `Share`, `expo-media-library` e `expo-haptics`):**
   Compartilha arquivos físicos (`Sharing.shareAsync`) e recibos em texto (`Share.share`), salva fotos no álbum do aparelho com permissão exclusiva de escrita (`MediaLibrary.saveToLibraryAsync`) e aciona vibração tátil na troca de abas (`components/haptic-tab.tsx`).

---

## 5. Demonstração Visual (Interface Mobile)

As telas abaixo retratam o aplicativo conectado ao servidor `https://krono.engine.lat/api`:

### Jornada, Histórico e Navegação

| 01. Jornada de Hoje | 02. Histórico Sincronizado | 03. Menu Lateral |
| :---: | :---: | :---: |
| <img src="docs/screenshots/01-mobile-jornada.png" width="255" alt="Tela Jornada de Hoje" /> | <img src="docs/screenshots/02-mobile-historico.png" width="255" alt="Histórico de Marcações" /> | <img src="docs/screenshots/03-mobile-menu-lateral.png" width="255" alt="Menu Lateral Krono" /> |
| Relógio digital, pré-seleção automática da próxima batida, endereço e câmera | Lista em `FlatList` com status `Sincronizado` e chave de modo compacto | Gaveta lateral com marca oficial em fundo escuro e atalhos recentes |

### Documentos, Perfil e Comprovante Individual

| 04. Central de Documentos | 05. Dados do Colaborador | 06. Escala 2x2 | 07. Comprovante Digital |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/04-mobile-documentos.png" width="195" alt="Central de Documentos" /> | <img src="docs/screenshots/05-mobile-perfil.png" width="195" alt="Perfil do Colaborador" /> | <img src="docs/screenshots/06-mobile-perfil-turnos.png" width="195" alt="Seleção de Turnos" /> | <img src="docs/screenshots/07-mobile-comprovante.png" width="195" alt="Comprovante de Ponto" /> |
| Anexos PDF, envio de imagens e geração de espelho em TXT | Campos com máscaras de CPF, telefone e data | Seletor 2x2 de turno e conexão com a API em nuvem | Rota dinâmica com endereço, link de mapa, edição e exclusão |

---

## 6. Acesso Rápido, APK e Infraestrutura Online

- **Aplicação Web em Produção:** [https://krono.engine.lat](https://krono.engine.lat)
- **API REST Online (Healthcheck):** [https://krono.engine.lat/api/health](https://krono.engine.lat/api/health)
- **Download Direto do APK Android (`v2.3.0` no GitHub):** [krono-v2.3.0.apk](https://github.com/sagihtt/Krono/releases/download/v2.3.0/krono-v2.3.0.apk)
- **Download Direto do APK Android (`v2.3.0` no Expo EAS):** [luksox1m1-J3wl4eQmMySwmBQC-InKL-_W0PiU-z2lQ.apk](https://expo.dev/artifacts/eas/luksox1m1-J3wl4eQmMySwmBQC-InKL-_W0PiU-z2lQ.apk)
- **Compilação EAS Build (`v2.3.0`):** [Build `6cffc7e2-3b00-4f90-975a-3e06e4676630`](https://expo.dev/accounts/sagihtt/projects/registrodeponto/builds/6cffc7e2-3b00-4f90-975a-3e06e4676630)
- **Release Oficial no GitHub:** [https://github.com/sagihtt/Krono/releases/tag/v2.3.0](https://github.com/sagihtt/Krono/releases/tag/v2.3.0)
- **Painel de Compilações no Expo (EAS):** [https://expo.dev/accounts/sagihtt/projects/registrodeponto/builds](https://expo.dev/accounts/sagihtt/projects/registrodeponto/builds)

> Qualquer pessoa que instalar o APK no Android já sai conectada por padrão ao endereço `https://krono.engine.lat/api`, sem precisar configurar IP local nem depender apenas do armazenamento interno.

---

## 7. Estrutura do Projeto

```text
registroDePonto/
├── __tests__/
│   └── krono.test.mjs            # Testes unitários de máscaras, jornada e auditoria de UI
├── api/                          # Backend Node.js + Express (v2.3.0)
│   ├── __tests__/server.test.js  # Testes de integração REST, isolamento e upload binário
│   ├── nginx/                    # Configuração de proxy reverso para krono.engine.lat
│   ├── Dockerfile                # Imagem de produção Node 20 Alpine
│   ├── docker-compose.yml        # Orquestração com volume persistente em disco
│   └── server.js                 # Servidor Express com persistência atômica por cliente
├── app/                          # Rotas do Expo Router
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Abas inferiores (Jornada, Documentos e Perfil)
│   │   ├── index.tsx             # Registro otimista, biometria, GPS, câmera e FlatList
│   │   ├── explore.tsx           # Anexos PDF, upload multipart, espelho TXT e galeria
│   │   └── cadastro.tsx          # Perfil cadastral, máscaras e seletor de turnos 2x2
│   ├── detalhes/[id].tsx         # Comprovante individual com edição, exclusão e compartilhamento
│   └── _layout.tsx               # Pilha raiz de navegação
├── assets/images/                # Logotipo vetorial SVG e ícones adaptativos com fundo escuro
├── components/                   # Componentes reutilizáveis (AppShell, KronoLogo, RelogioDigital, etc.)
├── constants/                    # Paleta de cores, raios e registros demonstrativos
├── models/                       # Tipagens TypeScript (PontoRegistro, PerfilColaborador, etc.)
├── services/                     # Cliente HTTP com timeout (apiService) e cache local (storageService)
├── utils/                        # Regras de progressão de jornada e máscaras de formulário
├── CHANGELOG.md                  # Histórico de versões (v1.0.0 a v2.3.0)
└── README.md
```

---

## 8. Como Executar e Testar Localmente

### Rodar o aplicativo conectado à API de produção

```bash
npm install
npx expo start
```

### Rodar a suíte completa de testes e checagem estática

```bash
npm run test:all
./node_modules/.bin/tsc --noEmit
npm run lint
```

### Subir uma instância local da API (opcional)

```bash
cd api
npm install
npm start
```

Caso queira apontar o aplicativo para `http://localhost:3000` durante testes locais, basta alterar o campo de servidor na aba **Perfil**.
