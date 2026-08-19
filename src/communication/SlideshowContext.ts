import { createContext, type Dispatch, type SetStateAction, useContext } from 'react';
import type { SlideShow } from '../model/slides/SlideShow.ts';
import { FALLBACK_APP_ID } from '../model/identifier/AppId.ts';
import type { FullImageSlide } from '../model/slides/Slide.ts';
import { PLACEHOLDER_IMAGE } from '../model/slides/Image.ts';

export const PLACEHOLDER_SLIDE: FullImageSlide = {
    slideId: FALLBACK_APP_ID,
    slideType: 'full-image',
    image: PLACEHOLDER_IMAGE,
};

export const FALLBACK_SLIDESHOW: SlideShow = {
    currentSlideIndex: 0,
    id: FALLBACK_APP_ID,
    slides: [
        PLACEHOLDER_SLIDE,
    ],
};

export type SlideshowState = [SlideShow, Dispatch<SetStateAction<SlideShow>>];

export const AppSlideshowContext = createContext<SlideshowState>([
    FALLBACK_SLIDESHOW, () => {
    },
]);

export const useAppSlideshow = () => useContext(AppSlideshowContext);
