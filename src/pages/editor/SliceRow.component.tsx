import { type ReactElement, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import type { Slide } from '../../model/slides/Slide.ts';
import type { Slice, SliceType } from '../../model/slides/Slice.ts';
import { addSlice, moveSlice, removeSlice, setSliceWidth, updateSlice } from '../../model/slides/SlideEditing.ts';
import { SliceCard } from './SliceCard.component.tsx';

const SLICE_TYPES: { type: SliceType, label: string }[] = [
    { type: 'text', label: 'Text' },
    { type: 'image', label: 'Image' },
    { type: 'qr-code', label: 'QR code' },
];

/**
 * Identifies the content of a slice (not its width), so editors with local drafts are reset when the content changes.
 */
function contentKey(slice: Slice): string {
    switch (slice.sliceType) {
        case 'image':
            return `image:${slice.image.length}:${slice.image.slice(-24)}`;
        case 'text':
            return `text:${slice.text}`;
        case 'qr-code':
            return `qr:${slice.data}`;
    }
}

type Props = {
    slide: Slide
    darkMode?: boolean | null
    onChange: (slide: Slide) => void
};

/**
 * The slices of one slide next to each other, followed by a button to add another slice.
 */
export const SliceRow = ({ slide, darkMode, onChange }: Props): ReactElement => {
    // Widths while a slider is being dragged; only committed (and broadcast) when it is released
    const [draft, setDraft] = useState<Slide | null>(null);
    const shown = draft ?? slide;

    const commitWidths = () => {
        if (draft) {
            onChange(draft);
            setDraft(null);
        }
    };

    return (
        <div className="d-flex h-100 gap-3 p-3 overflow-auto">
            {shown.slices.map((slice, index) => (
                <SliceCard
                    key={`${index}-${contentKey(slice)}`}
                    slice={slice}
                    darkMode={darkMode}
                    canMoveLeft={index > 0}
                    canMoveRight={index < shown.slices.length - 1}
                    canRemove={shown.slices.length > 1}
                    onMove={direction => onChange(moveSlice(slide, index, direction))}
                    onRemove={() => onChange(removeSlice(slide, index))}
                    onUpdate={updated => onChange(updateSlice(slide, index, { ...updated, width: slide.slices[index].width }))}
                    onWidthChange={width => setDraft(setSliceWidth(slide, index, width))}
                    onWidthCommit={commitWidths}
                />
            ))}
            <div className="flex-shrink-0 d-flex align-items-center">
                <Dropdown drop="start">
                    <Dropdown.Toggle
                        variant="outline-primary"
                        className="rounded-circle fs-4 lh-1 p-0 no-caret"
                        style={{ width: 48, height: 48 }}
                        aria-label="Add slice"
                        title="Add slice"
                    >
                        +
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {SLICE_TYPES.map(({ type, label }) => (
                            <Dropdown.Item key={type} onClick={() => onChange(addSlice(slide, type))}>
                                {label}
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
};
