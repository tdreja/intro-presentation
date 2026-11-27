import { describe, test, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import Markdown from 'react-markdown';
import { remarkLineBreaks } from './RemarkLineBreaks.ts';

const render = (text: string): string =>
    renderToStaticMarkup(createElement(Markdown, { remarkPlugins: [remarkLineBreaks] }, text));

describe('remarkLineBreaks', () => {
    test('renders an empty line of the editor as an empty paragraph', () => {
        expect(render('Hello\n\n<br />\n\nWorld')).toBe('<p>Hello</p>\n<p><br/>\n</p>\n<p>World</p>');
    });

    test('keeps several empty lines', () => {
        expect(render('A\n\n<br />\n\n<br>\n\nB')).toBe('<p>A</p>\n<p><br/>\n</p>\n<p><br/>\n</p>\n<p>B</p>');
    });

    test('renders an inline tag as a line break', () => {
        expect(render('A <br/> B')).toBe('<p>A <br/>\nB</p>');
    });

    test('handles empty lines inside list items', () => {
        expect(render('- A\n\n  <br />')).toContain('<p><br/>\n</p>');
    });

    test('leaves other HTML escaped', () => {
        expect(render('<b>bold</b>')).not.toContain('<b>');
    });
});
