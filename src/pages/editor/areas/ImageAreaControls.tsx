import { type ChangeEvent, type ReactElement, useRef, useState } from 'react';
import { importFromBlob } from '../../../model/slides/Image.ts';
import type { ImageArea } from '../../../model/slides/Area.ts';
import { useI18n } from '../../../i18n/I18N.ts';

type Props = {
    area: ImageArea
    onUpdate: (area: ImageArea) => void
    /**
     * Stretches the area across the whole width or height of the slide
     */
    onFill: (direction: 'width' | 'height') => void
};

/**
 * Button to pick a new image for an area (the picked image replaces the current one right away)
 * and buttons to stretch the area across the whole width or height of the slide.
 */
export const ImageAreaControls = ({ area, onUpdate, onFill }: Props): ReactElement => {
    const labels = useI18n().areaEditing;
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
            .catch(() => setError(labels.errorReadImage))
            // Allows picking the same file again
            .finally(() => {
                input.value = '';
            });
    };

    return (
        <div className="d-flex flex-column gap-1">
            <input ref={inputRef} type="file" accept="image/*" className="d-none" onChange={onFileChange} aria-label={labels.ariaPickImage} />
            <button type="button" className="btn btn-sm btn-outline-secondary text-nowrap" onClick={() => inputRef.current?.click()}>
                &#11014;
                {' '}
                {labels.actionUploadImage}
            </button>
            <div className="btn-group btn-group-sm">
                <button type="button" className="btn btn-outline-secondary text-nowrap" onClick={() => onFill('width')} title={labels.tooltipFullWidth}>
                    &#8596;
                    {' '}
                    {labels.actionFullWidth}
                </button>
                <button type="button" className="btn btn-outline-secondary text-nowrap" onClick={() => onFill('height')} title={labels.tooltipFullHeight}>
                    &#8597;
                    {' '}
                    {labels.actionFullHeight}
                </button>
            </div>
            {error && <span className="small text-danger text-nowrap">{error}</span>}
        </div>
    );
};
