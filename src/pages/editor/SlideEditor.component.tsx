import { type PointerEvent, type ReactElement, type ReactNode, useRef, useState } from 'react';
import type { Slide } from '../../model/slides/Slide.ts';
import type { Area, AreaType, Bounds } from '../../model/slides/Area.ts';
import { addArea, moveArea, removeArea, setAreaBounds, updateArea } from '../../model/slides/SlideEditing.ts';
import { AreaBox, AreaContent, SlideCanvas } from '../slideshow/Slide.component.tsx';
import { AreaToolbar } from './AreaToolbar.component.tsx';
import { TextAreaEditor } from './areas/TextAreaEditor.tsx';
import { AreaPopover } from './areas/AreaPopover.tsx';

/**
 * Identifies the content of an area (not its bounds), so editors with local drafts are reset when the content changes.
 */
function contentKey(area: Area): string {
    switch (area.areaType) {
        case 'image':
            return `image:${area.image.length}:${area.image.slice(-24)}`;
        case 'text':
            return `text:${area.text}`;
        case 'qr-code':
            return `qr:${area.data}`;
    }
}

function boundsOf(area: Area): Bounds {
    return { left: area.left, top: area.top, width: area.width, height: area.height };
}

type GestureKind = 'move' | 'resize';

type Gesture = {
    kind: GestureKind
    pointerId: number
    startX: number
    startY: number
    start: Bounds
};

/**
 * Bounds after dragging the pointer by (dx, dy) screen pixels, converted back into unscaled slide units.
 */
function draggedBounds(gesture: Gesture, dx: number, dy: number, scale: number): Bounds {
    const x = dx / scale;
    const y = dy / scale;
    const { start } = gesture;
    return gesture.kind === 'move'
        ? { ...start, left: start.left + x, top: start.top + y }
        : { ...start, width: start.width + x, height: start.height + y };
}

type DragHandleProps = {
    kind: GestureKind
    area: Area
    scale: number
    className: string
    label: string
    title: string
    children?: ReactNode
    onStart: () => void
    onBoundsChange: (bounds: Bounds) => void
    onBoundsCommit: () => void
};

/**
 * Handle that moves or resizes an area while it is dragged. Screen movement is divided by the scale,
 * so the area stores unscaled slide units.
 */
const DragHandle = (props: DragHandleProps): ReactElement => {
    const { kind, area, scale, onStart, onBoundsChange, onBoundsCommit } = props;
    const gesture = useRef<Gesture | null>(null);
    const end = (event: PointerEvent<HTMLButtonElement>) => {
        if (gesture.current?.pointerId === event.pointerId) {
            gesture.current = null;
            onBoundsCommit();
        }
    };
    return (
        <button
            type="button"
            className={`area-handle ${props.className}`}
            title={props.title}
            aria-label={props.label}
            onPointerDown={(event) => {
                if (event.button !== 0) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
                onStart();
                event.currentTarget.setPointerCapture(event.pointerId);
                gesture.current = {
                    kind,
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    start: boundsOf(area),
                };
            }}
            onPointerMove={(event) => {
                const current = gesture.current;
                if (current && current.pointerId === event.pointerId) {
                    onBoundsChange(draggedBounds(current, event.clientX - current.startX, event.clientY - current.startY, scale));
                }
            }}
            onPointerUp={end}
            onPointerCancel={end}
        >
            {props.children}
        </button>
    );
};

type EditableAreaProps = {
    area: Area
    scale: number
    selected: boolean
    /**
     * Whether an area is being moved or resized; the popover is hidden meanwhile, as it can't follow the area
     */
    dragging: boolean
    /**
     * Editor canvas the popover of the area stays in
     */
    canvas: HTMLElement | null
    darkMode?: boolean | null
    onSelect: () => void
    onUpdate: (area: Area) => void
    onBoundsChange: (bounds: Bounds) => void
    onBoundsCommit: () => void
};

/**
 * An area in the editor: dotted frame, a handle to move it on the top left and one to resize it on the bottom right.
 * The handles stay the same size on screen, independent of the scale of the slide.
 */
