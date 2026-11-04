import { type ReactElement, useId, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { Temporal } from '@js-temporal/polyfill';
import { useCountdown } from '../../communication/context/Countdown.context.ts';
import {
    defaultCountdownTime,
    disableCountdown,
    enableCountdown,
    fromDateTimeInputValue,
    SMALL_COUNTDOWN_MINUTES,
    smallCountdownMinutesOf,
    toDateTimeInputValue,
} from '../../model/slides/Countdown.ts';

const minutesLabel = (minutes: number) => `${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`;

/**
 * Switches the countdown on and off, picks its target time and how long before it the small countdown shows.
 * Changes apply immediately.
 */
export const CountdownSettings = (): ReactElement => {
    const id = useId();
    const [countdown, setCountdown] = useCountdown();
    const enabled = !!countdown.countdownTime;
    // Remembered while the countdown is off, so switching it back on restores the last pick
    const [pickedTime, setPickedTime] = useState<Temporal.PlainDateTime>(
        () => countdown.countdownTime ?? defaultCountdownTime(),
    );
    // Raw input while it is incomplete (the browser reports an empty value until all fields are filled)
    const [editValue, setEditValue] = useState<string | null>(null);
    const shownTime = countdown.countdownTime ?? pickedTime;
    const inPast = enabled && Temporal.PlainDateTime.compare(shownTime, Temporal.Now.plainDateTimeISO()) <= 0;

    const onToggle = (checked: boolean) => {
        setCountdown(checked ? enableCountdown(countdown, shownTime) : disableCountdown(countdown));
    };

    const onSmallChange = (value: string) => {
        const minutes = SMALL_COUNTDOWN_MINUTES.find(option => String(option) === value);
        if (minutes) {
            setCountdown(enableCountdown(countdown, shownTime, minutes));
        }
    };

    const onTimeChange = (value: string) => {
        const parsed = fromDateTimeInputValue(value);
        if (!parsed) {
            setEditValue(value);
            return;
        }
        setEditValue(null);
        setPickedTime(parsed);
        if (enabled) {
            setCountdown(enableCountdown(countdown, parsed));
        }
    };

    return (
        <section className="d-flex flex-column gap-2 p-3 border-bottom">
            <Form.Check
                type="checkbox"
                id={`${id}-enabled`}
                label="Countdown"
                className="fw-semibold mb-0"
                checked={enabled}
                onChange={event => onToggle(event.target.checked)}
            />
            {enabled && (
                <>
                    <Form.Control
                        type="datetime-local"
                        size="sm"
                        aria-label="Countdown target time"
                        value={editValue ?? toDateTimeInputValue(shownTime)}
                        onChange={event => onTimeChange(event.target.value)}
                    />
                    {inPast && <div className="small text-warning-emphasis">This time is in the past.</div>}
                    <Form.Group controlId={`${id}-small`} className="d-flex align-items-center gap-2">
                        <Form.Label className="small mb-0 text-nowrap">Show for</Form.Label>
                        <Form.Select
                            size="sm"
                            value={smallCountdownMinutesOf(countdown)}
                            onChange={event => onSmallChange(event.target.value)}
                        >
                            {SMALL_COUNTDOWN_MINUTES.map(minutes => (
                                <option key={minutes} value={minutes}>{minutesLabel(minutes)}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </>
            )}
        </section>
    );
};
