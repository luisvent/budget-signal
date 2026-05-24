export const CURRENT_SCHEMA_VERSION = 2;

export function createStateEnvelope(data, updatedAt = new Date().toISOString()) {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updatedAt,
    data: isRecord(data) ? data : {}
  };
}

export function unwrapStateFile(value) {
  if (isRecord(value) && Number.isInteger(value.schemaVersion) && isRecord(value.data)) {
    return {
      schemaVersion: Math.max(1, value.schemaVersion),
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
      data: value.data,
      isLegacy: false
    };
  }

  return {
    schemaVersion: 1,
    updatedAt: null,
    data: isRecord(value) ? value : {},
    isLegacy: true
  };
}

export function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}