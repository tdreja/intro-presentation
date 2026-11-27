import type { Nodes, Paragraph, Root } from 'mdast';

const BR_TAG = /^<br\s*\/?>$/i;

const isBrTag = (node: Nodes): boolean => node.type === 'html' && BR_TAG.test(node.value.trim());

const replaceBrTags = (node: Nodes): void => {
    if (!('children' in node)) {
        return;
    }
    const blockChildren = node.type === 'root' || node.type === 'blockquote' || node.type === 'listItem';
    node.children = node.children.map((child) => {
        if (!isBrTag(child)) {
            replaceBrTags(child);
            return child;
        }
        if (blockChildren) {
            // An empty paragraph of the editor: a paragraph holding only a line break takes up one empty line
            const emptyLine: Paragraph = { type: 'paragraph', children: [{ type: 'break' }] };
            return emptyLine;
        }
        return { type: 'break' };
    }) as typeof node.children;
};

/**
 * Remark plugin turning the `<br />` tags of the Markdown editor into real line breaks.
 * The editor stores empty lines as `<br />`, while the slideshow doesn't render raw HTML and would show the tag as text.
 */
export const remarkLineBreaks = () => (tree: Root): void => {
    replaceBrTags(tree);
};
