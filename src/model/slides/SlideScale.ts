import type { Bounds } from './Area.ts';

/**
 * Largest factor a slide can be scaled with to fit into the available space, keeping its aspect ratio.
 * Returns 0 when there is no space or the slide has no size.
 */
export function fitScale(slideWidth: number, slideHeight: number, availableWidth: number, availableHeight: number): number {
    if (slideWidth <= 0 || slideHeight <= 0 || availableWidth <= 0 || availableHeight <= 0) {
        return 0;
    }
    return Math.min(availableWidth / slideWidth, availableHeight / slideHeight);
}

/**
 * Converts bounds in slide units into screen pixels for the given scale.
 */
export function scaleBounds(bounds: Bounds, scale: number): Bounds {
    return {
        left: bounds.left * scale,
        top: bounds.top * scale,
        width: bounds.width * scale,
        height: bounds.height * scale,
    };
}

/**
 * Converts bounds in screen pixels back into slide units, the inverse of {@link scaleBounds}.
 * A scale of 0 (nothing visible) leaves the bounds unchanged.
 */
export function unscaleBounds(bounds: Bounds, scale: number): Bounds {
    if (scale <= 0) {
        return bounds;
    }
    return scaleBounds(bounds, 1 / scale);
}
