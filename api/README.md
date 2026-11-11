# Krono Express API (`v2.3.0`)

Servidor REST em Node.js e Express responsável pela sincronização em nuvem dos registros de ponto, persistência atômica em disco e recebimento de comprovantes via `multipart/form-data`.

## Ambientes

- **Produção:** `https://krono.engine.lat/api` (container Docker `krono-api` atrás de proxy reverso Nginx com TLS Let's Encrypt).
- **Desenvolvimento local:** `http://localhost:3000`

## Execução Local

```bash
cd api
npm install
npm start
```

Para rodar a suíte de testes de integração da API:

```bash
npm test
```

## Execução com Docker

```bash
cd api
docker compose up -d --build
```

Os dados ficam persistidos no diretório `data/db.json` e os anexos enviados pela aplicação ficam em `data/uploads/`.

## Isolamento por Dispositivo

Cada instalação do aplicativo gera um identificador único enviado no cabeçalho `X-Krono-Client-Id`. O servidor separa a coleção de registros por cliente, permitindo que múltiplos aparelhos utilizem a API pública sem sobrescrever o histórico uns dos outros.

## Rotas Disponíveis

- **`GET /health`**: Estado do container, versão da API e contagem de clientes ativos (`200 OK`).
- **`GET /clima`**: Verificação rápida de conectividade utilizada pelo cabeçalho do aplicativo (`200 OK`).
- **`GET /pontos`** e **`GET /pontos/:id`**: Consulta da coleção de registros do cliente atual (`200 OK` ou `404 Not Found`).
- **`POST /pontos`**: Criação de registro de ponto (`201 Created` ou `400 Bad Request`).
- **`PUT /pontos/:id`**: Atualização de campos e vínculos de anexo (`200 OK`, `400 Bad Request` ou `404 Not Found`).
- **`DELETE /pontos/:id`**: Remoção definitiva do registro sem recarregar mocks quando a lista zera (`204 No Content` ou `404 Not Found`).
- **`POST /upload`**: Upload binário `multipart/form-data` com gravação física em `/uploads/<arquivo>` e retorno da URL pública (`201 Created`).
- **`GET /filmes`**, **`POST /filmes`**, **`PUT /filmes/:id`** e **`DELETE /filmes/:id`**: Rotas auxiliares mantidas por compatibilidade com os exercícios anteriores.
