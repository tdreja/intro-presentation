import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
    type Countdown,
    DEFAULT_SHOW_LARGE_COUNTDOWN_FOR,
    DEFAULT_SHOW_SMALL_COUNTDOWN_FOR,
    defaultCountdownTime,
    disableCountdown,
    enableCountdown,
    fromDateTimeInputValue,
    pickNewestAllowedCountdown,
    toDateTimeInputValue,
} from './Countdown';
import type { AppId } from '../identifier/AppId';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OLDER_ID = 'cd-2026-01-01-00-00-00-000' as AppId;
const NEWER_ID = 'cd-2026-06-01-00-00-00-000' as AppId;

const PAST_TIME = Temporal.PlainDateTime.from('2020-01-01T00:00:00');
const FUTURE_TIME = Temporal.PlainDateTime.from('2099-01-01T00:00:00');

const OLDER_FUTURE: Countdown = { countdownId: OLDER_ID, countdownTime: FUTURE_TIME };
const NEWER_FUTURE: Countdown = { countdownId: NEWER_ID, countdownTime: FUTURE_TIME };
const OLDER_PAST: Countdown = { countdownId: OLDER_ID, countdownTime: PAST_TIME };
const NEWER_PAST: Countdown = { countdownId: NEWER_ID, countdownTime: PAST_TIME };
const OLDER_NO_TIME: Countdown = { countdownId: OLDER_ID };
const NEWER_NO_TIME: Countdown = { countdownId: NEWER_ID };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('pickNewestAllowedCountdown', () => {
    test('1. both null: returns null', () => {
        expect(pickNewestAllowedCountdown(null, null)).toBeNull();
    });

    test('2. only A (future time), B null: returns A', () => {
        expect(pickNewestAllowedCountdown(OLDER_FUTURE, null)).toBe(OLDER_FUTURE);
    });

    test('3. A null, only B (future time): returns B', () => {
        expect(pickNewestAllowedCountdown(null, OLDER_FUTURE)).toBe(OLDER_FUTURE);
    });

    test('4. A newer+future, B older+future: returns A', () => {
        expect(pickNewestAllowedCountdown(NEWER_FUTURE, OLDER_FUTURE)).toBe(NEWER_FUTURE);
    });

    test('5. A older+future, B newer+future: returns B', () => {
        expect(pickNewestAllowedCountdown(OLDER_FUTURE, NEWER_FUTURE)).toBe(NEWER_FUTURE);
    });

    test('6. A newer+past (rejected), B older+future: returns B', () => {
        expect(pickNewestAllowedCountdown(NEWER_PAST, OLDER_FUTURE)).toBe(OLDER_FUTURE);
    });

    test('7. A newer+future, B older+past (rejected): returns A', () => {
        expect(pickNewestAllowedCountdown(NEWER_FUTURE, OLDER_PAST)).toBe(NEWER_FUTURE);
    });

    test('8. both past time: returns null', () => {
        expect(pickNewestAllowedCountdown(OLDER_PAST, NEWER_PAST)).toBeNull();
    });

    test('9. A newer+no time (allowed), B older+future: returns A', () => {
        expect(pickNewestAllowedCountdown(NEWER_NO_TIME, OLDER_FUTURE)).toBe(NEWER_NO_TIME);
    });

    test('10. A older+no time (allowed), B newer+future: returns B', () => {
        expect(pickNewestAllowedCountdown(OLDER_NO_TIME, NEWER_FUTURE)).toBe(NEWER_FUTURE);
    });

    test('11. both no time: returns the one with newer ID', () => {
        expect(pickNewestAllowedCountdown(OLDER_NO_TIME, NEWER_NO_TIME)).toBe(NEWER_NO_TIME);
    });

    test('12. A undefined, B future: returns B', () => {
        expect(pickNewestAllowedCountdown(undefined, OLDER_FUTURE)).toBe(OLDER_FUTURE);
    });

    test('13. A future, B undefined: returns A', () => {
        expect(pickNewestAllowedCountdown(OLDER_FUTURE, undefined)).toBe(OLDER_FUTURE);
    });

    test('14. both undefined: returns null', () => {
        expect(pickNewestAllowedCountdown(undefined, undefined)).toBeNull();
    });
});

describe('defaultCountdownTime', () => {
    test('is the next full hour', () => {
        expect(defaultCountdownTime(Temporal.PlainDateTime.from('2026-11-04T18:42:13')).toString())
            .toBe('2026-11-04T19:00:00');
    });

    test('moves a full hour to the next one', () => {
        expect(defaultCountdownTime(Temporal.PlainDateTime.from('2026-11-04T23:00:00')).toString())
            .toBe('2026-11-05T00:00:00');
    });
});

describe('enableCountdown / disableCountdown', () => {
    test('sets the time and default durations', () => {
        const enabled = enableCountdown(OLDER_NO_TIME, FUTURE_TIME);
        expect(enabled.countdownTime).toBe(FUTURE_TIME);
        expect(enabled.showSmallCountdownFor).toBe(DEFAULT_SHOW_SMALL_COUNTDOWN_FOR);
        expect(enabled.showLargeCountdownFor).toBe(DEFAULT_SHOW_LARGE_COUNTDOWN_FOR);
        expect(enabled.countdownId > OLDER_ID).toBe(true);
    });

    test('keeps existing durations', () => {
        const small = Temporal.Duration.from({ minutes: 20 });
        const large = Temporal.Duration.from({ minutes: 2 });
        const enabled = enableCountdown({ ...OLDER_NO_TIME, showSmallCountdownFor: small, showLargeCountdownFor: large }, FUTURE_TIME);
        expect(enabled.showSmallCountdownFor).toBe(small);
        expect(enabled.showLargeCountdownFor).toBe(large);
    });

    test('disabling clears the time, keeps the durations and gets a new ID', () => {
        const enabled = enableCountdown(OLDER_NO_TIME, FUTURE_TIME);
        const disabled = disableCountdown(enabled);
        expect(disabled.countdownTime).toBeNull();
        expect(disabled.showSmallCountdownFor).toBe(enabled.showSmallCountdownFor);
        expect(disabled.countdownId >= enabled.countdownId).toBe(true);
    });
});

describe('datetime-local input values', () => {
    test('formats to minutes', () => {
        expect(toDateTimeInputValue(Temporal.PlainDateTime.from('2026-11-04T18:30:45'))).toBe('2026-11-04T18:30');
    });

    test('parses a complete value', () => {
        expect(fromDateTimeInputValue('2026-11-04T18:30')?.toString()).toBe('2026-11-04T18:30:00');
    });

    test.each(['', '2026-11-04T', 'nonsense'])('returns null for %j', (value) => {
        expect(fromDateTimeInputValue(value)).toBeNull();
    });
});
