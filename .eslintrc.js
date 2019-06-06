// module.exports = require('gda-scripts/config/.eslintrc.js');
module.exports = {
  extends: ['gda-scripts/config/.eslintrc.js'].map(require.resolve),
  env: {
    mocha: true,
    jquery: true, // TODO should be replaced by proper import $ from 'jquery'
  },
  globals: {
    chai: 'readonly',
    NAME: 'readonly',
    VERSION: 'readonly',
  },
  rules: {
    // TODO These rules are turned off until code refactoring makes it useless
    'class-methods-use-this': 0,
    'consistent-return': 0,
    'func-names': 0, // brute force to replace /function\(\) {/\(\) => {/ breaks tests
    'new-cap': 0,
    'no-cond-assign': 0,
    'no-console': 0,
    'no-continue': 0,
    'no-extend-native': 0,
    'no-multi-assign': 0,
    'no-mixed-operators': 0,
    'no-nested-ternary': 0,
    'no-param-reassign': 0,
    'no-plusplus': 0,
    'no-shadow': 0,
    'no-restricted-globals': 0,
    'no-restricted-syntax': 0,
    'no-throw-literal': 0,
    'no-undef': 0,
    'no-underscore-dangle': 0,
    'no-unused-expressions': 0,
    'no-unused-vars': 0,
    'no-use-before-define': 0,
    'no-useless-constructor': 0,
    'no-var': 0, // brute force replacement /var/let/ breaks tests
    'one-var': 0,
    'prefer-destructuring': 0,
    'prefer-promise-reject-errors': 0,
    'prefer-rest-params': 0,
    'prefer-spread': 0,
    'prefer-template': 0,
    'vars-on-top': 0,
  },
};
