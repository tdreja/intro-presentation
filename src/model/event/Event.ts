import { APP_ID_CONVERTER, type AppId, newAppId } from '../identifier/AppId.ts';
import { SLIDE_SHOW_CONVERTER, type SlideShow } from '../slides/SlideShow.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { BOOLEAN_CONVERTER, NUMBER_CONVERTER, STRING_CONVERTER } from '../json/common.ts';

export type EventType = 'replace-slideshow' | 'go-to-slide';

/**
 * Actual event sent across all tabs
 */
export interface AppEvent<PAYLOAD> {
    /**
     * Unique identifier of the event
     */
    readonly id: AppId
    /**
     * Type of the event
     */
    readonly type: EventType
    /**
     * Should the event only be transmitted to remote receivers?
     */
    readonly remoteOnly: boolean
    /**
     * Payload of the event, can be any type depending on the event type
     */
    readonly payload: PAYLOAD
}

/**
 * Raw JSON representation of an AppEvent, used for serialization and deserialization
 */
export type RawJsonEvent = RawJson<AppEvent<unknown>>;

/**
 * Event sent, whenever the entire slideshow gets updated
 */
export interface ReplaceSlideshowEvent extends AppEvent<SlideShow> {
    readonly type: 'replace-slideshow'
}

export function replaceSlideshowEvent(slideShow: SlideShow, remoteOnly?: boolean): ReplaceSlideshowEvent {
    return {
        id: newAppId('event'),
        type: 'replace-slideshow',
        remoteOnly: !!remoteOnly,
        payload: slideShow,
    };
}

/**
 * Event sent, whenever the current slide index changes
 */
export interface GoToSlideEvent extends AppEvent<number> {
    readonly type: 'go-to-slide'
}

export function goToSlideEvent(slideIndex: number, remoteOnly?: boolean): GoToSlideEvent {
    return {
        id: newAppId('event'),
        type: 'go-to-slide',
        remoteOnly: !!remoteOnly,
        payload: slideIndex,
    };
}

export const EVENT_CONVERTER: JsonConverter<AppEvent<unknown>, RawJsonEvent> = {
    fromJson(json: unknown | null | undefined): AppEvent<unknown> | null {
        if (!json) {
            return null;
        }
        const parsed = json as RawJsonEvent;
        const id = APP_ID_CONVERTER.fromJson(parsed.id);
        if (!id) {
            return null;
        }
        const type = STRING_CONVERTER.fromJson(parsed.type);
        if (!type) {
            return null;
        }
        const remoteOnly = BOOLEAN_CONVERTER.fromJson(parsed.remoteOnly) ?? false;
        switch (type) {
            case 'replace-slideshow': {
                const slideshow = SLIDE_SHOW_CONVERTER.fromJson(parsed.payload);
                if (slideshow) {
                    return {
                        id,
                        type,
                        remoteOnly,
                        payload: slideshow,
                    } as ReplaceSlideshowEvent;
                }
                return null;
            }
            case 'go-to-slide': {
                const nr = NUMBER_CONVERTER.fromJson(parsed.payload);
                if (nr !== null) {
                    return {
                        id,
                        type,
                        remoteOnly,
                        payload: nr,
                    } as GoToSlideEvent;
                }
                return null;
            }
            default:
                return null;
        }
    },
    toJson(data: AppEvent<unknown> | null | undefined): RawJsonEvent | null {
        if (!data) {
            return null;
        }
        let payload: unknown;
        switch (data.type) {
            case 'replace-slideshow':
                payload = SLIDE_SHOW_CONVERTER.toJson(data.payload as SlideShow);
                break;
            case 'go-to-slide':
                payload = NUMBER_CONVERTER.toJson(data.payload as number);
                break;
            default:
                payload = undefined;
                break;
        }
        return {
            id: APP_ID_CONVERTER.toJson(data.id),
            type: data.type,
            remoteOnly: BOOLEAN_CONVERTER.toJson(data.remoteOnly),
            payload,
        };
    },
};
