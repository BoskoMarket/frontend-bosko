import tseslint from 'typescript-eslint';

// Design-system guard: outside src/core/design-system/ every color and font must
// come from tokens (tc.*, TOKENS, GRADIENTS, FONT_FAMILY, PREMIUM...). See CLAUDE.md.
// Severity is 'warn' while screens are migrated; switch to 'error' when the
// count from `npm run lint:ds` reaches 0.
const DS_MESSAGE = 'Hardcoded design value. Use design-system tokens/components (or add the token to src/core/design-system first).';

export const DS_RESTRICTED_SYNTAX = [
  { selector: 'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]', message: `${DS_MESSAGE} (hex color)` },
  { selector: 'Literal[value=/^(rgb|rgba|hsl|hsla)\\(/]', message: `${DS_MESSAGE} (rgb/hsl color)` },
  { selector: 'TemplateElement[value.raw=/(rgb|rgba|hsl|hsla)\\(/]', message: `${DS_MESSAGE} (rgb/hsl color)` },
  { selector: 'Property[key.name=/([cC]olor|tint)$/] > Literal[value=/^(?!transparent$)[a-z]+$/]', message: `${DS_MESSAGE} (named color)` },
  { selector: 'JSXAttribute[name.name=/([cC]olor|tint)$/] > Literal[value=/^(?!transparent$)[a-z]+$/]', message: `${DS_MESSAGE} (named color)` },
  { selector: 'Property[key.name="fontFamily"] > Literal', message: `${DS_MESSAGE} (use FONT_FAMILY / TYPE_SCALE)` },
];

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
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    ignores: ['src/core/design-system/**'],
    rules: {
      'no-restricted-syntax': ['warn', ...DS_RESTRICTED_SYNTAX],
    },
  },
);
