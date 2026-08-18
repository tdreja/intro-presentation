export type Base64Image = `data:${string};base64,${string}`;

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
