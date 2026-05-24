import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clearStatements,
  getConversionBudget,
  getConversionBudgetSummary,
  getPersonalBudget,
  getPersonalBudgetSummary,
  getState,
  getWealthPortfolio,
  getWealthSummary,
  importStatementFiles,
  importStatementText,
  loadSampleStatement,
  sendBudgetSummaryEmail,
  updateBudgets,
  updateConversionBudget,
  updatePersonalBudget,
  updateTheme,
  updateWealthPortfolio
} from './store.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '..');
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';
const allowedOrigin = process.env.CORS_ORIGIN ?? '*';
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES ?? 15 * 1024 * 1024);
const staticRoot = resolve(process.env.STATIC_ROOT ?? resolveDefaultStaticRoot());
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const routeKey = `${request.method ?? 'GET'} ${url.pathname}`;

    switch (routeKey) {
      case 'GET /api/health':
        sendJson(response, 200, { status: 'ok' });
        return;
      case 'GET /api/state':
        sendJson(response, 200, await getState());
        return;
      case 'GET /api/personal-budget':
        sendJson(response, 200, await getPersonalBudget());
        return;
      case 'GET /api/personal-budget-summary':
        sendJson(response, 200, await getPersonalBudgetSummary());
        return;
      case 'PUT /api/personal-budget':
        sendJson(response, 200, await updatePersonalBudget(await readJsonBody(request)));
        return;
      case 'GET /api/conversion-budget':
        sendJson(response, 200, await getConversionBudget());
        return;
      case 'GET /api/conversion-budget-summary':
        sendJson(response, 200, await getConversionBudgetSummary());
        return;
      case 'PUT /api/conversion-budget':
        sendJson(response, 200, await updateConversionBudget(await readJsonBody(request)));
        return;
      case 'GET /api/wealth':
        sendJson(response, 200, await getWealthPortfolio());
        return;
      case 'GET /api/wealth-summary':
        sendJson(response, 200, await getWealthSummary());
        return;
      case 'PUT /api/wealth':
        sendJson(response, 200, await updateWealthPortfolio(await readJsonBody(request)));
        return;
      case 'PUT /api/settings/theme': {
        const body = await readJsonBody(request);
        sendJson(response, 200, await updateTheme(body.theme));
        return;
      }
      case 'PUT /api/budgets': {
        const body = await readJsonBody(request);
        sendJson(response, 200, await updateBudgets(body.budgets));
        return;
      }
      case 'POST /api/statements/import-text':
        sendJson(response, 200, await importStatementText(await readJsonBody(request)));
        return;
      case 'POST /api/statements/import-files':
        sendJson(response, 200, await importStatementFiles(await readJsonBody(request)));
        return;
      case 'POST /api/statements/sample':
        sendJson(response, 200, await loadSampleStatement());
        return;
      case 'POST /api/budget-summary-email':
        sendJson(response, 200, await sendBudgetSummaryEmail());
        return;
      case 'DELETE /api/statements':
        sendJson(response, 200, await clearStatements());
        return;
      default:
        if (isApiPath(url.pathname)) {
          sendJson(response, 404, { error: 'Not found' });
          return;
        }

        await serveStaticRequest(request, response, url.pathname);
        return;
    }
  } catch (error) {
    const status = error.statusCode ?? 500;
    sendJson(response, status, { error: error.message ?? 'Unexpected server error' });
  }
});

server.listen(port, host, () => {
  console.log(`Budget Signal server listening on http://${host}:${port}`);
});

function resolveDefaultStaticRoot() {
  const candidates = [
    join(projectRoot, 'dist', 'budget-signal', 'browser'),
    join(projectRoot, 'dist', 'budget-signal')
  ];

  return candidates.find((candidate) => existsSync(join(candidate, 'index.html'))) ?? candidates[0];
}

function isApiPath(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/');
}

async function serveStaticRequest(request, response, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  const filePath = await resolveStaticFile(pathname);

  if (!filePath) {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  const fileStats = await stat(filePath);
  response.writeHead(200, {
    'Cache-Control': cacheControlFor(filePath),
    'Content-Length': fileStats.size,
    'Content-Type': contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(filePath)
    .on('error', () => {
      if (!response.headersSent) {
        sendJson(response, 500, { error: 'Could not read static asset' });
      } else {
        response.destroy();
      }
    })
    .pipe(response);
}

async function resolveStaticFile(pathname) {
  const requestedPath = safeStaticPath(pathname);

  if (!requestedPath) {
    return null;
  }

  if (await isFile(requestedPath)) {
    return requestedPath;
  }

  if (extname(requestedPath) !== '') {
    return null;
  }

  const indexPath = join(staticRoot, 'index.html');
  return await isFile(indexPath) ? indexPath : null;
}

function safeStaticPath(pathname) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(pathname || '/');
  } catch {
    return null;
  }

  const assetPath = decodedPath === '/' || decodedPath.endsWith('/') ? 'index.html' : decodedPath.replace(/^\/+/, '');
  const absolutePath = resolve(staticRoot, assetPath);
  const rootPrefix = staticRoot.endsWith(sep) ? staticRoot : `${staticRoot}${sep}`;

  if (absolutePath !== staticRoot && !absolutePath.startsWith(rootPrefix)) {
    return null;
  }

  return absolutePath;
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function cacheControlFor(filePath) {
  return extname(filePath).toLowerCase() === '.html'
    ? 'no-cache'
    : 'public, max-age=31536000, immutable';
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    request.on('data', (chunk) => {
      totalBytes += chunk.length;

      if (totalBytes > maxBodyBytes) {
        const error = new Error('Request body too large');
        error.statusCode = 413;
        reject(error);
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        const error = new Error('Invalid JSON body');
        error.statusCode = 400;
        reject(error);
      }
    });

    request.on('error', reject);
  });
}
