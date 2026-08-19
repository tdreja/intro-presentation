/**
 * Describes how regular JS objects can be converted into a serializable JSON format and back.
 */
export interface JsonConverter<DATA, JSON> {
    /**
     * Imports data from serialized JSON
     * @param json JSON data
     */
    fromJson(json?: unknown | null): DATA | null

    /**
     * Exports the data into a serialized JSON format
     * @param data Data to export
     */
    toJson(data?: DATA | null): JSON | null
}

/**
 * Helper type assigns each property the unknown type, as serialized removes this information!
 */
export type RawJson<DATA> = {
    [property in keyof DATA]?: unknown;
};

/**
 * Shortcut type: Converts a DATA type into a RawJson type
 */
export type RawJsonConverter<DATA> = JsonConverter<DATA, RawJson<DATA>>;

/**
 * Shortcut type: Outputs the DATA type directly, but for importing we assume that it is unknown
 */
export type DirectJsonConverter<DATA> = JsonConverter<DATA, unknown>;
