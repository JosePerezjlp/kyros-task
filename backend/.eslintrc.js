module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Express error handlers need the 4-argument signature even when `next` is unused
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Layer boundary: controllers and services must not import Prisma directly
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@prisma/client', '../../../node_modules/@prisma/client'],
            message:
              'Prisma client must only be imported in the repository layer (src/repositories/).',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Allow Prisma imports only in repositories and the prisma directory
      files: ['src/repositories/**/*.ts', 'prisma/**/*.ts'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      // Services must not import Express types
      files: ['src/services/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['express', '@types/express'],
                message:
                  'Services must not import Express objects (Request, Response, NextFunction, Router). Keep services framework-agnostic.',
              },
              {
                group: ['@prisma/client'],
                message:
                  'Prisma client must only be imported in the repository layer.',
              },
            ],
          },
        ],
      },
    },
  ],
  env: {
    node: true,
    es2020: true,
  },
  ignorePatterns: ['dist/', 'node_modules/'],
};
