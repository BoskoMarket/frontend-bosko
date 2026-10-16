// Counts hardcoded design values (no-restricted-syntax hits from the design-system
// guard in eslint.config.mjs). Usage: npm run lint:ds [-- --top N]
import { ESLint } from 'eslint';
import path from 'node:path';

const topArg = process.argv.indexOf('--top');
const top = topArg > -1 ? Number(process.argv[topArg + 1]) : 15;

const eslint = new ESLint();
const results = await eslint.lintFiles(['src', 'app']);

const perFile = results
  .map((r) => ({
    file: path.relative(process.cwd(), r.filePath).replaceAll('\\', '/'),
    count: r.messages.filter((m) => m.ruleId === 'no-restricted-syntax').length,
  }))
  .filter((r) => r.count > 0)
  .sort((a, b) => b.count - a.count);

const total = perFile.reduce((sum, r) => sum + r.count, 0);

for (const r of perFile.slice(0, top)) console.log(`${String(r.count).padStart(4)}  ${r.file}`);
console.log(`\nDesign-system violations: ${total} in ${perFile.length} files`);
