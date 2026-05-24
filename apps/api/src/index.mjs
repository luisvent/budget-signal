import { createServer } from 'node:http';
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

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';
const allowedOrigin = process.env.CORS_ORIGIN ?? '*';
const requiredAccessCode = process.env.BUDGET_SIGNAL_ACCESS_CODE ?? '0607';
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES ?? 15 * 1024 * 1024);

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

    if (isProtectedApiPath(url.pathname) && !isAccessAuthorized(request)) {
      sendJson(response, 401, { error: 'Access code required' });
      return;
    }

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
        sendJson(response, 404, { error: 'Not found' });
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

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Budget-Signal-Code');
}

function isProtectedApiPath(pathname) {
  return pathname.startsWith('/api/') && pathname !== '/api/health';
}

function isAccessAuthorized(request) {
  return request.headers['x-budget-signal-code'] === requiredAccessCode;
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
