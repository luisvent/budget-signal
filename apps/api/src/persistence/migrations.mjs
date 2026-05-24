import { CURRENT_SCHEMA_VERSION, createStateEnvelope, isRecord, unwrapStateFile } from './schema.mjs';

export class StateMigrationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'StateMigrationError';
    this.code = code;
    this.statusCode = 500;
  }
}

const migrations = new Map([
  [1, migrateV1ToV2]
]);

export function migrateStateFile(value) {
  const source = unwrapStateFile(value);

  if (source.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new StateMigrationError(
      `Data store schema version ${source.schemaVersion} is newer than this app supports (${CURRENT_SCHEMA_VERSION}).`,
      'DATA_STORE_VERSION_UNSUPPORTED'
    );
  }

  let schemaVersion = source.schemaVersion;
  let data = cloneRecord(source.data);
  let migrated = source.isLegacy;

  while (schemaVersion < CURRENT_SCHEMA_VERSION) {
    const migrate = migrations.get(schemaVersion);

    if (!migrate) {
      throw new StateMigrationError(
        `Missing migration from data store schema version ${schemaVersion}.`,
        'DATA_STORE_MIGRATION_MISSING'
      );
    }

    data = migrate(data);
    schemaVersion += 1;
    migrated = true;
  }

  return {
    envelope: createStateEnvelope(data, source.updatedAt ?? undefined),
    migrated,
    fromVersion: source.schemaVersion,
    toVersion: schemaVersion
  };
}

function migrateV1ToV2(data) {
  const value = isRecord(data) ? data : {};

  return {
    ...value,
    theme: value.theme,
    budgets: value.budgets,
    personalBudget: value.personalBudget,
    conversionBudget: value.conversionBudget,
    statements: value.statements
  };
}

function cloneRecord(value) {
  return JSON.parse(JSON.stringify(isRecord(value) ? value : {}));
}