import { type RefObject, useLayoutEffect, useState } from 'react';

export type ElementSize = { width: number, height: number };

/**
 * Size of the content box of an element, updated whenever it changes (window resize, layout changes, ...).
 * Starts with 0×0 until the element has been measured.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize {
    const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }
        const update = (width: number, height: number) => setSize(previous => (
            previous.width === width && previous.height === height ? previous : { width, height }
        ));
        update(element.clientWidth, element.clientHeight);
        const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);
    return size;
}
