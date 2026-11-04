import { type ReactElement, useEffect, useRef, useState } from 'react';
// The builder + single features keep KaTeX, CodeMirror etc. out of the bundle (the full Crepe adds ~4 MB)
import { CrepeBuilder } from '@milkdown/crepe/builder';
import { blockEdit } from '@milkdown/crepe/feature/block-edit';
import { cursor } from '@milkdown/crepe/feature/cursor';
import { linkTooltip } from '@milkdown/crepe/feature/link-tooltip';
import { listItem } from '@milkdown/crepe/feature/list-item';
import { placeholder } from '@milkdown/crepe/feature/placeholder';
import { toolbar } from '@milkdown/crepe/feature/toolbar';
import '@milkdown/crepe/theme/common/prosemirror.css';
import '@milkdown/crepe/theme/common/reset.css';
import '@milkdown/crepe/theme/common/block-edit.css';
import '@milkdown/crepe/theme/common/cursor.css';
import '@milkdown/crepe/theme/common/link-tooltip.css';
import '@milkdown/crepe/theme/common/list-item.css';
import '@milkdown/crepe/theme/common/placeholder.css';
import '@milkdown/crepe/theme/common/toolbar.css';
import '@milkdown/crepe/theme/frame.css';
import type { TextSlice } from '../../../model/slides/Slice.ts';

type Props = {
    slice: TextSlice
    onUpdate: (slice: TextSlice) => void
};

/**
 * WYSIWYG Markdown editor (Milkdown Crepe, without tables / math / code highlighting, which the slideshow doesn't render). Changes are applied with the Update button.
 * The editor is created once per mount; the parent remounts it when the stored text changes.
 */
export const TextSliceEditor = ({ slice, onUpdate }: Props): ReactElement => {
    const rootRef = useRef<HTMLDivElement>(null);
    const crepeRef = useRef<CrepeBuilder | null>(null);
    const [initialText] = useState(slice.text);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        const crepe = new CrepeBuilder({ root: rootRef.current, defaultValue: initialText })
            .addFeature(cursor)
            .addFeature(listItem)
            .addFeature(linkTooltip)
            .addFeature(placeholder)
            .addFeature(toolbar)
            .addFeature(blockEdit);
        crepe.on((listener) => {
            listener.markdownUpdated((_ctx, markdown) => setDirty(markdown !== initialText));
        });
        crepeRef.current = crepe;
        const created = crepe.create();
        return () => {
            crepeRef.current = null;
            // Destroying before creation finished leaves a half-built editor behind
            created.then(() => crepe.destroy());
        };
    }, [initialText]);

    const onClickUpdate = () => {
        const crepe = crepeRef.current;
        if (crepe) {
            onUpdate({ ...slice, text: crepe.getMarkdown() });
        }
    };

    return (
        <div className="d-flex flex-column gap-2 h-100">
            <div ref={rootRef} className="slice-editor-text flex-grow-1 overflow-auto border rounded" style={{ minHeight: 0 }} />
            <button type="button" className="btn btn-sm btn-primary align-self-end" disabled={!dirty} onClick={onClickUpdate}>
                Update
            </button>
        </div>
    );
};
