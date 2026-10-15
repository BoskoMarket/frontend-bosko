import * as fs from 'fs';
import * as path from 'path';

const repo = path.resolve(__dirname, '..');
const DS_DIR = path.join('src', 'core', 'design-system');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe('native Alert is replaced by the design-system dialog', () => {
  it('has no Alert.alert / Alert.prompt outside the design system', () => {
    const offenders = ['app', 'src']
      .flatMap((d) => walk(path.join(repo, d)))
      .filter((f) => !path.relative(repo, f).startsWith(DS_DIR))
      .filter((f) => /\bAlert\.(alert|prompt)\s*\(/.test(fs.readFileSync(f, 'utf8')))
      .map((f) => path.relative(repo, f));
    expect(offenders).toEqual([]);
  });
});
