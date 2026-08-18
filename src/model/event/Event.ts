import { type AppId, asAppId } from '../identifier/AppId.ts';

/**
 * What type of event can be sent to all tabs?
 */
export const EventType = {
    /**
     * Requires all tabs to move to the given slide
     */
    GO_TO_SLIDE: 'GO_TO_SLIDE',
    /**
     * Requires all tabs to replace the given slide
     */
    REPLACE_SLIDE: 'REPLACE_SLIDE',
    /**
     * Requires all tabs to replace the entire presentation
     */
    REPLACE_PRESENTATION: 'REPLACE_PRESENTATION',
    /**
     * Requires all tabs to toggle the countdown timer on or off
     */
    TOGGLE_COUNTDOWN: 'TOGGLE_COUNTDOWN',
} as const;

export type EventType = typeof EventType[keyof typeof EventType];

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
    payload: PAYLOAD
}

/**
 * JSON representation of an AppEvent, used to restore the original
 */
type JsonAppEvent = Partial<AppEvent<unknown>>;

/**
 * Restores an AppEvent from its JSON representation
 * @param json JSON input
 */
export function importAppEvent<PAYLOAD>(json?: string | null): AppEvent<PAYLOAD> | null {
    if (!json) {
        return null;
    }
    const raw: JsonAppEvent = JSON.parse(json);
    if (!raw || !raw.id || !raw.type) {
        return null;
    }
    const validId = asAppId(raw.id);
    if (!validId) {
        return null;
    }
    return {
        id: validId,
        type: raw.type,
        payload: raw.payload as PAYLOAD,
    };
}

/**
 * Stores an AppEvent as JSON representation, used to send it across tabs
 * @param event Event to store
 */
export function exportAppEvent<PAYLOAD>(event: AppEvent<PAYLOAD>): string {
    return JSON.stringify(event);
}
