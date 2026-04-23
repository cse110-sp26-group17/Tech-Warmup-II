const sharedLanguageOptions = Object.freeze({
  ecmaVersion: 'latest',
  sourceType: 'module',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
});

const browserGlobals = Object.freeze({
  window: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  navigator: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  AudioContext: 'readonly',
  webkitAudioContext: 'readonly',
});

const testGlobals = Object.freeze({
  describe: 'readonly',
  it: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  vi: 'readonly',
});

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['tests/**/*.js', 'vitest.config.js', 'vite.config.js'],
    languageOptions: {
      ...sharedLanguageOptions,
      globals: browserGlobals,
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-redeclare': 'error',
      'no-implicit-globals': 'error',
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ...sharedLanguageOptions,
      globals: testGlobals,
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-redeclare': 'error',
    },
  },
];
