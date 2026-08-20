import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { COUNTDOWN_CONVERTER } from './Countdown';
import type { Countdown } from './Countdown';

const VALID_COUNTDOWN: Countdown = {
    countdownTime: Temporal.PlainDateTime.from('2026-09-01T09:00:00'),
    showSmallCountdownFor: Temporal.Duration.from({ minutes: 30 }),
    showLargeCountdownFor: Temporal.Duration.from({ minutes: 5 }),
};

const VALID_JSON = {
    countdownTime: '2026-09-01T09:00:00',
    showSmallCountdownFor: 'PT30M',
    showLargeCountdownFor: 'PT5M',
};

// ---------------------------------------------------------------------------
// COUNTDOWN_CONVERTER.fromJson
// ---------------------------------------------------------------------------

describe('COUNTDOWN_CONVERTER.fromJson', () => {
    test('returns a valid Countdown from a complete JSON object', () => {
        const result = COUNTDOWN_CONVERTER.fromJson(VALID_JSON);
        expect(result).not.toBeNull();
        expect(result!.countdownTime.year).toBe(2026);
        expect(result!.countdownTime.month).toBe(9);
        expect(result!.countdownTime.day).toBe(1);
        expect(result!.countdownTime.hour).toBe(9);
        expect(result!.showSmallCountdownFor.minutes).toBe(30);
        expect(result!.showLargeCountdownFor.minutes).toBe(5);
    });

    test('returns null for null', () => {
        expect(COUNTDOWN_CONVERTER.fromJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(COUNTDOWN_CONVERTER.fromJson(undefined)).toBeNull();
    });

    test('returns null when countdownTime is missing', () => {
        const json = { ...VALID_JSON, countdownTime: undefined };
        expect(COUNTDOWN_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when countdownTime is invalid', () => {
        const json = { ...VALID_JSON, countdownTime: 'not-a-date' };
        expect(COUNTDOWN_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when showSmallCountdownFor is missing', () => {
        const json = { ...VALID_JSON, showSmallCountdownFor: undefined };
        expect(COUNTDOWN_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when showSmallCountdownFor is invalid', () => {
        const json = { ...VALID_JSON, showSmallCountdownFor: 'not-a-duration' };
        expect(COUNTDOWN_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when showLargeCountdownFor is missing', () => {
        const json = { ...VALID_JSON, showLargeCountdownFor: undefined };
        expect(COUNTDOWN_CONVERTER.fromJson(json)).toBeNull();
    });

    test('returns null when showLargeCountdownFor is invalid', () => {
        const json = { ...VALID_JSON, showLargeCountdownFor: 'not-a-duration' };
        expect(COUNTDOWN_CONVERTER.fromJson(json)).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// COUNTDOWN_CONVERTER.toJson
// ---------------------------------------------------------------------------

describe('COUNTDOWN_CONVERTER.toJson', () => {
    test('serializes all three fields correctly', () => {
        const result = COUNTDOWN_CONVERTER.toJson(VALID_COUNTDOWN);
        expect(result).not.toBeNull();
        expect(result!.countdownTime).toContain('2026-09-01');
        expect(result!.showSmallCountdownFor).toBe('PT30M');
        expect(result!.showLargeCountdownFor).toBe('PT5M');
    });

    test('round-trips through fromJson and toJson', () => {
        const json = COUNTDOWN_CONVERTER.toJson(VALID_COUNTDOWN);
        const restored = COUNTDOWN_CONVERTER.fromJson(json);
        expect(restored).not.toBeNull();
        expect(Temporal.PlainDateTime.compare(restored!.countdownTime, VALID_COUNTDOWN.countdownTime)).toBe(0);
        expect(restored!.showSmallCountdownFor.minutes).toBe(VALID_COUNTDOWN.showSmallCountdownFor.minutes);
        expect(restored!.showLargeCountdownFor.minutes).toBe(VALID_COUNTDOWN.showLargeCountdownFor.minutes);
    });

    test('returns null for null', () => {
        expect(COUNTDOWN_CONVERTER.toJson(null)).toBeNull();
    });

    test('returns null for undefined', () => {
        expect(COUNTDOWN_CONVERTER.toJson(undefined)).toBeNull();
    });
});
