import * as fs from 'fs';
import * as path from 'path';

const repo = path.resolve(__dirname, '..');
const DS_DIR = path.join('src', 'core', 'design-system');

// Files allowed to mention `fontWeight`. Keep empty unless there is a real reason.
const ALLOWLIST: string[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe('typography uses Bosko font families, not fontWeight', () => {
  // With a custom expo-font family, fontWeight >= 700 falls back to Roboto on
  // Android. Weight must be chosen through the family (FONT_FAMILY /
  // FONT_FAMILY_BY_WEIGHT or the design-system Text `weight` prop).
  it('has no fontWeight outside the design system', () => {
    const offenders = ['app', 'src']
      .flatMap((d) => walk(path.join(repo, d)))
      .map((f) => path.relative(repo, f))
      .filter((f) => !f.startsWith(DS_DIR))
      .filter((f) => !ALLOWLIST.includes(f.split(path.sep).join('/')))
      .filter((f) => /\bfontWeight\b/.test(fs.readFileSync(path.join(repo, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
