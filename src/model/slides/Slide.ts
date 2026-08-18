import { Temporal } from '@js-temporal/polyfill';
import { newAppId } from '../identifier/AppId.ts';
import type { AppId } from '../identifier/AppId.ts';

export function createSlideId(date?: Temporal.PlainDateTime | null): AppId {
    return newAppId('slide', date);
}

export interface Slide {
    readonly slideId: AppId
}
