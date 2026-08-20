import { createContext, useContext } from 'react';
import { type Countdown, FALLBACK_COUNTDOWN } from '../../model/slides/Countdown.ts';

export type CountdownState = [
    countdown: Countdown,
    setCountdown: (newCountdown: Countdown) => void,
];
const noop: CountdownState = [FALLBACK_COUNTDOWN, () => {}];
export const CountdownContext = createContext<CountdownState>(noop);

export const useCountdown = () => useContext(CountdownContext);
