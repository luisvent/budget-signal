import { Injectable, signal } from '@angular/core';

const requiredAccessCode = '0607';
const accessCodeStorageKey = 'budget-signal-access-code';
const accessCodeTtlMs = 24 * 60 * 60 * 1000;

type StoredAccessCode = {
  code: string;
  expiresAt: number;
};

@Injectable({ providedIn: 'root' })
export class AccessCodeService {
  readonly isUnlocked = signal(false);
  private readonly accessCode = signal('');

  constructor() {
    this.restoreSavedAccessCode();
  }

  unlock(code: string): boolean {
    const normalizedCode = normalizeAccessCode(code);

    if (normalizedCode !== requiredAccessCode) {
      return false;
    }

    this.accessCode.set(normalizedCode);
    this.isUnlocked.set(true);
    this.saveAccessCode(normalizedCode);
    return true;
  }

  currentCode(): string {
    return this.isUnlocked() ? this.accessCode() : '';
  }

  private restoreSavedAccessCode(): void {
    const storage = this.storage();

    if (!storage) {
      return;
    }

    try {
      const savedAccessCode = JSON.parse(storage.getItem(accessCodeStorageKey) ?? 'null') as Partial<StoredAccessCode> | null;

      if (savedAccessCode?.code !== requiredAccessCode || typeof savedAccessCode.expiresAt !== 'number' || savedAccessCode.expiresAt <= Date.now()) {
        storage.removeItem(accessCodeStorageKey);
        return;
      }

      this.accessCode.set(savedAccessCode.code);
      this.isUnlocked.set(true);
    } catch {
      storage.removeItem(accessCodeStorageKey);
    }
  }

  private saveAccessCode(code: string): void {
    const storage = this.storage();

    if (!storage) {
      return;
    }

    storage.setItem(accessCodeStorageKey, JSON.stringify({ code, expiresAt: Date.now() + accessCodeTtlMs }));
  }

  private storage(): Storage | null {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }
}

export function normalizeAccessCode(code: string): string {
  return code.replace(/\D/g, '').slice(0, 4);
}