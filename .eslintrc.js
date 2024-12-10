// https://github.com/typescript-eslint/typescript-eslint/blob/main/docs/troubleshooting/typed-linting/index.mdx
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-loss-of-precision': 'warn',
    '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
  },
}
