import { Temporal } from '@js-temporal/polyfill';
import { createContext, useContext } from 'react';

export type CountdownState = [
    countdown: Temporal.PlainDateTime | null,
    setCountdown: (newCountdown: Temporal.PlainDateTime | null) => void,
];
const noop: CountdownState = [null, () => {}];
export const CountdownContext = createContext<CountdownState>(noop);

export const useCountdown = () => useContext(CountdownContext);
