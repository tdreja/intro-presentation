import { type ChangeEvent, type ReactElement, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { type Base64Image, importFromBlob } from '../../../model/slides/Image.ts';
import type { ImageSlice } from '../../../model/slides/Slice.ts';

type Props = {
    slice: ImageSlice
    onUpdate: (slice: ImageSlice) => void
};

/**
 * Shows the image and lets the user pick a replacement, applied with the Update button.
 */
export const ImageSliceEditor = ({ slice, onUpdate }: Props): ReactElement => {
    const [draft, setDraft] = useState<Base64Image | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setError(null);
        if (!file) {
            setDraft(null);
            return;
        }
        importFromBlob(file)
            .then(setDraft)
            .catch(() => setError('Could not read the image'));
    };

    return (
        <div className="d-flex flex-column gap-2 h-100">
            <div className="flex-grow-1 d-flex justify-content-center align-items-center bg-body-tertiary rounded" style={{ minHeight: 0 }}>
                <img
                    src={draft ?? slice.image}
                    alt=""
                    className="mw-100 mh-100"
                    style={{ objectFit: 'contain' }}
                />
            </div>
            <Form.Control type="file" accept="image/*" size="sm" onChange={onFileChange} aria-label="Pick a new image" />
            {error && <div className="small text-danger">{error}</div>}
            <button
                type="button"
                className="btn btn-sm btn-primary align-self-end"
                disabled={!draft}
                onClick={() => draft && onUpdate({ ...slice, image: draft })}
            >
                Update
            </button>
        </div>
    );
};
