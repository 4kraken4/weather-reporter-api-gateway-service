import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import eslintImport from 'eslint-plugin-import';
import node from 'eslint-plugin-n';
import prettier from 'eslint-plugin-prettier';
import security from 'eslint-plugin-security';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist',
      'build',
      'coverage',
      '**/node_modules/**',
      '**/logs/**',
      'nginx/',
      'docker.sh'
    ]
  },
  js.configs.recommended,
  security.configs.recommended,
  prettierConfig,
  {
    // Database and utility files
    files: ['db/**/*.js', 'jest.setup.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      import: eslintImport,
      prettier,
      security
    },
    rules: {
      'no-console': 'off',
      'security/detect-object-injection': 'off'
    }
  },
  {
    // Main application files
    files: ['src/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      import: eslintImport,
      prettier,
      security,
      n: node
    },

    rules: {
      'prettier/prettier': 'error',

      // Import rules (fixed plugin name)
      'import/no-default-export': 'off',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ],
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',

      // Node.js specific rules
      'n/no-unsupported-features/es-syntax': 'off', // Allow modern ES features
      'n/no-missing-import': 'off', // Handled by import plugin
      'n/no-process-exit': 'warn',
      'n/no-deprecated-api': 'error',

      // Security rules (balanced for development and production)
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',

      // General best practices (adjusted severity)
      'arrow-spacing': 'error',
      'object-shorthand': 'warn',
      'require-atomic-updates': 'warn',
      'default-case-last': 'error',
      'dot-notation': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-template': 'warn',
      'no-alert': 'error',
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-var': 'error',
      'no-console': 'warn',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-debugger': 'warn',
      'no-confusing-arrow': 'error',
      'no-template-curly-in-string': 'warn',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-implicit-coercion': 'warn',
      'no-nested-ternary': 'warn',
      'no-param-reassign': ['error', { props: false }],
      'no-throw-literal': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-concat': 'error',
      'no-return-await': 'error',
      'no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true }
      ],
      'no-unexpected-multiline': 'error',

      // Error prevention (adjusted)
      'no-duplicate-imports': 'error',
      'no-invalid-regexp': 'error',
      'array-callback-return': 'error',
      'no-promise-executor-return': 'warn',
      'no-useless-catch': 'error',
      'no-await-in-loop': 'warn',
      'no-constructor-return': 'error',
      'no-self-compare': 'error',
      'no-use-before-define': [
        'error',
        { functions: false, classes: true, variables: true }
      ],
      curly: ['error', 'multi-line', 'consistent'],

      // Additional modern JavaScript rules
      'prefer-destructuring': ['warn', { object: true, array: false }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'no-duplicate-case': 'error',
      'no-fallthrough': 'error'
    }
  },
  {
    // Test files configuration
    files: [
      '**/*.test.{js,mjs,cjs}',
      '**/*.spec.{js,mjs,cjs}',
      'tests/**/*.{js,mjs,cjs}'
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      import: eslintImport,
      prettier
    },
    rules: {
      'no-console': 'off',
      'no-unused-expressions': 'off',
      'prefer-const': 'off',
      'no-await-in-loop': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-child-process': 'off',
      'import/no-extraneous-dependencies': 'off'
    }
  },
  {
    // Script files (more permissive)
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      prettier,
      security
    },
    rules: {
      'no-console': 'off',
      'no-await-in-loop': 'off',
      'no-promise-executor-return': 'off',
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-undef': 'off', // Scripts may use global variables
      'security/detect-child-process': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off',
      'n/no-process-exit': 'off'
    }
  },
  {
    // Infrastructure and ORM files (allow more flexibility)
    files: [
      'src/infrastructure/**/*.js',
      'src/**/*Repository*.js',
      'src/**/*Schema*.js'
    ],
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      import: eslintImport,
      prettier,
      security,
      n: node
    },
    rules: {
      'no-useless-constructor': 'warn', // Allow empty constructors in ORM
      'security/detect-non-literal-regexp': 'off', // Common in search functionality
      'security/detect-unsafe-regex': 'off', // Common in search functionality
      'prefer-destructuring': 'off', // Allow non-destructured access
      'no-use-before-define': [
        'error',
        { functions: false, classes: false, variables: true }
      ]
    }
  },
  {
    // Configuration files
    files: ['*.config.{js,mjs,cjs}', '.eslintrc.{js,cjs}'],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'no-console': 'off',
      'import/no-extraneous-dependencies': 'off'
    }
  }
];
