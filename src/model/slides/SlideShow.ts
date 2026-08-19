import { asAppId, type AppId } from '../identifier/AppId.ts';
import { importSlide, importSlideJSON, type Slide } from './Slide.ts';
import { asArray, asBoolean, asNumberOrZero } from '../JsonUtils.ts';

export interface SlideShow {
    readonly slides: Slide[]
    readonly currentSlideIndex: number
    readonly isCountdownActive: boolean
    readonly id: AppId
}

type JsonSlideShow = Partial<Omit<SlideShow, 'slides' | 'id'>> & {
    id?: unknown
    slides?: unknown[]
};

export function exportSlideShow(show: SlideShow): string {
    return JSON.stringify(show);
}

export function importSlideShow(json?: string | null): SlideShow | null {
    if (!json) {
        return null;
    }
    const raw: JsonSlideShow = JSON.parse(json);
    if (!raw) {
        return null;
    }
    const id = asAppId(raw.id as string);
    if (!id) {
        return null;
    }
    const rawArray = asArray(raw.slides);
    if (!rawArray) {
        return null;
    }
    const currentSlideIndex = asNumberOrZero(raw.currentSlideIndex);
    const isCountdownActive = asBoolean(raw.isCountdownActive);
    const slides: Slide[] = [];
    for (const raw of rawArray) {
        const slide = typeof raw === 'string' ? importSlideJSON(raw) : importSlide(raw);
        if (slide) {
            slides.push(slide);
        }
    }
    return { id, slides, currentSlideIndex, isCountdownActive };
}
