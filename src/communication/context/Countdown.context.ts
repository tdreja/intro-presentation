import { createContext, useContext } from 'react';
import type { Countdown } from '../../model/slides/Countdown.ts';

export type CountdownState = [
    countdown: Countdown | null,
    setCountdown: (newCountdown: Countdown | null) => void,
];
const noop: CountdownState = [null, () => {}];
export const CountdownContext = createContext<CountdownState>(noop);

export const useCountdown = () => useContext(CountdownContext);
