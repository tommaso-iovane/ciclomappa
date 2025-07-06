import globals from 'globals'
import pluginJs from '@eslint/js'
import eslintPluginSvelte from 'eslint-plugin-svelte'


export default [
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...eslintPluginSvelte.configs['flat/recommended'],
    {
        rules: {
            indent: ['warn', 4, {'SwitchCase': 1}],
            'linebreak-style': ['warn', 'unix'],
            quotes: ['warn', 'single'],
            semi: ['warn', 'never'],
            'css-unused-selector': 'off',
            'no-unused-vars': ['warn', {
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_',
                'caughtErrorsIgnorePattern': '^_'
            }],
            'svelte/no-at-html-tags': 'off',
            'svelte/require-each-key': 'off',
            'a11y-click-events-have-key-events': 'off',
            'arrow-parens': [1, 'always']
            // 'svelte/valid-compile': ['error', { 'ignoreWarnings': true }]
        }
    }
]