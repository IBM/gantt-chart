// module.exports = require('gda-scripts/config/.stylelintrc.js');
module.exports = {
  extends: ['gda-scripts/config/.stylelintrc.js'].map(require.resolve),
  rules: {
    // TODO These rules are turned off until code refactoring makes it useless
    'no-descending-specificity': null,
  },
};
