import { type CSSProperties, type ReactElement, useEffect, useEffectEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// The builder + single features keep KaTeX, CodeMirror etc. out of the bundle (the full Crepe adds ~4 MB)
import { CrepeBuilder } from '@milkdown/crepe/builder';
import { cursor } from '@milkdown/crepe/feature/cursor';
import { linkTooltip } from '@milkdown/crepe/feature/link-tooltip';
import { listItem } from '@milkdown/crepe/feature/list-item';
import { placeholder } from '@milkdown/crepe/feature/placeholder';
import { topBar } from '@milkdown/crepe/feature/top-bar';
import '@milkdown/crepe/theme/common/prosemirror.css';
import '@milkdown/crepe/theme/common/reset.css';
import '@milkdown/crepe/theme/common/cursor.css';
import '@milkdown/crepe/theme/common/link-tooltip.css';
import '@milkdown/crepe/theme/common/list-item.css';
import '@milkdown/crepe/theme/common/placeholder.css';
import '@milkdown/crepe/theme/common/top-bar.css';
import '@milkdown/crepe/theme/frame.css';
import { type TextArea, textAlignOf } from '../../../model/slides/Area.ts';

/**
 * Top bar buttons whose output the slideshow can't render: strikethrough and task lists need GitHub Flavored Markdown.
 */
const UNSUPPORTED_TOP_BAR_ITEMS: Record<string, readonly string[]> = {
    formatting: ['strikethrough'],
    list: ['task-list'],
};

type Props = {
    area: TextArea
    /**
     * Whether the area is selected: only then its formatting buttons are shown in the toolbar
     */
    active: boolean
    /**
     * Element above the slide that takes the formatting buttons
     */
    toolbarHost: HTMLElement | null
    onUpdate: (area: TextArea) => void
};

/**
 * WYSIWYG Markdown editor (Milkdown Crepe, without tables / math / code highlighting, which the slideshow doesn't render)
 * right in the area. Its formatting bar is moved into the toolbar above the slide and only shown while the area is active.
 * The text is saved when the area is left (or the editor closes).
 * The editor is created once per mount; the parent remounts it when the stored text changes.
 */
export const TextAreaEditor = ({ area, active, toolbarHost, onUpdate }: Props): ReactElement => {
    const rootRef = useRef<HTMLDivElement>(null);
    const crepeRef = useRef<CrepeBuilder | null>(null);
    const [initialText] = useState(area.text);
    const [topBarElement, setTopBarElement] = useState<HTMLElement | null>(null);
    const [slot, setSlot] = useState<HTMLDivElement | null>(null);

    // Always sees the latest area and callback, also when called from a cleanup
    const save = useEffectEvent(() => {
        const crepe = crepeRef.current;
        if (!crepe) {
            return;
        }
        const markdown = crepe.getMarkdown();
        if (markdown !== initialText && markdown !== area.text) {
            onUpdate({ ...area, text: markdown });
        }
    });

    useEffect(() => {
        const crepe = new CrepeBuilder({ root: rootRef.current, defaultValue: initialText })
            .addFeature(cursor)
            .addFeature(listItem)
            .addFeature(linkTooltip)
            .addFeature(placeholder)
            .addFeature(topBar, {
                buildTopBar: (builder) => {
                    for (const [groupKey, itemKeys] of Object.entries(UNSUPPORTED_TOP_BAR_ITEMS)) {
                        const { group } = builder.getGroup(groupKey);
                        group.items = group.items.filter(item => !itemKeys.includes(item.key));
                    }
                },
            });
        let alive = true;
        // Crepe puts its top bar first into the editor, not necessarily before create() resolves, and creates a new one
        // whenever ProseMirror rebuilds its plugin views. Every new one is picked up here and moved to the toolbar.
        const root = rootRef.current;
        const findTopBar = () => {
            const bars = root?.querySelectorAll<HTMLElement>('.milkdown-top-bar');
            if (bars && bars.length > 0) {
                setTopBarElement(bars[bars.length - 1]);
            }
        };
        const observer = new MutationObserver(findTopBar);
        if (root) {
            observer.observe(root, { childList: true, subtree: true });
        }
        const created = crepe.create().then(() => {
            if (alive) {
                crepeRef.current = crepe;
                findTopBar();
            }
        });
        return () => {
            alive = false;
            observer.disconnect();
            save();
            crepeRef.current = null;
            setTopBarElement(null);
            // Destroying before creation finished leaves a half-built editor behind; destroy also removes the moved top bar
            created.then(() => crepe.destroy());
        };
    }, [initialText]);

    useEffect(() => {
        if (topBarElement && slot && topBarElement.parentElement !== slot) {
            // Replaces a bar of an earlier plugin view, which no longer controls this editor
            slot.replaceChildren(topBarElement);
        }
    }, [topBarElement, slot]);

    // Leaving the area saves the text
    useEffect(() => {
        if (!active) {
            save();
        }
    }, [active]);

    return (
        <>
            <div
                ref={rootRef}
                className="area-editor-text w-100 h-100 overflow-auto"
                style={{ '--area-text-align': textAlignOf(area) } as CSSProperties}
            />
            {toolbarHost && createPortal(
                <div ref={setSlot} className={`milkdown area-editor-top-bar ${active ? '' : 'd-none'}`} />,
                toolbarHost,
            )}
        </>
    );
};
