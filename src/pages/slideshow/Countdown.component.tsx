import { type ReactElement, useEffect, useState } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import type { Countdown } from '../../model/slides/Countdown.ts';

type CountdownSize = 'large' | 'small' | 'none';

/**
 * Current time of day, e.g. 14:05, shown while no countdown runs.
 */
function formatClock(now: Temporal.PlainDateTime): string {
    return now.toPlainTime().toString({ smallestUnit: 'minute' });
}

type Props = {
    countdown: Countdown
};

function determineSize(countdown: Countdown, now: Temporal.PlainDateTime): CountdownSize {
    if (!countdown.countdownTime) {
        return 'none';
    }
    const remaining = now.until(countdown.countdownTime, { largestUnit: 'hours' });
    if (Temporal.Duration.compare(remaining, Temporal.Duration.from({ seconds: 0 })) <= 0) {
        return 'none';
    }
    if (countdown.showLargeCountdownFor) {
        if (Temporal.Duration.compare(remaining, countdown.showLargeCountdownFor) <= 0) {
            return 'large';
        }
    }
    if (countdown.showSmallCountdownFor) {
        if (Temporal.Duration.compare(remaining, countdown.showSmallCountdownFor) <= 0) {
            return 'small';
        }
    }
    return 'none';
}

function formatCountdown(countdown: Countdown, now: Temporal.PlainDateTime): string {
    if (!countdown.countdownTime) {
        return '';
    }
    const remaining = now.until(countdown.countdownTime, { largestUnit: 'hours' });
    if (Temporal.Duration.compare(remaining, Temporal.Duration.from({ seconds: 0 })) <= 0) {
        return '';
    }

    const hours = remaining.hours;
    const minutes = remaining.minutes;
    const seconds = remaining.seconds;
    const centiseconds = Math.floor(remaining.milliseconds / 10);

    const ss = String(seconds).padStart(2, '0');
    const cs = String(centiseconds).padStart(2, '0');

    if (hours > 0) {
        const hh = String(hours).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        return `${hh}:${mm}:${ss}.${cs}`;
    }
    if (minutes > 0) {
        const mm = String(minutes).padStart(2, '0');
        return `${mm}:${ss}.${cs}`;
    }
    return `${ss}.${cs}`;
}

/**
 * Bottom right of the slideshow: the countdown while it runs (small, or large shortly before the end), the current time otherwise.
 */
export const CountdownComponent = ({ countdown }: Props): ReactElement => {
    const [now, setNow] = useState<Temporal.PlainDateTime>(() => Temporal.Now.plainDateTimeISO());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Temporal.Now.plainDateTimeISO());
        }, 10);
        return () => clearInterval(interval);
    }, []);

    const size = determineSize(countdown, now);
    const text = size === 'none' ? formatClock(now) : formatCountdown(countdown, now);
    const fontClass = size === 'large' ? 'fs-3 fw-bold' : 'fs-6';

    return (
        <span
            className={`position-absolute end-0 bottom-0 pe-3 pb-2 font-monospace ${fontClass}`}
            aria-label={size === 'none' ? 'Current time' : 'Countdown'}
        >
            {text}
        </span>
    );
};
