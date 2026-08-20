import { createContext, useContext } from 'react';
import type { AppId } from '../../model/identifier/AppId.ts';

export type CurrentSlideState = [currentSlideId: AppId | null, setCurrentSlideId: (newSlideId: AppId | null) => void];

const noop: CurrentSlideState = [null, () => {}];

export const CurrentSlideContext = createContext<CurrentSlideState>(noop);

export const useCurrentSlide = () => useContext(CurrentSlideContext);
