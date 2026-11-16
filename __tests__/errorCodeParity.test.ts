import { readFileSync } from 'fs';
import { join } from 'path';
import { ERROR_MESSAGES } from '@/lib/error-messages';

/**
 * docs/backend-openapi.json does not list error codes (only DTO schemas), so the
 * parity source is the backend error contract in docs/frontend-error-contract.md.
 * Every backticked UPPER_SNAKE code there must exist in the catalog, or be in
 * the allowlist below with a reason.
 */
const ALLOWLIST: Record<string, string> = {
  VALIDATION_ERROR: 'Handled in getUserErrorMessage/getFormErrors from details[] (VALIDATION_ERROR_MESSAGE as generic copy).',
};

const doc = readFileSync(join(__dirname, '..', 'docs', 'frontend-error-contract.md'), 'utf8');
const codes = [...new Set([...doc.matchAll(/`([A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+)`/g)].map((m) => m[1]))];

test('the error contract doc lists codes', () => {
  expect(codes.length).toBeGreaterThan(50);
});

test('every backend error code in the contract has catalog copy or an allowlist reason', () => {
  const missing = codes.filter((c) => !(c in ERROR_MESSAGES) && !(c in ALLOWLIST));
  expect(missing).toEqual([]);
});

test('allowlist entries are real, still missing from the catalog and justified', () => {
  for (const [code, reason] of Object.entries(ALLOWLIST)) {
    expect(codes).toContain(code);
    expect(ERROR_MESSAGES).not.toHaveProperty(code);
    expect(reason.length).toBeGreaterThan(10);
  }
});
