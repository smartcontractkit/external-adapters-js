// https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/README.md
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-explicit-any': ['error'],
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
}
