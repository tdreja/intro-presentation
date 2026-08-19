import { Temporal } from '@js-temporal/polyfill';

export function asNumber(input?: unknown | null): number | null {
    if (typeof input === 'number' && Number.isFinite(input)) {
        return input;
    }
    return null;
}

export function asNumberOrZero(input?: unknown | null): number {
    const num = asNumber(input);
    return num !== null ? num : 0;
}

export function asBoolean(input?: unknown | null): boolean {
    if (typeof input === 'boolean') {
        return input;
    }
    return false;
}

export function asArray(input?: unknown | null): unknown[] | null {
    if (Array.isArray(input)) {
        return input;
    }
    return null;
}

export function asString(input?: unknown | null): string | undefined {
    if (typeof input === 'string') {
        return input;
    }
    return undefined;
}

export function asDateTime(input?: unknown | null): Temporal.PlainDateTime | undefined {
    if (typeof input !== 'string' || !input) {
        return undefined;
    }
    try {
        return Temporal.PlainDateTime.from(input);
    }
    catch {
        return undefined;
    }
}
