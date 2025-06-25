import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import eslintImport from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist',
      '**/node_modules/**',
      '**/*.test.js',
      '**/*.spec.js',
      '**/logs/**'
    ]
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.browser },
    plugins: {
      'eslint-import': eslintImport,
      prettier
    },

    rules: {
      'prettier/prettier': 'error',

      // General best practices
      'arrow-spacing': 'error',
      'object-shorthand': 'off',
      'require-atomic-updates': 'error',
      'default-case-last': 'error',
      'dot-notation': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-template': 'error',
      'no-alert': 'error',
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-debugger': 'warn',
      'no-confusing-arrow': 'error',
      'no-template-curly-in-string': 'warn',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-implicit-coercion': 'error',
      'no-nested-ternary': 'warn',
      'no-param-reassign': 'error',
      'no-throw-literal': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-concat': 'error',
      'no-return-await': 'error',
      'no-unused-expressions': 'error',
      'no-unexpected-multiline': 'error',

      // Error prevention
      'no-duplicate-imports': 'error',
      'no-invalid-regexp': 'error',
      'array-callback-return': 'error',
      'no-promise-executor-return': 'error',
      'no-useless-catch': 'error',
      'no-await-in-loop': 'error',
      'no-constructor-return': 'error',
      'no-self-compare': 'error',
      'no-use-before-define': 'off',
      curly: ['error', 'multi-line', 'consistent'],

      'eslint-import/no-default-export': 'off', // Allow default exports
      'eslint-import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ]
    }
  }
];
