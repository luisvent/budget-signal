import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * `appMoneyInput` — turns a plain `<input type="text" inputmode="decimal">` into
 * a money field that displays the value with thousand separators while still
 * exchanging numeric values with Angular forms (e.g. `[ngModel]` / `formControl`).
 *
 * Behaviour:
 *  - Display: `12345.6` → `"12,345.6"`.
 *  - On input: strips non-digit characters (allows a single `.` or `,` decimal),
 *    re-formats, and emits the numeric value.
 *  - On blur: re-formats the canonical numeric value (drops trailing dots, etc.).
 *  - Empty input emits `null`.
 */
@Directive({
  selector: 'input[appMoneyInput]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MoneyInputDirective),
      multi: true,
    },
  ],
})
export class MoneyInputDirective implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private currentValue: number | null = null;

  writeValue(value: number | string | null | undefined): void {
    this.currentValue = this.coerce(value);
    this.elementRef.nativeElement.value = this.format(this.currentValue);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  @HostListener('input', ['$event'])
  handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = (input.value.slice(0, caret).match(/[0-9]/g) ?? []).length;

    const { numeric, formatted } = this.parse(input.value);
    input.value = formatted;
    this.currentValue = numeric;
    this.onChange(numeric);

    // Restore caret position based on digit count so editing feels natural.
    let target = formatted.length;
    if (digitsBeforeCaret > 0) {
      let seen = 0;
      for (let i = 0; i < formatted.length; i += 1) {
        if (/[0-9]/.test(formatted[i])) {
          seen += 1;
          if (seen === digitsBeforeCaret) {
            target = i + 1;
            break;
          }
        }
      }
    } else {
      target = 0;
    }
    input.setSelectionRange(target, target);
  }

  @HostListener('blur')
  handleBlur(): void {
    this.elementRef.nativeElement.value = this.format(this.currentValue);
    this.onTouched();
  }

  private coerce(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private parse(raw: string): { numeric: number | null; formatted: string } {
    // Commas are always thousand separators in our en-US formatting — drop them
    // so re-typing into an already-formatted value like "10,000" doesn't get
    // re-interpreted as a decimal. Only '.' is treated as the decimal mark.
    let cleaned = raw.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot !== -1) {
      const before = cleaned.slice(0, firstDot);
      const after = cleaned.slice(firstDot + 1).replace(/\./g, '');
      cleaned = `${before}.${after}`;
    }
    if (cleaned === '' || cleaned === '.') {
      return { numeric: null, formatted: '' };
    }
    const num = Number(cleaned);
    if (!Number.isFinite(num)) {
      return { numeric: null, formatted: '' };
    }
    const [intPart, decPart] = cleaned.split('.');
    const intFormatted = Number(intPart || '0').toLocaleString('en-US');
    const formatted = decPart !== undefined ? `${intFormatted}.${decPart}` : intFormatted;
    return { numeric: num, formatted };
  }

  private format(value: number | null): string {
    if (value === null || !Number.isFinite(value)) {
      return '';
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
}
