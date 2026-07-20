module.exports = {
  ignorePatterns: ['**/*.d.ts'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
    },
  },
  extends: ['airbnb', 'plugin:react-hooks/recommended', 'prettier'],
  env: { mocha: true, jquery: true, browser: true, node: true, es6: true },
  globals: { chai: 'readonly', NAME: 'readonly', VERSION: 'readonly' },
  settings: {
    react: { version: 'detect' },
    'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'] } },
  },
  rules: {
    // Legacy architectural patterns — intentional, not fixable without refactoring
    'class-methods-use-this': 0,
    'no-cond-assign': 0,
    'no-console': 0,
    'no-continue': 0,
    'no-extend-native': 0,
    'no-mixed-operators': 0,
    'no-multi-assign': 0,
    'no-nested-ternary': 0,
    'no-param-reassign': 0,
    'no-plusplus': 0,
    'no-restricted-globals': 0,
    'no-restricted-syntax': 0,
    'no-shadow': 0,
    'no-throw-literal': 0,
    'no-undef': 0,
    'no-underscore-dangle': 0,
    'no-unused-expressions': 0,
    'no-unused-vars': 0,
    'no-use-before-define': 0,
    'no-useless-constructor': 0,
    'no-var': 0,
    'one-var': 0,
    'prefer-destructuring': 0,
    'prefer-promise-reject-errors': 0,
    'prefer-rest-params': 0,
    'prefer-spread': 0,
    'prefer-template': 0,
    'vars-on-top': 0,
  },
  overrides: [
    {
      files: ['packages/ibm-gantt-chart-docs/src/**/*.stories.js'],
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'import/no-relative-packages': 0,
      },
    },
    {
      files: ['packages/ibm-gantt-chart-svelte/src/**/*.{ts,tsx}'],
      rules: {
        'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never', ts: 'never', tsx: 'never' }],
      },
    },
    {
      // Mocha tests rely on function context (this.timeout, this.skip, etc.)
      files: ['packages/*/test/**/*.test.js', 'packages/*/test/**/*.js'],
      rules: {
        'prefer-arrow-callback': 0,
      },
    },
    {
      // Webpack HMR uses module.hot, which import/no-import-module-exports mis-identifies as CommonJS export
      files: ['packages/ibm-gantt-chart/src/core/core.js', 'packages/ibm-gantt-chart/src/timetable/timetable.js'],
      rules: {
        'import/no-import-module-exports': 0,
        'import/no-cycle': 0,
        'no-constructor-return': 0,
      },
    },
    {
      // Abstract base classes are not React components; their methods are intentionally unused stubs
      files: ['packages/ibm-gantt-chart/src/core/base/**/*.js'],
      rules: {
        'import/no-cycle': 0,
        'react/no-unused-class-component-methods': 0,
        'react/sort-comp': 0,
        'no-empty-function': 0,
      },
    },
  ],
};
