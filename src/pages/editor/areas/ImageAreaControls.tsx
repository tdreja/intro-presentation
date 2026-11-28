import { type ChangeEvent, type ReactElement, useRef, useState } from 'react';
import { importFromBlob } from '../../../model/slides/Image.ts';
import type { ImageArea } from '../../../model/slides/Area.ts';

type Props = {
    area: ImageArea
    onUpdate: (area: ImageArea) => void
};

/**
 * Button to pick a new image for an area; the picked image replaces the current one right away.
 */
export const ImageAreaControls = ({ area, onUpdate }: Props): ReactElement => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        const file = input.files?.[0];
        setError(null);
        if (!file) {
            return;
        }
        importFromBlob(file)
            .then(image => onUpdate({ ...area, image }))
            .catch(() => setError('Could not read the image'))
            // Allows picking the same file again
            .finally(() => {
                input.value = '';
            });
    };

    return (
        <>
            <input ref={inputRef} type="file" accept="image/*" className="d-none" onChange={onFileChange} aria-label="Pick a new image" />
            <button type="button" className="btn btn-sm btn-outline-secondary text-nowrap" onClick={() => inputRef.current?.click()}>
                Replace image&hellip;
            </button>
            {error && <span className="small text-danger text-nowrap">{error}</span>}
        </>
    );
};
