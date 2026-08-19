import type { DirectJsonConverter, JsonConverter } from './json.ts';
import { Temporal } from '@js-temporal/polyfill';

/**
 * Imports/Exports Boolean
 */
export const BOOLEAN_CONVERTER: DirectJsonConverter<boolean> = {
    fromJson(json: unknown | null | undefined): boolean | null {
        return json === true;
    }, toJson(data: boolean | null | undefined): unknown | null {
        return data === true;
    },
};

/**
 * Imports/Exports String
 */
export const STRING_CONVERTER: DirectJsonConverter<string> = {
    fromJson(json: unknown | null | undefined): string | null {
        if (typeof json === 'string') {
            return json;
        }
        return null;
    }, toJson(data: string | null | undefined): unknown | null {
        return data ?? null;
    },
};

/**
 * Imports/Exports Number
 */
export const NUMBER_CONVERTER: DirectJsonConverter<number> = {
    fromJson(json: unknown | null | undefined): number | null {
        if (typeof json === 'number' && Number.isFinite(json)) {
            return json;
        }
        return null;
    }, toJson(data: number | null | undefined): unknown | null {
        return data ?? null;
    },
};

/**
 * Imports/Exports Temporal.PlainDateTime
 */
export const DATE_TIME_CONVERTER: DirectJsonConverter<Temporal.PlainDateTime> = {
    fromJson(json: unknown | null | undefined): Temporal.PlainDateTime | null {
        if (json == null) {
            return null;
        }
        if (typeof json === 'string') {
            if (!json) {
                return null;
            }
            try {
                return Temporal.PlainDateTime.from(json);
            }
            catch {
                return null;
            }
        }
        if (typeof json === 'object') {
            try {
                return Temporal.PlainDateTime.from(json as Temporal.PlainDateTimeLike);
            }
            catch {
                return null;
            }
        }
        return null;
    }, toJson(data: Temporal.PlainDateTime | null | undefined): unknown | null {
        return data?.toString() ?? null;
    },
};

/**
 * Wraps a regular converter and exports/imports Arrays
 */
export class ArrayConverter<DATA, JSON> implements JsonConverter<DATA[], JSON[]> {
    private readonly itemConverter: JsonConverter<DATA, JSON>;

    constructor(itemConverter: JsonConverter<DATA, JSON>) {
        this.itemConverter = itemConverter;
    }

    public fromJson(json?: unknown | null): DATA[] | null {
        if (json && Array.isArray(json)) {
            const result: DATA[] = [];
            for (const item of json) {
                const data = this.itemConverter.fromJson(item);
                if (data === null) {
                    return null;
                }
                result.push(data);
            }
            return result;
        }
        return null;
    }

    public toJson(data?: DATA[] | null): JSON[] | null {
        if (data) {
            const result: JSON[] = [];
            for (const item of data) {
                const json = this.itemConverter.toJson(item);
                if (json === null) {
                    return null;
                }
                result.push(json);
            }
            return result;
        }
        return null;
    }
}
