import { asAppId, newAppId } from './AppId';

const VALID_ID = 'app-2026-08-17-10-30-00';
const PINNED_DATE = new Date('2026-08-17T10:30:45');

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
        expect(asAppId('app-26-08-17-10-30-00')).toBeNull();
    });

    test('returns null when month is not 2 digits', () => {
        expect(asAppId('app-2026-8-17-10-30-00')).toBeNull();
    });

    test('returns null when day is not 2 digits', () => {
        expect(asAppId('app-2026-08-7-10-30-00')).toBeNull();
    });

    test('returns null when prefix starts with a digit', () => {
        // The regex requires [a-zA-Z]+ so a leading digit fails
        expect(asAppId('1bad-2024-01-01-00-00-00')).toBeNull();
    });

    test('returns null when a segment is missing', () => {
        expect(asAppId('app-2026-08-17-10-30')).toBeNull();
    });

    test('returns null when there are extra segments', () => {
        expect(asAppId('app-2026-08-17-10-30-00-99')).toBeNull();
    });

    test('returns the string typed as AppId for a valid id', () => {
        expect(asAppId(VALID_ID)).toBe(VALID_ID);
    });

    test('accepts a multi-word alpha prefix', () => {
        const id = 'myPrefix-2024-01-01-00-00-00';
        expect(asAppId(id)).toBe(id);
    });

    test('accepts uppercase prefix letters', () => {
        const id = 'APP-2024-12-31-23-59-59';
        expect(asAppId(id)).toBe(id);
    });
});

// ---------------------------------------------------------------------------
// newAppId
// ---------------------------------------------------------------------------

describe('newAppId', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(PINNED_DATE);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('uses "app" as default prefix when called without arguments', () => {
        expect(newAppId()).toBe('app-2026-08-17-10-30-45');
    });

    test('uses "app" as default prefix when called with null', () => {
        expect(newAppId(null)).toBe('app-2026-08-17-10-30-45');
    });

    test('uses a custom prefix', () => {
        expect(newAppId('user')).toBe('user-2026-08-17-10-30-45');
    });

    test('result always matches the AppId pattern', () => {
        const pattern = /^[a-zA-Z]+-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}$/;
        expect(newAppId('myApp')).toMatch(pattern);
    });

    test('pads single-digit month, day, hour, minute, second with leading zero', () => {
        // 2024-01-01 00:00:01 — all fields are single-digit values
        jest.setSystemTime(new Date('2024-01-01T00:00:01'));
        expect(newAppId()).toBe('app-2024-01-01-00-00-01');
    });

    test('uses the provided date instead of system time', () => {
        const fixedDate = new Date('2020-03-15T08:05:02');
        expect(newAppId('app', fixedDate)).toBe('app-2020-03-15-08-05-02');
    });

    test('falls back to system time when date is null', () => {
        expect(newAppId('app', null)).toBe('app-2026-08-17-10-30-45');
    });

    test('falls back to system time when date is undefined', () => {
        expect(newAppId('app', undefined)).toBe('app-2026-08-17-10-30-45');
    });
});
