import { createContext, useContext } from 'react';
import type { AppId } from '../../model/identifier/AppId.ts';
import type { Slide } from '../../model/slides/Slide.ts';

export type CurrentSlideState = [currentSlide: Slide | null, setCurrentSlideId: (newSlideId: AppId | null) => void];

const noop: CurrentSlideState = [null, () => {}];

export const CurrentSlideContext = createContext<CurrentSlideState>(noop);

export const useCurrentSlide = () => useContext(CurrentSlideContext);
