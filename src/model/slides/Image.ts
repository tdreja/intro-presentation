import placeholderSvg from './placeholder.svg?raw';

export type Base64Image = `data:${string};base64,${string}`;

/**
 * A placeholder Base64Image: a 64×64 SVG with the text "placeholder" centred on a grey background.
 * Sourced from placeholder.svg and converted to a base64 data URL at runtime.
 * Intended for use in tests and as a fallback where no real image is available.
 */
export const PLACEHOLDER_IMAGE: Base64Image
    = `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;

export function asBase64Image(json?: string | null): Base64Image | null {
    if (!json) {
        return null;
    }
    if (json.startsWith('data:') && json.includes(';base64,')) {
        return json as Base64Image;
    }
    return null;
}

export function importFromBlob(blobData?: Blob | null): Promise<Base64Image> {
    if (!blobData) {
        return Promise.reject(new Error('No blob data provided'));
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result as Base64Image);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsDataURL(blobData);
    });
}
