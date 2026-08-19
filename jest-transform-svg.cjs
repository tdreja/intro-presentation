// Jest transform for *.svg files.
// Returns the raw SVG markup as a CommonJS string export,
// mirroring what Vite's `?raw` import gives in the browser build.
// Must be .cjs because the project uses "type": "module".
module.exports = {
    process(sourceText) {
        return { code: `module.exports = ${JSON.stringify(sourceText)};` };
    },
};
