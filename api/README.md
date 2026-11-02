# API Local Node.js + Express (`registroDePonto/api`)

Servidor RESTful desenvolvido para cumprir as exigências práticas das **Aulas 17 e 18** de Programação para Dispositivos Móveis.

## Como Executar

```bash
cd api
npm install
npm start
```

Por padrão, o servidor escuta na porta `3000` (`http://localhost:3000`).

> **Dispositivo Físico (Expo Go):** Caso execute o aplicativo no celular físico conectado ao Wi-Fi, descubra o IPv4 da máquina (`ipconfig` no Windows) e atualize o campo de URL da API na aba **Perfil & Storage** do aplicativo para `http://SEU_IP_LOCAL:3000`.

---

## Rotas Disponíveis

### 1. Diagnóstico e Clima (Aula 17)
- **`GET /clima`**: Retorna um JSON com temperatura, cidade e status do servidor (`200 OK`).

### 2. CRUD de Registros de Ponto (Aulas 17 e 18)
- **`GET /pontos`**: Lista todos os registros de ponto armazenados em memória (`200 OK`).
- **`GET /pontos/:id`**: Busca um registro específico via `req.params.id` (`200 OK` ou `404 Not Found`).
- **`POST /pontos`**: Cria um novo registro lendo `req.body` com middleware `express.json()` (`201 Created` ou `400 Bad Request`).
- **`PUT /pontos/:id`**: Atualiza um registro existente combinando `req.params.id` e `req.body` (`200 OK`, `400 Bad Request` ou `404 Not Found`).
- **`DELETE /pontos/:id`**: Remove um registro do array usando `.findIndex()` e `.splice()` (`204 No Content` ou `404 Not Found`).

### 3. CRUD de Catálogo de Filmes (Exercício Original da Aula 18)
- **`GET /filmes`**, **`GET /filmes/:id`**, **`POST /filmes`**, **`PUT /filmes/:id`** e **`DELETE /filmes/:id`** seguindo exatamente a especificação dos slides da Aula 18 (`titulo` e `diretor`).

### 4. Recebimento de Arquivos via `FormData` (Aula 21)
- **`POST /upload`**: Recebe envios `multipart/form-data` disparados pela aba **Arquivos & Mídia** (`201 Created`).
