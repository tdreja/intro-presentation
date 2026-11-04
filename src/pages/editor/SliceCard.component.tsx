import type { ReactElement } from 'react';
import Form from 'react-bootstrap/Form';
import type { Slice } from '../../model/slides/Slice.ts';
import { MIN_SLICE_WIDTH } from '../../model/slides/SlideEditing.ts';
import { ImageSliceEditor } from './slices/ImageSliceEditor.tsx';
import { QrCodeSliceEditor } from './slices/QrCodeSliceEditor.tsx';
import { TextSliceEditor } from './slices/TextSliceEditor.tsx';

const TYPE_LABELS: Record<Slice['sliceType'], string> = {
    'image': 'Image',
    'text': 'Text',
    'qr-code': 'QR code',
};

type Props = {
    slice: Slice
    darkMode?: boolean | null
    canMoveLeft: boolean
    canMoveRight: boolean
    canRemove: boolean
    onMove: (direction: -1 | 1) => void
    onRemove: () => void
    onUpdate: (slice: Slice) => void
    onWidthChange: (width: number) => void
    onWidthCommit: () => void
};

const SliceEditor = ({ slice, darkMode, onUpdate }: Pick<Props, 'slice' | 'darkMode' | 'onUpdate'>): ReactElement => {
    switch (slice.sliceType) {
        case 'image':
            return <ImageSliceEditor slice={slice} onUpdate={onUpdate} />;
        case 'text':
            return <TextSliceEditor slice={slice} onUpdate={onUpdate} />;
        case 'qr-code':
            return <QrCodeSliceEditor slice={slice} darkMode={darkMode} onUpdate={onUpdate} />;
    }
};

/**
 * One slice in the editor: move/delete toolbar, the type-specific editor and a width slider.
 */
export const SliceCard = (props: Props): ReactElement => {
    const { slice, canMoveLeft, canMoveRight, canRemove, onMove, onRemove, onWidthChange, onWidthCommit } = props;
    const width = Math.round(slice.width);
    return (
        <div
            className="card h-100 overflow-hidden"
            style={{ flex: `${slice.width} 1 0`, minWidth: 300 }}
        >
            <div className="card-header d-flex align-items-center gap-1 py-1 px-2">
                <button
                    type="button"
                    className="btn btn-sm btn-link text-body p-1"
                    disabled={!canMoveLeft}
                    onClick={() => onMove(-1)}
                    aria-label="Move slice left"
                    title="Move left"
                >
                    &#8592;
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-link text-body p-1"
                    disabled={!canMoveRight}
                    onClick={() => onMove(1)}
                    aria-label="Move slice right"
                    title="Move right"
                >
                    &#8594;
                </button>
                <span className="small text-body-secondary ms-2 me-auto">{TYPE_LABELS[slice.sliceType]}</span>
                <button
                    type="button"
                    className="btn btn-sm btn-link text-danger p-1"
                    disabled={!canRemove}
                    onClick={onRemove}
                    aria-label="Delete slice"
                    title="Delete slice"
                >
                    &#128465;
                </button>
            </div>
            <div className="card-body d-flex flex-column overflow-auto p-2" style={{ minHeight: 0 }}>
                <SliceEditor slice={slice} darkMode={props.darkMode} onUpdate={props.onUpdate} />
            </div>
            <div className="card-footer d-flex align-items-center gap-2 py-2">
                <span className="small text-nowrap">Width</span>
                <Form.Range
                    min={MIN_SLICE_WIDTH}
                    max={100 - MIN_SLICE_WIDTH}
                    step={1}
                    value={width}
                    disabled={!canRemove}
                    aria-label="Slice width"
                    onChange={event => onWidthChange(Number(event.target.value))}
                    onPointerUp={onWidthCommit}
                    onKeyUp={onWidthCommit}
                    onBlur={onWidthCommit}
                />
                <span className="small font-monospace text-end" style={{ minWidth: '3.5em' }}>
                    {width}
                    %
                </span>
            </div>
        </div>
    );
};
