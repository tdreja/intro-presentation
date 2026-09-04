import { createContext, useContext } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import type { SlideShow } from '../../model/slides/SlideShow.ts';
import { FALLBACK_APP_ID } from '../../model/identifier/AppId.ts';
import type { ImageSlideSection, Slide } from '../../model/slides/Slide.ts';
import { PLACEHOLDER_IMAGE } from '../../model/slides/Image.ts';

const PLACEHOLDER_IMAGE_SECTION: ImageSlideSection = { widthPercent: 100, image: PLACEHOLDER_IMAGE };

export const PLACEHOLDER_SLIDE: Slide = {
    slideId: FALLBACK_APP_ID,
    sections: [
        PLACEHOLDER_IMAGE_SECTION,
    ],
};

export const FALLBACK_SLIDESHOW: SlideShow = {
    id: FALLBACK_APP_ID,
    slides: [
        PLACEHOLDER_SLIDE,
    ],
    timePerSlide: Temporal.Duration.from({ seconds: 10 }),
};

export type SlideShowState = [slideshow: SlideShow, setSlideShow: (slideShow: SlideShow) => void];

const noop: SlideShowState = [FALLBACK_SLIDESHOW, () => {}];
export const SlideShowContext = createContext<SlideShowState>(noop);

export const useSlideShow = () => useContext(SlideShowContext);
