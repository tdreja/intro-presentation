import { type ReactElement, useId, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { Temporal } from '@js-temporal/polyfill';
import { useCountdown } from '../../communication/context/Countdown.context.ts';
import {
    defaultCountdownTime,
    disableCountdown,
    enableCountdown,
    fromDateTimeInputValue,
    toDateTimeInputValue,
} from '../../model/slides/Countdown.ts';

/**
 * Switches the countdown on and off and picks its target time. Changes apply immediately.
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
            <Form.Control
                type="datetime-local"
                size="sm"
                aria-label="Countdown target time"
                value={editValue ?? toDateTimeInputValue(shownTime)}
                disabled={!enabled}
                onChange={event => onTimeChange(event.target.value)}
            />
            {inPast && <div className="small text-warning-emphasis">This time is in the past.</div>}
        </section>
    );
};
