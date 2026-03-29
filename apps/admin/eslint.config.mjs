import js from '@eslint/js';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': hooks,
      '@next/next': next,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...hooks.configs.recommended.rules,
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-unused-vars': 'off',
      'no-console': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'dist/**'],
  },
];
