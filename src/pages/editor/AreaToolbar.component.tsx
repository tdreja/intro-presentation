import { type ReactElement, useId } from 'react';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import {
    type Area,
    type AreaType,
    TEXT_ALIGNS,
    type TextAlign,
    textAlignOf,
    VERTICAL_ALIGNS,
    type VerticalAlign,
    verticalAlignOf,
} from '../../model/slides/Area.ts';

const AREA_TYPES: { type: AreaType, label: string }[] = [
    { type: 'text', label: 'Text' },
    { type: 'image', label: 'Image' },
    { type: 'qr-code', label: 'QR code' },
];

const TYPE_LABELS: Record<AreaType, string> = {
    'image': 'Image',
    'text': 'Text',
    'qr-code': 'QR code',
};

const ALIGN_LABELS: Record<VerticalAlign, string> = {
    top: 'Top',
    middle: 'Middle',
    bottom: 'Bottom',
};

const TEXT_ALIGN_LABELS: Record<TextAlign, string> = {
    left: 'Left',
    center: 'Center',
    right: 'Right',
};

type Props = {
    /**
     * Selected area, or null when nothing is selected
     */
    area: Area | null
    canMoveBack: boolean
    canMoveForward: boolean
    onUpdate: (area: Area) => void
    onMove: (direction: -1 | 1) => void
    onRemove: () => void
    onAdd: (type: AreaType) => void
};

/**
 * Toolbar above the slide with the controls of the selected area and buttons to add areas.
 * Content-specific controls (formatting, image upload, QR code URL) float next to the area, see AreaPopover.
 */
export const AreaToolbar = (props: Props): ReactElement => {
    const { area, canMoveBack, canMoveForward, onUpdate, onMove, onRemove, onAdd } = props;
    const alignName = useId();
    const textAlignName = useId();
    return (
        <div className="area-toolbar flex-shrink-0 border-bottom bg-body">
            <div className="d-flex align-items-center gap-3 px-3 py-2">
                {/* Scrolls sideways instead of wrapping, so the slide below doesn't jump */}
                <div className="area-toolbar-controls d-flex align-items-center gap-2 flex-grow-1 overflow-x-auto">
                    {area
                        ? (
                            <>
                                <span className="small fw-semibold text-body-secondary" style={{ minWidth: '4.5em' }}>
                                    {TYPE_LABELS[area.areaType]}
                                </span>
                                <ToggleButtonGroup
                                    type="radio"
                                    name={alignName}
                                    size="sm"
                                    value={verticalAlignOf(area)}
                                    onChange={(verticalAlign: VerticalAlign) => onUpdate({ ...area, verticalAlign })}
                                    aria-label="Vertical alignment"
                                >
                                    {VERTICAL_ALIGNS.map(align => (
                                        <ToggleButton key={align} id={`${alignName}-${align}`} value={align} variant="outline-secondary">
                                            {ALIGN_LABELS[align]}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                                {area.areaType === 'text' && (
                                    <ToggleButtonGroup
                                        type="radio"
                                        name={textAlignName}
                                        size="sm"
                                        value={textAlignOf(area)}
                                        onChange={(textAlign: TextAlign) => onUpdate({ ...area, textAlign })}
                                        aria-label="Horizontal text alignment"
                                    >
                                        {TEXT_ALIGNS.map(align => (
                                            <ToggleButton key={align} id={`${textAlignName}-${align}`} value={align} variant="outline-secondary">
                                                {TEXT_ALIGN_LABELS[align]}
                                            </ToggleButton>
                                        ))}
                                    </ToggleButtonGroup>
                                )}
                                <div className="btn-group btn-group-sm" role="group" aria-label="Order">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        disabled={!canMoveBack}
                                        onClick={() => onMove(-1)}
                                        title="Send backward"
                                        aria-label="Send area backward"
                                    >
                                        &#8615;
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        disabled={!canMoveForward}
                                        onClick={() => onMove(1)}
                                        title="Bring forward"
                                        aria-label="Bring area forward"
                                    >
                                        &#8613;
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={onRemove}
                                    title="Delete area"
                                    aria-label="Delete area"
                                >
                                    &#128465;
                                </button>
                            </>
                        )
                        : <span className="small text-body-secondary text-nowrap">Click an area on the slide to edit it</span>}
                </div>
                <div className="btn-group btn-group-sm flex-shrink-0" role="group" aria-label="Add area">
                    {AREA_TYPES.map(({ type, label }) => (
                        <button
                            key={type}
                            type="button"
                            className="btn btn-outline-primary text-nowrap"
                            onClick={() => onAdd(type)}
                            title={`Add ${label} area`}
                        >
                            +
                            {' '}
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
