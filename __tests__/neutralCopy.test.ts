import * as fs from 'fs';
import * as path from 'path';

// Product decision: one neutral Spanish ("tú") for Argentina and Colombia. No voseo in user-facing copy.
const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'generated']);

const VOSEO_WORDS = [
  'pod[eé]s', 'quer[eé]s', 'ten[eé]s', 'sab[eé]s', 'hac[eé]s', 'ven[ií]', 'mir[á]', 'eleg[í]', 'ingres[á]',
  'inici[á]', 'contact[á]', 'mejor[á]', 'cre[á]', 'sub[í]', 'toc[á]', 'seleccion[á]', 'agreg[á]', 'edit[á]',
  'revis[á]', 'prob[á]', 'esper[á]', 'intent[á]', 'volv[é]', 'cerr[á]', 'confirm[á]', 'verific[á]', 'escrib[í]',
  'acept[á]', 'carg[á]', 'guard[á]', 'dej[á]', 'us[á]', 'elimin[á]', 'calific[á]', 'respond[é]', 'activ[á]',
  'complet[á]', 'abr[í]', 'busc[á]', 'compart[í]', 'descubr[í]', 'empez[á]', 'segu[í]', 'cambi[á]', 'mand[á]',
  'envi[á]', 'llam[á]', 'ped[í]', 'asegurate', 'registrate', 'fijate', 'acordate', 'quedate', 'avisame', 'vos',
  'sos', 'acá', 'decime', 'contame', 'escribime', 'anotate', 'descargá', 'ponete', 'aparecé', 'disfrut[á]',
  'conect[á]', 'unite', 'sumate',
  // extra forms found while sweeping
  'necesit[á]s', 'prefer[í]s', 'tard[á]s', 'declar[á]s', 'comprom[e]t[é]s', 'cotiz[á]s', 'hac[é]', 'mantené',
  'contá', 'contanos', 'hacelo', 'mostrá', 'sumá', 'coordiná', 'presioná', 'reintentá', 'actualizá', 'publicá',
  'recibí', 'vení', 'encontrá', 'solicitá', 'indicá', 'tomá', 'permití', 'grabá', 'ganá', 'llegá', 'borrá',
  'configurá', 'desbloqueá', 'deslizá', 'arrastrá', 'explorá', 'contratá', 'conseguí', 'construí', 'accedé',
];

// Accent-sensitive entries (sabés/hacés) must keep the accent: "sabes"/"haces" are valid tú forms.
const ACCENT_ONLY = [/^sab\[eé\]s$/, /^hac\[eé\]s$/];
const words = VOSEO_WORDS.map((w) => (ACCENT_ONLY.some((r) => r.test(w)) ? w.replace('[eé]', 'é') : w));
const LB = String.raw`(?<![\p{L}\p{N}_])`;
const LA = String.raw`(?![\p{L}\p{N}_])`;
const VOSEO = new RegExp(`${LB}(?:${words.join("|")})${LA}`, "u");

function collect(dir: string, out: string[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collect(path.join(dir, entry.name), out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }
}

describe('neutral Spanish copy', () => {
  it('has no voseo in src/ or app/', () => {
    const files: string[] = [];
    collect(path.join(ROOT, 'src'), files);
    collect(path.join(ROOT, 'app'), files);

    const offenders: string[] = [];
    for (const file of files) {
      fs.readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          const t = line.trim();
          if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
          if (VOSEO.test(line.toLowerCase())) offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${t}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
