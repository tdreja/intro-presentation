import { describe, test, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
    type Countdown,
    DEFAULT_SMALL_COUNTDOWN_MINUTES,
    defaultCountdownTime,
    disableCountdown,
    enableCountdown,
    fromDateTimeInputValue,
    largeCountdownFor,
    pickNewestAllowedCountdown,
    SMALL_COUNTDOWN_MINUTES,
    smallCountdownMinutesOf,
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

const minutes = (duration?: Temporal.Duration | null) => duration?.total('minutes');
const seconds = (duration?: Temporal.Duration | null) => duration?.total('seconds');

describe('small / large countdown durations', () => {
    test.each(SMALL_COUNTDOWN_MINUTES)('recognizes the %s minute option', (option) => {
        expect(smallCountdownMinutesOf({ ...OLDER_NO_TIME, showSmallCountdownFor: Temporal.Duration.from({ minutes: option }) }))
            .toBe(option);
    });

    test('falls back to the default for missing or other durations', () => {
        expect(smallCountdownMinutesOf(OLDER_NO_TIME)).toBe(DEFAULT_SMALL_COUNTDOWN_MINUTES);
        expect(smallCountdownMinutesOf({ ...OLDER_NO_TIME, showSmallCountdownFor: Temporal.Duration.from({ hours: 1 }) }))
            .toBe(DEFAULT_SMALL_COUNTDOWN_MINUTES);
    });

    test('large countdown is 10 seconds for a 1 minute small countdown', () => {
        expect(seconds(largeCountdownFor(1))).toBe(10);
    });

    test.each([2, 5, 10, 15] as const)('large countdown is 1 minute for a %s minute small countdown', (option) => {
        expect(seconds(largeCountdownFor(option))).toBe(60);
    });
});

describe('enableCountdown / disableCountdown', () => {
    test('sets the time and the default durations', () => {
        const enabled = enableCountdown(OLDER_NO_TIME, FUTURE_TIME);
        expect(enabled.countdownTime).toBe(FUTURE_TIME);
        expect(minutes(enabled.showSmallCountdownFor)).toBe(DEFAULT_SMALL_COUNTDOWN_MINUTES);
        expect(seconds(enabled.showLargeCountdownFor)).toBe(60);
        expect(enabled.countdownId > OLDER_ID).toBe(true);
    });

    test('keeps the current small countdown option', () => {
        const current = { ...OLDER_NO_TIME, showSmallCountdownFor: Temporal.Duration.from({ minutes: 10 }) };
        expect(minutes(enableCountdown(current, FUTURE_TIME).showSmallCountdownFor)).toBe(10);
    });

    test('sets a given small countdown and derives the large one', () => {
        const enabled = enableCountdown(OLDER_NO_TIME, FUTURE_TIME, 1);
        expect(minutes(enabled.showSmallCountdownFor)).toBe(1);
        expect(seconds(enabled.showLargeCountdownFor)).toBe(10);
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
