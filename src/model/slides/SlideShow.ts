import { APP_ID_CONVERTER, type AppId } from '../identifier/AppId.ts';
import { SLIDE_CONVERTER, type Slide } from './Slide.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { ArrayConverter } from '../json/common.ts';

/**
 * Represents a slideshow with multiple slides.
 */
export interface SlideShow {
    /**
     * All slides in the slideshow, in order
     */
    readonly slides: Slide[]
    /**
     * Unique ID of the slideshow, referencing its creation date. This ID is used to identify the slideshow across multiple tabs and devices.
     */
    readonly id: AppId
}

export type RawJsonSlideShow = RawJson<SlideShow>;

const SLIDES_CONVERTER = new ArrayConverter<Slide, unknown>(SLIDE_CONVERTER);

export const SLIDE_SHOW_CONVERTER: JsonConverter<SlideShow, RawJsonSlideShow> = {
    fromJson(json: unknown | null | undefined): SlideShow | null {
        if (!json) {
            return null;
        }
        const parsed = json as RawJsonSlideShow;
        const id = APP_ID_CONVERTER.fromJson(parsed.id);
        if (!id) {
            return null;
        }
        const slides = SLIDES_CONVERTER.fromJson(parsed.slides);
        if (slides === null) {
            return null;
        }
        return { id, slides };
    },
    toJson(data: SlideShow | null | undefined): RawJsonSlideShow | null {
        if (!data) {
            return null;
        }
        return {
            id: APP_ID_CONVERTER.toJson(data.id),
            slides: SLIDES_CONVERTER.toJson(data.slides),
        };
    },
};
