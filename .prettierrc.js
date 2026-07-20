module.exports = {
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'es5',
  overrides: [
    {
      files: '.*rc',
      options: {
        parser: 'json',
      },
    },
  ],
};
