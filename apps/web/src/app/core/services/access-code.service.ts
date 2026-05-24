import { Injectable, signal } from '@angular/core';

const requiredAccessCode = '0607';

@Injectable({ providedIn: 'root' })
export class AccessCodeService {
  readonly isUnlocked = signal(false);
  private readonly accessCode = signal('');

  unlock(code: string): boolean {
    const normalizedCode = normalizeAccessCode(code);

    if (normalizedCode !== requiredAccessCode) {
      return false;
    }

    this.accessCode.set(normalizedCode);
    this.isUnlocked.set(true);
    return true;
  }

  currentCode(): string {
    return this.isUnlocked() ? this.accessCode() : '';
  }
}

export function normalizeAccessCode(code: string): string {
  return code.replace(/\D/g, '').slice(0, 4);
}