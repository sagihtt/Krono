# Diretrizes do Agente — Krono (`registroDePonto`)

Antes de realizar alterações neste projeto, leia o arquivo [CONTEXTO_PROJETO.md](./CONTEXTO_PROJETO.md) e o [README.md](./README.md).

## Stack Atual
- **Expo SDK 58** (`expo@^58.0.0`, `react@19.3.0`, `react-native@0.88.1`, `expo-router@~58.0.29`, `typescript@~6.0.3`).
- Documentação de referência do SDK: https://docs.expo.dev/versions/latest/
- Backend local em `api/server.js` (Node.js + Express na porta `3000`).

## Regras Obrigatórias do Projeto
1. **Produto Oficial (`Krono`)**: Nunca exiba nomes de aulas (`Aula 16`, `Aula 20`), nomes de laboratórios ou jargões técnicos (`POST`, `GET`, `PUT`, `DELETE`, `AsyncStorage`, `FormData`, latitude/longitude brutas) na interface do usuário.
2. **Zero Emojis**: Não utilize emojis em nenhum componente visual nem nos arquivos Markdown de documentação. Utilize ícones `@expo/vector-icons/Feather`.
3. **Layout Responsivo**: Mantenha a compatibilidade simultânea entre Mobile (`width < 960px` com menu gaveta em `components/AppShell.tsx`) e Web (`width >= 960px` com barra lateral fixa e 2 colunas).
4. **Versionamento Semântico**: Documente novas entregas em `CHANGELOG.md` e crie tags Git anotadas (`vX.Y.Z`).