const EditableArea = (props: EditableAreaProps): ReactElement => {
    const { area, scale, selected, onSelect } = props;
    // Target of the popover with the controls of the area
    const [frame, setFrame] = useState<HTMLDivElement | null>(null);
    // Element in the popover that takes the formatting bar of a text area, while the popover is shown
    const [textToolbar, setTextToolbar] = useState<HTMLDivElement | null>(null);
    const handleProps = {
        area,
        scale,
        onStart: onSelect,
        onBoundsChange: props.onBoundsChange,
        onBoundsCommit: props.onBoundsCommit,
    };
    return (
        <AreaBox
            area={area}
            scale={scale}
            className={`area-frame ${selected ? 'area-frame--selected' : ''}`}
            onPointerDown={(event) => {
                // Keeps the canvas from clearing the selection
                event.stopPropagation();
                onSelect();
            }}
            overlay={(
                <>
                    <div ref={setFrame} className="position-absolute top-0 start-0 w-100 h-100 pe-none" />
                    <AreaPopover
                        area={area}
                        target={frame}
                        show={selected && !props.dragging}
                        boundary={props.canvas}
                        textToolbarRef={setTextToolbar}
                        onUpdate={props.onUpdate}
                    />
                    <DragHandle kind="move" className="area-handle--move" title="Drag to move" label="Move area" {...handleProps}>
                        &#10021;
                    </DragHandle>
                    <DragHandle kind="resize" className="area-handle--resize" title="Drag to resize" label="Resize area" {...handleProps} />
                </>
            )}
        >
            {area.areaType === 'text'
                ? (
                    <TextAreaEditor
                        area={area}
                        active={selected}
                        toolbarHost={textToolbar}
                        onUpdate={props.onUpdate}
                    />
                )
                : <AreaContent area={area} darkMode={props.darkMode} />}
        </AreaBox>
    );
};

type Props = {
    slide: Slide
    darkMode?: boolean | null
    onChange: (slide: Slide) => void
};

/**
 * The selected slide, scaled to fit, with its areas to select, move and resize. The toolbar on top edits the selected area.
 */
export const SlideEditor = ({ slide, darkMode, onChange }: Props): ReactElement => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    // Bounds while an area is being moved or resized; only committed (and broadcast) when the pointer is released
    const [draft, setDraft] = useState<Slide | null>(null);
    const [canvas, setCanvas] = useState<HTMLDivElement | null>(null);
    const shown = draft ?? slide;
    const selected = selectedIndex !== null ? shown.areas[selectedIndex] ?? null : null;

    const commitBounds = () => {
        if (draft) {
            onChange(draft);
            setDraft(null);
        }
    };
    const onAdd = (type: AreaType) => {
        const updated = addArea(slide, type);
        onChange(updated);
        setSelectedIndex(updated.areas.length - 1);
    };
    const onMove = (direction: -1 | 1) => {
        if (selectedIndex === null) {
            return;
        }
        const updated = moveArea(slide, selectedIndex, direction);
        if (updated !== slide) {
            onChange(updated);
            setSelectedIndex(selectedIndex + direction);
        }
    };
    const onRemove = () => {
        if (selectedIndex !== null) {
            onChange(removeArea(slide, selectedIndex));
            setSelectedIndex(null);
        }
    };

    return (
        <div className="d-flex flex-column h-100">
            <AreaToolbar
                area={selected}
                canMoveBack={selectedIndex !== null && selectedIndex > 0}
                canMoveForward={selectedIndex !== null && selectedIndex < shown.areas.length - 1}
                onUpdate={area => selectedIndex !== null && onChange(updateArea(slide, selectedIndex, area))}
                onMove={onMove}
                onRemove={onRemove}
                onAdd={onAdd}
            />
            <div
                ref={setCanvas}
                className="flex-grow-1 p-3 bg-body-tertiary"
                style={{ minHeight: 0 }}
                onPointerDown={() => setSelectedIndex(null)}
            >
                <SlideCanvas
                    slide={shown}
                    render={scale => (
                        <div
                            className="slide position-relative bg-body shadow-sm flex-shrink-0"
                            style={{ width: shown.width * scale, height: shown.height * scale }}
                        >
                            {shown.areas.map((area, index) => (
                                <EditableArea
                                    key={`${index}-${contentKey(area)}`}
                                    area={area}
                                    scale={scale}
                                    selected={index === selectedIndex}
                                    dragging={draft !== null}
                                    canvas={canvas}
                                    darkMode={darkMode}
                                    onSelect={() => setSelectedIndex(index)}
                                    onUpdate={updated => onChange(updateArea(slide, index, { ...updated, ...boundsOf(slide.areas[index]) }))}
                                    onBoundsChange={bounds => setDraft(setAreaBounds(slide, index, bounds))}
                                    onBoundsCommit={commitBounds}
                                />
                            ))}
                        </div>
                    )}
                />
            </div>
        </div>
    );
};
