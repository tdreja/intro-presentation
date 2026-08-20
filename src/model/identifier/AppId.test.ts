import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { APP_ID_CONVERTER, asAppId, newAppId } from './AppId';

const VALID_ID = 'app-2026-08-17-10-30-00-000';
const PINNED_DATE = Temporal.PlainDateTime.from('2026-08-17T10:30:45');

// ---------------------------------------------------------------------------
// asAppId
// ---------------------------------------------------------------------------

describe('asAppId', () => {
    test('returns null for undefined', () => {
        expect(asAppId(undefined)).toBeNull();
    });

    test('returns null for null', () => {
        expect(asAppId(null)).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(asAppId('')).toBeNull();
    });

    test('returns null for plain string without segments', () => {
        expect(asAppId('not-an-id')).toBeNull();
    });

    test('returns null when year is not 4 digits', () => {
        expect(asAppId('app-26-08-17-10-30-00-000')).toBeNull();
    });

    test('returns null when month is not 2 digits', () => {
        expect(asAppId('app-2026-8-17-10-30-00-000')).toBeNull();
    });

    test('returns null when day is not 2 digits', () => {
        expect(asAppId('app-2026-08-7-10-30-00-000')).toBeNull();
    });

    test('returns null when prefix starts with a digit', () => {
        // The regex requires [a-zA-Z]+ so a leading digit fails
        expect(asAppId('1bad-2024-01-01-00-00-00-000')).toBeNull();
    });

    test('returns null when a segment is missing', () => {
        expect(asAppId('app-2026-08-17-10-30')).toBeNull();
    });

    test('returns null when there are extra segments', () => {
        expect(asAppId('app-2026-08-17-10-30-00-000-99')).toBeNull();
    });

    test('returns null when millisecond segment is missing', () => {
        expect(asAppId('app-2026-08-17-10-30-00')).toBeNull();
    });

    test('returns the string typed as AppId for a valid id', () => {
        expect(asAppId(VALID_ID)).toBe(VALID_ID);
    });

    test('accepts a multi-word alpha prefix', () => {
        const id = 'myPrefix-2024-01-01-00-00-00-000';
        expect(asAppId(id)).toBe(id);
    });

    test('accepts uppercase prefix letters', () => {
        const id = 'APP-2024-12-31-23-59-59-999';
        expect(asAppId(id)).toBe(id);
    });
});

// ---------------------------------------------------------------------------
// newAppId
// ---------------------------------------------------------------------------

describe('newAppId', () => {
    test('uses "app" as default prefix when called with a date', () => {
        expect(newAppId(undefined, PINNED_DATE)).toBe('app-2026-08-17-10-30-45-000');
    });

    test('uses "app" as default prefix when prefix is null', () => {
        expect(newAppId(null, PINNED_DATE)).toBe('app-2026-08-17-10-30-45-000');
    });

    test('uses a custom prefix', () => {
        expect(newAppId('user', PINNED_DATE)).toBe('user-2026-08-17-10-30-45-000');
    });

    test('result always matches the AppId pattern', () => {
        const pattern = /^[a-zA-Z]+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/;
        expect(newAppId('myApp', PINNED_DATE)).toMatch(pattern);
    });

    test('pads single-digit month, day, hour, minute, second with leading zero', () => {
        // 2024-01-01 00:00:01 — all fields are single-digit values
        const singleDigitDate = Temporal.PlainDateTime.from('2024-01-01T00:00:01');
        expect(newAppId(undefined, singleDigitDate)).toBe('app-2024-01-01-00-00-01-000');
    });

    test('uses the provided date instead of system time', () => {
        const fixedDate = Temporal.PlainDateTime.from('2020-03-15T08:05:02');
        expect(newAppId('app', fixedDate)).toBe('app-2020-03-15-08-05-02-000');
    });

    test('falls back to system time when date is null', () => {
        const pattern = /^app-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/;
        expect(newAppId('app', null)).toMatch(pattern);
    });

    test('falls back to system time when date is undefined', () => {
        const pattern = /^app-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{3}$/;
        expect(newAppId('app', undefined)).toMatch(pattern);
    });
});

// ---------------------------------------------------------------------------
// APP_ID_CONVERTER
// ---------------------------------------------------------------------------

describe('APP_ID_CONVERTER.fromJson', () => {
    test('returns the string typed as AppId for a valid id', () => {
        expect(APP_ID_CONVERTER.fromJson(VALID_ID)).toBe(VALID_ID);
    });

    test('accepts uppercase prefix letters', () => {
        const id = 'APP-2024-12-31-23-59-59-999';
        expect(APP_ID_CONVERTER.fromJson(id)).toBe(id);
    });

    test('returns null for null', () => {
        expect(APP_ID_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(APP_ID_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null for a number', () => {
        expect(APP_ID_CONVERTER.fromJson(42)).toBeNull();
    });

    test('returns null for an object', () => {
        expect(APP_ID_CONVERTER.fromJson({})).toBeNull();
    });

    test('returns null for an array', () => {
        expect(APP_ID_CONVERTER.fromJson([])).toBeNull();
    });

    test('returns null when a segment is missing', () => {
        expect(APP_ID_CONVERTER.fromJson('app-2026-08-17-10-30')).toBeNull();
    });

    test('returns null when year is not 4 digits', () => {
        expect(APP_ID_CONVERTER.fromJson('app-26-08-17-10-30-00-000')).toBeNull();
    });

    test('returns null when prefix starts with a digit', () => {
        expect(APP_ID_CONVERTER.fromJson('1bad-2024-01-01-00-00-00-000')).toBeNull();
    });

    test('returns null when there are extra segments', () => {
        expect(APP_ID_CONVERTER.fromJson('app-2026-08-17-10-30-00-000-99')).toBeNull();
    });
});

describe('APP_ID_CONVERTER.toJson', () => {
    test('returns the id unchanged', () => {
        const id = asAppId(VALID_ID)!;
        expect(APP_ID_CONVERTER.toJson(id)).toBe(VALID_ID);
    });

    test('round-trips through fromJson and toJson', () => {
        const id = asAppId(VALID_ID)!;
        expect(APP_ID_CONVERTER.toJson(APP_ID_CONVERTER.fromJson(VALID_ID)!)).toBe(id);
    });

    test('returns null for null', () => {
        expect(APP_ID_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(APP_ID_CONVERTER.toJson(undefined)).toBeNull();
    });
});
