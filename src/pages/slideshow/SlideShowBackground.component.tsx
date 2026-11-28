import { type CSSProperties, type ReactElement, useState } from 'react';

const STREAK_COUNT = 14;

type Streak = {
    top: number
    length: number
    duration: number
    delay: number
    opacity: number
};

const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

const createStreaks = (): Streak[] => Array.from({ length: STREAK_COUNT }, () => ({
    top: randomBetween(0, 100),
    length: randomBetween(80, 260),
    duration: randomBetween(6, 14),
    // Negative delays, so the streaks are already spread across the screen on the first frame
    delay: -randomBetween(0, 14),
    opacity: randomBetween(0.25, 0.7),
}));

/**
 * Gradient with thin streaks flying across it, drawn behind the slides (see .slideshow-background in custom-style.css).
 */
export const SlideShowBackground = (): ReactElement => {
    // Picked once, so the streaks don't jump on every render
    const [streaks] = useState<Streak[]>(createStreaks);
    return (
        <div className="slideshow-background" aria-hidden="true">
            <div className="slideshow-streaks">
                {streaks.map((streak, index) => (
                    <span
                        key={index}
                        className="slideshow-streak"
                        style={{
                            top: `${streak.top}%`,
                            width: `${streak.length}px`,
                            opacity: streak.opacity,
                            animationDuration: `${streak.duration}s`,
                            animationDelay: `${streak.delay}s`,
                        } as CSSProperties}
                    />
                ))}
            </div>
        </div>
    );
};
