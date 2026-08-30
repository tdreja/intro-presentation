import type { JsonConverter } from '../json/json.ts';

export interface QrCode {
    readonly data: string
    readonly corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export type RawQrCode = Partial<QrCode>;

const VALID_CORNERS: ReadonlySet<string> = new Set(['top-left', 'top-right', 'bottom-left', 'bottom-right']);

export const QR_CODE_CONVERTER: JsonConverter<QrCode, RawQrCode> = {
    fromJson(json: unknown | null | undefined): QrCode | null {
        if (!json) {
            return null;
        }
        const parsed = json as RawQrCode;
        if (typeof parsed.data !== 'string' || !parsed.data) {
            return null;
        }
        if (typeof parsed.corner !== 'string' || !VALID_CORNERS.has(parsed.corner)) {
            return null;
        }
        return {
            data: parsed.data,
            corner: parsed.corner as QrCode['corner'],
        };
    },

    toJson(data: QrCode | null | undefined): RawQrCode | null {
        if (!data) {
            return null;
        }
        return {
            data: data.data,
            corner: data.corner,
        };
    },
};
