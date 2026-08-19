import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    // Strip Vite's `?raw` query suffix so Jest resolves the bare file path,
    // which is then handled by the SVG transform below.
    moduleNameMapper: {
        '^(.*\\.svg)\\?raw$': '$1',
    },
    transform: {
        '\\.svg$': '<rootDir>/jest-transform-svg.cjs',
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json',
            },
        ],
    },
};

export default config;
