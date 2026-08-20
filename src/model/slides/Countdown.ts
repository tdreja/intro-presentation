import { Temporal } from '@js-temporal/polyfill';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { DATE_TIME_CONVERTER, DURATION_CONVERTER } from '../json/common.ts';
import { APP_ID_CONVERTER, type AppId } from '../identifier/AppId.ts';

/**
 * Countdown configuration describing when and how long to display countdown views.
 */
export interface Countdown {
    /**
     * Unique identifier for this countdown configuration.
     */
    readonly countdownId: AppId
    /**
     * The target date and time to count down to.
     */
    readonly countdownTime: Temporal.PlainDateTime
    /**
     * How long before countdownTime to show the small countdown view.
     */
    readonly showSmallCountdownFor: Temporal.Duration
    /**
     * How long before countdownTime to show the large countdown view.
     */
    readonly showLargeCountdownFor: Temporal.Duration
}

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
        const countdownTime = DATE_TIME_CONVERTER.fromJson(parsed.countdownTime);
        if (!countdownTime) {
            return null;
        }
        const showSmallCountdownFor = DURATION_CONVERTER.fromJson(parsed.showSmallCountdownFor);
        if (!showSmallCountdownFor) {
            return null;
        }
        const showLargeCountdownFor = DURATION_CONVERTER.fromJson(parsed.showLargeCountdownFor);
        if (!showLargeCountdownFor) {
            return null;
        }
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
