import { createContext, useContext } from 'react';
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
    id: FALLBACK_APP_ID,
    slides: [
        PLACEHOLDER_SLIDE,
    ],
};

export type SlideshowSetter = (newSlideshow: SlideShow) => void;
export type SlideshowState = [SlideShow, SlideshowSetter];

export const AppSlideshowContext = createContext<SlideshowState>([
    FALLBACK_SLIDESHOW, () => {
    },
]);

export const useAppSlideshow = () => useContext(AppSlideshowContext);
