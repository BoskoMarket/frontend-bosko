import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['src/core/api/generated/**', 'node_modules/**', 'dist-check/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
);
