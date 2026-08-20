import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { COUNTDOWN_CONVERTER, FALLBACK_COUNTDOWN } from './Countdown';
import type { Countdown } from './Countdown';

const FULL_COUNTDOWN: Countdown = {
    countdownId: 'countdown-2026-09-01-09-00-00-000',
    countdownTime: Temporal.PlainDateTime.from('2026-09-01T09:00:00'),
    showSmallCountdownFor: Temporal.Duration.from({ minutes: 30 }),
    showLargeCountdownFor: Temporal.Duration.from({ minutes: 5 }),
};

const FULL_JSON = {
    countdownId: 'countdown-2026-09-01-09-00-00-000',
    countdownTime: '2026-09-01T09:00:00',
    showSmallCountdownFor: 'PT30M',
    showLargeCountdownFor: 'PT5M',
};

const MINIMAL_JSON = {
    countdownId: 'countdown-2026-09-01-09-00-00-000',
};

// ---------------------------------------------------------------------------
// FALLBACK_COUNTDOWN
// ---------------------------------------------------------------------------

describe('FALLBACK_COUNTDOWN', () => {
    test('has a countdownId', () => {
        expect(FALLBACK_COUNTDOWN.countdownId).toBeTruthy();
    });

    test('has no countdownTime', () => {
        expect(FALLBACK_COUNTDOWN.countdownTime).toBeUndefined();
    });

    test('has no showSmallCountdownFor', () => {
        expect(FALLBACK_COUNTDOWN.showSmallCountdownFor).toBeUndefined();
    });

    test('has no showLargeCountdownFor', () => {
        expect(FALLBACK_COUNTDOWN.showLargeCountdownFor).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// COUNTDOWN_CONVERTER.fromJson
// ---------------------------------------------------------------------------

describe('COUNTDOWN_CONVERTER.fromJson', () => {
    test('returns a valid Countdown from a complete JSON object', () => {
        const result = COUNTDOWN_CONVERTER.fromJson(FULL_JSON);
        expect(result).not.toBeNull();
        expect(result!.countdownId).toBe('countdown-2026-09-01-09-00-00-000');
        expect(result!.countdownTime?.year).toBe(2026);
        expect(result!.countdownTime?.month).toBe(9);
        expect(result!.countdownTime?.day).toBe(1);
        expect(result!.countdownTime?.hour).toBe(9);
        expect(result!.showSmallCountdownFor?.minutes).toBe(30);
        expect(result!.showLargeCountdownFor?.minutes).toBe(5);
    });

    test('returns a valid Countdown from a minimal JSON object with only countdownId', () => {
        const result = COUNTDOWN_CONVERTER.fromJson(MINIMAL_JSON);
        expect(result).not.toBeNull();
        expect(result!.countdownId).toBe('countdown-2026-09-01-09-00-00-000');
        expect(result!.countdownTime).toBeNull();
        expect(result!.showSmallCountdownFor).toBeNull();
        expect(result!.showLargeCountdownFor).toBeNull();
    });

    test('countdownTime is null when missing from JSON', () => {
        const result = COUNTDOWN_CONVERTER.fromJson({ ...FULL_JSON, countdownTime: undefined });
        expect(result).not.toBeNull();
        expect(result!.countdownTime).toBeNull();
    });

    test('countdownTime is null when invalid in JSON', () => {
        const result = COUNTDOWN_CONVERTER.fromJson({ ...FULL_JSON, countdownTime: 'not-a-date' });
        expect(result).not.toBeNull();
        expect(result!.countdownTime).toBeNull();
    });

    test('showSmallCountdownFor is null when missing from JSON', () => {
        const result = COUNTDOWN_CONVERTER.fromJson({ ...FULL_JSON, showSmallCountdownFor: undefined });
        expect(result).not.toBeNull();
        expect(result!.showSmallCountdownFor).toBeNull();
    });

    test('showSmallCountdownFor is null when invalid in JSON', () => {
        const result = COUNTDOWN_CONVERTER.fromJson({ ...FULL_JSON, showSmallCountdownFor: 'not-a-duration' });
        expect(result).not.toBeNull();
        expect(result!.showSmallCountdownFor).toBeNull();
    });

    test('showLargeCountdownFor is null when missing from JSON', () => {
        const result = COUNTDOWN_CONVERTER.fromJson({ ...FULL_JSON, showLargeCountdownFor: undefined });
        expect(result).not.toBeNull();
        expect(result!.showLargeCountdownFor).toBeNull();
    });

    test('showLargeCountdownFor is null when invalid in JSON', () => {
        const result = COUNTDOWN_CONVERTER.fromJson({ ...FULL_JSON, showLargeCountdownFor: 'not-a-duration' });
        expect(result).not.toBeNull();
        expect(result!.showLargeCountdownFor).toBeNull();
    });

    test('returns null for null', () => {
        expect(COUNTDOWN_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(COUNTDOWN_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null when countdownId is missing', () => {
        const json = { ...FULL_JSON, countdownId: undefined };
        expect(COUNTDOWN_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when countdownId is invalid', () => {
        const json = { ...FULL_JSON, countdownId: 'not-an-id' };
        expect(COUNTDOWN_CONVERTER.fromJson(json)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// COUNTDOWN_CONVERTER.toJson
// ---------------------------------------------------------------------------

describe('COUNTDOWN_CONVERTER.toJson', () => {
    test('serializes all fields correctly', () => {
        const result = COUNTDOWN_CONVERTER.toJson(FULL_COUNTDOWN);
        expect(result).not.toBeNull();
        expect(result!.countdownId).toBe('countdown-2026-09-01-09-00-00-000');
        expect(result!.countdownTime).toContain('2026-09-01');
        expect(result!.showSmallCountdownFor).toBe('PT30M');
        expect(result!.showLargeCountdownFor).toBe('PT5M');
    });

    test('serializes a minimal (ID-only) countdown correctly', () => {
        const minimal: Countdown = { countdownId: 'countdown-2026-09-01-09-00-00-000' };
        const result = COUNTDOWN_CONVERTER.toJson(minimal);
        expect(result).not.toBeNull();
        expect(result!.countdownId).toBe('countdown-2026-09-01-09-00-00-000');
        expect(result!.countdownTime).toBeNull();
        expect(result!.showSmallCountdownFor).toBeNull();
        expect(result!.showLargeCountdownFor).toBeNull();
    });

    test('round-trips a full countdown through toJson and fromJson', () => {
        const json = COUNTDOWN_CONVERTER.toJson(FULL_COUNTDOWN);
        const restored = COUNTDOWN_CONVERTER.fromJson(json);
        expect(restored).not.toBeNull();
        expect(restored!.countdownId).toBe(FULL_COUNTDOWN.countdownId);
        expect(Temporal.PlainDateTime.compare(restored!.countdownTime!, FULL_COUNTDOWN.countdownTime!)).toBe(0);
        expect(restored!.showSmallCountdownFor?.minutes).toBe(FULL_COUNTDOWN.showSmallCountdownFor?.minutes);
        expect(restored!.showLargeCountdownFor?.minutes).toBe(FULL_COUNTDOWN.showLargeCountdownFor?.minutes);
    });

    test('round-trips a minimal (ID-only) countdown through toJson and fromJson', () => {
        const minimal: Countdown = { countdownId: 'countdown-2026-09-01-09-00-00-000' };
        const json = COUNTDOWN_CONVERTER.toJson(minimal);
        const restored = COUNTDOWN_CONVERTER.fromJson(json);
        expect(restored).not.toBeNull();
        expect(restored!.countdownId).toBe(minimal.countdownId);
        expect(restored!.countdownTime).toBeNull();
        expect(restored!.showSmallCountdownFor).toBeNull();
        expect(restored!.showLargeCountdownFor).toBeNull();
    });

    test('returns null for null', () => {
        expect(COUNTDOWN_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(COUNTDOWN_CONVERTER.toJson(undefined)).toBeNull();
    });
});
