const http = require('http');
const { URL } = require('url');

const PORT = 4010;

const products = [
  { id: 1, title: 'Backpack QA Pro', price: 79.99 },
  { id: 2, title: 'Keyboard TKL', price: 129.5 },
  { id: 3, title: 'Noise Cancelling Headset', price: 219.0 },
];

const sendJson = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(body));
};

const collectBody = (request) =>
  new Promise((resolve, reject) => {
    let data = '';

    request.on('data', (chunk) => {
      data += chunk;
    });
    request.on('end', () => resolve(data));
    request.on('error', reject);
  });

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;

  if (request.method === 'GET' && path === '/health') {
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === 'POST' && path === '/api/login') {
    const rawBody = await collectBody(request);
    const body = rawBody ? JSON.parse(rawBody) : {};

    if (body.email && body.password) {
      return sendJson(response, 200, { token: 'local-demo-token-12345' });
    }

    return sendJson(response, 400, { error: 'Missing credentials' });
  }

  if (request.method === 'GET' && path === '/products') {
    const limit = Number(url.searchParams.get('limit') ?? products.length);
    return sendJson(response, 200, products.slice(0, limit));
  }

  if (request.method === 'GET' && path.startsWith('/products/')) {
    const id = Number(path.split('/').at(-1));
    const product = products.find((item) => item.id === id);

    if (product) {
      return sendJson(response, 200, product);
    }

    return sendJson(response, 404, { error: 'Product not found' });
  }

  return sendJson(response, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock API server listening on http://127.0.0.1:${PORT}`);
});
