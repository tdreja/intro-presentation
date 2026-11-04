import { Temporal } from '@js-temporal/polyfill';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { DATE_TIME_CONVERTER, DURATION_CONVERTER } from '../json/common.ts';
import { APP_ID_CONVERTER, type AppId, FALLBACK_APP_ID, newAppId } from '../identifier/AppId.ts';

/**
 * Countdown configuration describing when and how long to display countdown views.
 * Only countdownId is required; all other fields are optional and may be absent
 * (e.g. when representing a cleared countdown that has only an identity).
 */
export interface Countdown {
    /**
     * Unique identifier for this countdown configuration.
     */
    readonly countdownId: AppId
    /**
     * The target date and time to count down to.
     */
    readonly countdownTime?: Temporal.PlainDateTime | null
    /**
     * How long before countdownTime to show the small countdown view.
     */
    readonly showSmallCountdownFor?: Temporal.Duration | null
    /**
     * How long before countdownTime to show the large countdown view.
     */
    readonly showLargeCountdownFor?: Temporal.Duration | null
}

/**
 * Fallback countdown used as the default/cleared state when no countdown is configured.
 */
export const FALLBACK_COUNTDOWN: Countdown = { countdownId: FALLBACK_APP_ID };

export type RawJsonCountdown = RawJson<Countdown>;

/**
 * Imports and exports Countdown to JSON.
 */
export const COUNTDOWN_CONVERTER: JsonConverter<Countdown, RawJsonCountdown> = {
    fromJson(json: unknown | null | undefined): Countdown | null {
        if (!json) {
            return null;
        }
        const parsed = json as RawJsonCountdown;
        const countdownId = APP_ID_CONVERTER.fromJson(parsed.countdownId);
        if (!countdownId) {
            return null;
        }
        const countdownTime = DATE_TIME_CONVERTER.fromJson(parsed.countdownTime) ?? null;
        const showSmallCountdownFor = DURATION_CONVERTER.fromJson(parsed.showSmallCountdownFor) ?? null;
        const showLargeCountdownFor = DURATION_CONVERTER.fromJson(parsed.showLargeCountdownFor) ?? null;
        return { countdownId, countdownTime, showSmallCountdownFor, showLargeCountdownFor };
    },
    toJson(data: Countdown | null | undefined): RawJsonCountdown | null {
        if (!data) {
            return null;
        }
        return {
            countdownId: APP_ID_CONVERTER.toJson(data.countdownId),
            countdownTime: DATE_TIME_CONVERTER.toJson(data.countdownTime),
            showSmallCountdownFor: DURATION_CONVERTER.toJson(data.showSmallCountdownFor),
            showLargeCountdownFor: DURATION_CONVERTER.toJson(data.showLargeCountdownFor),
        };
    },
};

function isAllowed(countdown: Countdown): boolean {
    if (!countdown.countdownTime) {
        return true;
    }
    return Temporal.PlainDateTime.compare(countdown.countdownTime, Temporal.Now.plainDateTimeISO()) > 0;
}

export function pickNewestAllowedCountdown(countdownA: Countdown | null | undefined, countdownB: Countdown | null | undefined): Countdown | null {
    const allowedA = countdownA && isAllowed(countdownA) ? countdownA : null;
    const allowedB = countdownB && isAllowed(countdownB) ? countdownB : null;
    if (allowedA && allowedB) {
        return allowedA.countdownId >= allowedB.countdownId ? allowedA : allowedB;
    }
    return allowedA ?? allowedB ?? null;
}

/**
 * Used when a countdown is switched on without durations: small countdown for the last hour.
 */
export const DEFAULT_SHOW_SMALL_COUNTDOWN_FOR = Temporal.Duration.from({ hours: 1 });
/**
 * Used when a countdown is switched on without durations: large countdown for the last 5 minutes.
 */
export const DEFAULT_SHOW_LARGE_COUNTDOWN_FOR = Temporal.Duration.from({ minutes: 5 });

/**
 * Suggested target when a countdown is switched on: the next full hour after now.
 */
export function defaultCountdownTime(now: Temporal.PlainDateTime = Temporal.Now.plainDateTimeISO()): Temporal.PlainDateTime {
    return now.round({ smallestUnit: 'hour', roundingMode: 'floor' }).add({ hours: 1 });
}

/**
 * Switches the countdown on (or moves it) to the given time. Missing durations get the defaults,
 * otherwise nothing would ever be displayed. Gets a new ID, so it wins over older copies.
 */
export function enableCountdown(countdown: Countdown, countdownTime: Temporal.PlainDateTime): Countdown {
    return {
        countdownId: newAppId('countdown'),
        countdownTime,
        showSmallCountdownFor: countdown.showSmallCountdownFor ?? DEFAULT_SHOW_SMALL_COUNTDOWN_FOR,
        showLargeCountdownFor: countdown.showLargeCountdownFor ?? DEFAULT_SHOW_LARGE_COUNTDOWN_FOR,
    };
}

/**
 * Switches the countdown off by clearing its time. Durations are kept for the next time it is switched on.
 */
export function disableCountdown(countdown: Countdown): Countdown {
    return { ...countdown, countdownId: newAppId('countdown'), countdownTime: null };
}

/**
 * Formats a time for an <input type="datetime-local">, e.g. 2026-11-04T18:30
 */
export function toDateTimeInputValue(time: Temporal.PlainDateTime): string {
    return time.toString({ smallestUnit: 'minute' });
}

/**
 * Parses the value of an <input type="datetime-local">; null while it is empty or incomplete.
 */
export function fromDateTimeInputValue(value: string): Temporal.PlainDateTime | null {
    if (!value) {
        return null;
    }
    try {
        return Temporal.PlainDateTime.from(value);
    }
    catch {
        return null;
    }
}
