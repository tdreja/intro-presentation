import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: {
                    module: 'CommonJS',
                    moduleResolution: 'node',
                    verbatimModuleSyntax: false,
                    allowImportingTsExtensions: true,
                    types: ['jest', 'node'],
                },
            },
        ],
    },
};

export default config;
