import { APP_ID_CONVERTER, type AppId, newAppId } from '../identifier/AppId.ts';
import { SLIDE_SHOW_CONVERTER, type SlideShow } from '../slides/SlideShow.ts';
import type { JsonConverter, RawJson } from '../json/json.ts';
import { STRING_CONVERTER } from '../json/common.ts';
import { type Countdown, COUNTDOWN_CONVERTER } from '../slides/Countdown.ts';

export type EventType = 'replace-slideshow' | 'go-to-slide' | 'update-countdown';

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
     * Payload of the event, can be any type depending on the event type
     */
    readonly payload: PAYLOAD
    /**
     * Identifier of the source that sent the event!
     */
    readonly source: AppId
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

export function replaceSlideshowEvent(source: AppId, slideShow: SlideShow): ReplaceSlideshowEvent {
    return {
        id: newAppId('event'),
        type: 'replace-slideshow',
        payload: slideShow,
        source,
    };
}

export function asReplaceSlideshowEvent(event: AppEvent<unknown>): ReplaceSlideshowEvent | null {
    if (event.type === 'replace-slideshow') {
        return event as ReplaceSlideshowEvent;
    }
    return null;
}

/**
 * Event sent, whenever the current slide index changes
 */
export interface GoToSlideEvent extends AppEvent<AppId | null> {
    readonly type: 'go-to-slide'
}

export function goToSlideEvent(source: AppId, slideId: AppId | null): GoToSlideEvent {
    return {
        id: newAppId('event'),
        type: 'go-to-slide',
        payload: slideId,
        source,
    };
}

export function asGoToSlideEvent(event: AppEvent<unknown>): GoToSlideEvent | null {
    if (event.type === 'go-to-slide') {
        return event as GoToSlideEvent;
    }
    return null;
}

export interface UpdateCountdownEvent extends AppEvent<Countdown> {
    readonly type: 'update-countdown'
}

export function updateCountdownEvent(source: AppId, countdown: Countdown): UpdateCountdownEvent {
    return {
        id: newAppId('event'),
        type: 'update-countdown',
        payload: countdown,
        source,
    };
}

export function asUpdateCountdownEvent(event: AppEvent<unknown>): UpdateCountdownEvent | null {
    if (event.type === 'update-countdown') {
        return event as UpdateCountdownEvent;
    }
    return null;
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
        const source = APP_ID_CONVERTER.fromJson(parsed.source);
        if (!source) {
            return null;
        }
        const type = STRING_CONVERTER.fromJson(parsed.type);
        if (!type) {
            return null;
        }
        switch (type) {
            case 'replace-slideshow': {
                const slideshow = SLIDE_SHOW_CONVERTER.fromJson(parsed.payload);
                if (slideshow) {
                    return {
                        id,
                        type,
                        payload: slideshow,
                        source,
                    } as ReplaceSlideshowEvent;
                }
                return null;
            }
            case 'go-to-slide': {
                return {
                    id,
                    type,
                    payload: APP_ID_CONVERTER.fromJson(parsed.payload),
                    source,
                } as GoToSlideEvent;
            }
            case 'update-countdown': {
                return {
                    id,
                    type,
                    payload: COUNTDOWN_CONVERTER.fromJson(parsed.payload),
                    source,
                } as UpdateCountdownEvent;
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
                payload = APP_ID_CONVERTER.toJson(data.payload as AppId | null);
                break;
            case 'update-countdown':
                payload = COUNTDOWN_CONVERTER.toJson(data.payload as Countdown);
                break;
            default:
                payload = undefined;
                break;
        }
        return {
            id: APP_ID_CONVERTER.toJson(data.id),
            type: data.type,
            payload,
            source: APP_ID_CONVERTER.toJson(data.source),
        };
    },
};
