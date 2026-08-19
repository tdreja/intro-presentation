import { createContext, type Dispatch, type SetStateAction, useContext } from 'react';
import type { SlideShow } from '../model/slides/SlideShow.ts';
import { FALLBACK_APP_ID } from '../model/identifier/AppId.ts';

export const FALLBACK_SLIDESHOW: SlideShow = {
    currentSlideIndex: 0,
    id: FALLBACK_APP_ID,
    slides: [],
};

export type SlideshowState = [SlideShow, Dispatch<SetStateAction<SlideShow>>];

export const AppSlideshowContext = createContext<SlideshowState>([
    FALLBACK_SLIDESHOW, () => {
    },
]);

export const useAppSlideshow = () => useContext(AppSlideshowContext);
