import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createStateEnvelope } from './schema.mjs';
import { migrateStateFile } from './migrations.mjs';

export class JsonStoreError extends Error {
  constructor(message, code, cause) {
    super(message);
    this.name = 'JsonStoreError';
    this.code = code;
    this.statusCode = 500;

    if (cause) {
      this.cause = cause;
    }
  }
}

export function createJsonStateStore({ filePath, normalizeState }) {
  if (!filePath) {
    throw new JsonStoreError('Missing JSON data store file path.', 'DATA_STORE_PATH_MISSING');
  }

  let operationQueue = Promise.resolve();

  return {
    filePath,
    read: () => readNow(filePath, normalizeState),
    write: (state) => runExclusive(() => writeNow(filePath, normalizeState, state)),
    update: (mutator) => runExclusive(async () => {
      const state = await readNow(filePath, normalizeState);
      const result = await mutator(state);
      await writeNow(filePath, normalizeState, state);
      return result;
    })
  };

  function runExclusive(operation) {
    const nextOperation = operationQueue.then(operation, operation);
    operationQueue = nextOperation.catch(() => {});
    return nextOperation;
  }
}

async function readNow(filePath, normalizeState) {
  let rawValue;

  try {
    rawValue = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return normalizeState({});
    }

    throw new JsonStoreError(`Could not read data store at ${filePath}.`, 'DATA_STORE_READ_FAILED', error);
  }

  let parsedValue;

  try {
    parsedValue = JSON.parse(rawValue);
  } catch (error) {
    throw new JsonStoreError(
      `Data store at ${filePath} is not valid JSON. Restore a backup or fix the file before starting the app.`,
      'DATA_STORE_INVALID_JSON',
      error
    );
  }

  const { envelope } = migrateStateFile(parsedValue);
  return normalizeState(envelope.data);
}

async function writeNow(filePath, normalizeState, state) {
  const normalizedState = normalizeState(state);
  await mkdir(dirname(filePath), { recursive: true });
  await backupCurrentFile(filePath);

  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
  const envelope = createStateEnvelope(normalizedState);
  await writeFile(temporaryPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, filePath);
  return normalizedState;
}

async function backupCurrentFile(filePath) {
  try {
    await copyFile(filePath, `${filePath}.bak`);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw new JsonStoreError(`Could not create data store backup at ${filePath}.bak.`, 'DATA_STORE_BACKUP_FAILED', error);
    }
  }
}