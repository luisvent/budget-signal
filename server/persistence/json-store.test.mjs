import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createJsonStateStore } from './json-store.mjs';
import { CURRENT_SCHEMA_VERSION } from './schema.mjs';

test('writes a versioned envelope and keeps a previous-file backup', async (t) => {
  const filePath = await createTempFilePath(t);
  const store = createJsonStateStore({ filePath, normalizeState: normalizeCounterState });

  await store.write({ count: 1 });
  await store.write({ count: 2 });

  const current = await readJson(filePath);
  const backup = await readJson(`${filePath}.bak`);

  assert.equal(current.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(current.data.count, 2);
  assert.match(current.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(backup.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(backup.data.count, 1);
});

test('migrates legacy raw JSON and serializes concurrent updates', async (t) => {
  const filePath = await createTempFilePath(t);
  await writeFile(filePath, JSON.stringify({ count: 0 }), 'utf8');

  const store = createJsonStateStore({ filePath, normalizeState: normalizeCounterState });
  const results = await Promise.all(Array.from({ length: 5 }, () => store.update(async (state) => {
    const current = state.count;
    await new Promise((resolve) => setImmediate(resolve));
    state.count = current + 1;
    return state.count;
  })));
  const current = await readJson(filePath);

  assert.deepEqual([...results].sort((first, second) => first - second), [1, 2, 3, 4, 5]);
  assert.equal(current.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(current.data.count, 5);
});

test('invalid JSON fails loudly without replacing stored data', async (t) => {
  const filePath = await createTempFilePath(t);
  await writeFile(filePath, '{not-json', 'utf8');
  const store = createJsonStateStore({ filePath, normalizeState: normalizeCounterState });

  await assert.rejects(() => store.read(), { code: 'DATA_STORE_INVALID_JSON' });
  assert.equal(await readFile(filePath, 'utf8'), '{not-json');
});

function normalizeCounterState(value = {}) {
  return { count: Number.isFinite(Number(value.count)) ? Number(value.count) : 0 };
}

async function createTempFilePath(t) {
  const directory = await mkdtemp(join(tmpdir(), 'budget-json-store-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return join(directory, 'state.json');
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}