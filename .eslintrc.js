module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    mocha: true,
  },
  extends: ['standard'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  ignorePatterns: ['node_modules/', 'dist/'],
  rules: {
    'standard/no-callback-literal': 0,
  },
}
