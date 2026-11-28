import { type ReactElement, type Ref, useId } from 'react';
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
import { useI18n } from '../../i18n/I18N.ts';

const AREA_TYPES: readonly AreaType[] = ['text', 'image', 'qr-code'];

type Props = {
    /**
     * Selected area, or null when nothing is selected
     */
    area: Area | null
    canMoveBack: boolean
    canMoveForward: boolean
    /**
     * Takes the formatting buttons of the selected text area (see TextAreaEditor)
     */
    textToolbarRef: Ref<HTMLDivElement>
    onUpdate: (area: Area) => void
    onMove: (direction: -1 | 1) => void
    onRemove: () => void
    onAdd: (type: AreaType) => void
};

/**
 * Toolbar above the slide with the controls of the selected area and buttons to add areas.
 * Below it, at a fixed position, the formatting buttons of the selected text area, so their menus always have space.
 * The controls of image and QR code areas float next to the area, see AreaPopover.
 */
export const AreaToolbar = (props: Props): ReactElement => {
    const { area, canMoveBack, canMoveForward, textToolbarRef, onUpdate, onMove, onRemove, onAdd } = props;
    const alignName = useId();
    const textAlignName = useId();
    const allLabels = useI18n();
    const labels = allLabels.areaToolbar;
    return (
        <div className="area-toolbar flex-shrink-0 border-bottom bg-body">
            <div className="d-flex align-items-center gap-3 px-3 py-2">
                {/* Scrolls sideways instead of wrapping, so the slide below doesn't jump */}
                <div className="area-toolbar-controls d-flex align-items-center gap-2 flex-grow-1 overflow-x-auto">
                    {area
                        ? (
                            <>
                                <span className="small fw-semibold text-body-secondary" style={{ minWidth: '4.5em' }}>
                                    {allLabels.areaTypes[area.areaType]}
                                </span>
                                <ToggleButtonGroup
                                    type="radio"
                                    name={alignName}
                                    size="sm"
                                    value={verticalAlignOf(area)}
                                    onChange={(verticalAlign: VerticalAlign) => onUpdate({ ...area, verticalAlign })}
                                    aria-label={labels.ariaVerticalAlign}
                                >
                                    {VERTICAL_ALIGNS.map(align => (
                                        <ToggleButton key={align} id={`${alignName}-${align}`} value={align} variant="outline-secondary">
                                            {allLabels.verticalAligns[align]}
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
                                        aria-label={labels.ariaTextAlign}
                                    >
                                        {TEXT_ALIGNS.map(align => (
                                            <ToggleButton key={align} id={`${textAlignName}-${align}`} value={align} variant="outline-secondary">
                                                {allLabels.textAligns[align]}
                                            </ToggleButton>
                                        ))}
                                    </ToggleButtonGroup>
                                )}
                                <div className="btn-group btn-group-sm" role="group" aria-label={labels.ariaOrder}>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        disabled={!canMoveBack}
                                        onClick={() => onMove(-1)}
                                        title={labels.tooltipSendBackward}
                                        aria-label={labels.ariaSendBackward}
                                    >
                                        &#8615;
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        disabled={!canMoveForward}
                                        onClick={() => onMove(1)}
                                        title={labels.tooltipBringForward}
                                        aria-label={labels.ariaBringForward}
                                    >
                                        &#8613;
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={onRemove}
                                    title={labels.tooltipDeleteArea}
                                    aria-label={labels.tooltipDeleteArea}
                                >
                                    &#128465;
                                </button>
                            </>
                        )
                        : <span className="small text-body-secondary text-nowrap">{labels.hintSelectArea}</span>}
                </div>
                <div className="btn-group btn-group-sm flex-shrink-0" role="group" aria-label={labels.ariaAddArea}>
                    {AREA_TYPES.map(type => (
                        <button
                            key={type}
                            type="button"
                            className="btn btn-outline-primary text-nowrap"
                            onClick={() => onAdd(type)}
                            title={labels.tooltipAddArea(allLabels.areaTypes[type])}
                        >
                            +
                            {' '}
                            {allLabels.areaTypes[type]}
                        </button>
                    ))}
                </div>
            </div>
            {/* Always takes its height, so the slide doesn't jump when a text area is selected */}
            <div ref={textToolbarRef} className="area-editor-text-toolbar" />
        </div>
    );
};
