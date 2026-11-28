import { type ReactElement, type ReactNode, type Ref, useLayoutEffect, useMemo, useRef } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import type { PopperRef } from 'react-bootstrap/types';
import type { Area } from '../../../model/slides/Area.ts';
import { ImageAreaControls } from './ImageAreaControls.tsx';
import { QrCodeAreaControls } from './QrCodeAreaControls.tsx';

type Props = {
    area: Area
    /**
     * Element the popover is attached to, the frame of the area
     */
    target: HTMLElement | null
    show: boolean
    /**
     * Area the popover has to stay in, the editor canvas below the toolbar; it flips to the other side of the area otherwise
     */
    boundary: HTMLElement | null
    /**
     * Receives the element that takes the formatting bar of a text area (see TextAreaEditor), null while hidden
     */
    textToolbarRef: Ref<HTMLDivElement>
    onUpdate: (area: Area) => void
};

/**
 * Repositions the popover whenever its content changes size, e.g. when the formatting bar is moved in after the popover opened.
 */
const FollowSize = ({ popper, children }: { popper: PopperRef | undefined, children: ReactNode }): ReactElement => {
    const ref = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element || !popper) {
            return;
        }
        const observer = new ResizeObserver(() => popper.scheduleUpdate?.());
        observer.observe(element);
        return () => observer.disconnect();
    }, [popper]);
    return <div ref={ref}>{children}</div>;
};

/**
 * Floating controls of the selected area, next to it on the slide:
 * - Text: the formatting bar, above the area (below when there is no space above)
 * - Image: upload of a new image, below the area (above when there is no space below)
 * - QR code: its URL, below the area (above when there is no space below)
 */
export const AreaPopover = ({ area, target, show, boundary, textToolbarRef, onUpdate }: Props): ReactElement => {
    const isText = area.areaType === 'text';
    const popperConfig = useMemo(() => (boundary
        ? {
            modifiers: [
                { name: 'flip', options: { boundary } },
                { name: 'preventOverflow', options: { boundary } },
            ],
        }
        : {}), [boundary]);
    return (
        <Overlay target={target} show={show && !!target} placement={isText ? 'top' : 'bottom'} flip popperConfig={popperConfig}>
            {({ popper, ...injected }) => (
                <Popover {...injected} className={`area-popover ${isText ? 'area-popover--text' : ''}`}>
                    <Popover.Body className={isText ? 'p-0' : 'p-2'}>
                        <FollowSize popper={popper}>
                            {area.areaType === 'text' && <div ref={textToolbarRef} />}
                            {area.areaType === 'image' && <ImageAreaControls area={area} onUpdate={onUpdate} />}
                            {area.areaType === 'qr-code' && <QrCodeAreaControls key={area.data} area={area} onUpdate={onUpdate} />}
                        </FollowSize>
                    </Popover.Body>
                </Popover>
            )}
        </Overlay>
    );
};
