/**
 * Verification harness for the recitation comparison logic.
 *
 *   npm run test:audio
 *
 * These are the assertions that would otherwise require a microphone, a
 * browser and a human reciting into it. Keeping the judgement in pure
 * functions is what makes them checkable at all.
 *
 * It also exercises the i18n layer end to end: the same analysis is rendered
 * in English, Tamil and Sinhala, which is what proves the dictionaries are
 * actually wired up rather than merely present on disk.
 */
import {
  compareDurations,
  envelopeShape,
  envelopeThirds,
  formatMsShort,
} from '../src/lib/audio/compare';
import { announcementText, durationText, envelopeText, verdictText } from '../src/lib/audio/describe';
import { getTranslator } from '../src/lib/i18n';
import { LOCALE_ORDER } from '../src/lib/i18n/config';
import { analyzeVerse } from '../src/lib/tajweed/engine';

let passed = 0;
let failed = 0;

function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? passed++ : failed++;
  console.log(
    ok
      ? `  \x1b[32m✓\x1b[0m ${name}`
      : `  \x1b[31m✗\x1b[0m ${name}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`,
  );
}

function checkThat(name: string, cond: boolean, detail = '') {
  cond ? passed++ : failed++;
  console.log(cond ? `  \x1b[32m✓\x1b[0m ${name}` : `  \x1b[31m✗\x1b[0m ${name} ${detail}`);
}

/** Build a signal whose energy sits where we ask, for envelope tests. */
function signal(shape: 'front' | 'middle' | 'end' | 'even' | 'dip' | 'silent', n = 3000): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let amp = 0;
    switch (shape) {
      case 'front': amp = t < 0.33 ? 1 : 0.05; break;
      case 'middle': amp = t > 0.33 && t < 0.66 ? 1 : 0.05; break;
      case 'end': amp = t > 0.66 ? 1 : 0.05; break;
      case 'even': amp = 1; break;
      case 'dip': amp = t > 0.36 && t < 0.63 ? 0.02 : 1; break;
      case 'silent': amp = 0; break;
    }
    out[i] = amp * Math.sin(i * 0.2);
  }
  return out;
}

console.log('\n\x1b[1mcompareDurations\x1b[0m');
check('identical durations match', compareDurations(1000, 1000).verdict, 'match');
check('10% longer still matches', compareDurations(1000, 1100).verdict, 'match');
check('24% longer still matches', compareDurations(1000, 1240).verdict, 'match');
check('30% longer is too long', compareDurations(1000, 1300).verdict, 'long');
check('half length is too short', compareDurations(1000, 500).verdict, 'short');
check('21% shorter is too short', compareDurations(1000, 790).verdict, 'short');
check('10% shorter still matches', compareDurations(1000, 900).verdict, 'match');
check('null master is unknown', compareDurations(null, 900).verdict, 'unknown');
check('null user is unknown', compareDurations(900, null).verdict, 'unknown');
check('zero duration is unknown', compareDurations(0, 900).verdict, 'unknown');
check('negative duration is unknown', compareDurations(900, -5).verdict, 'unknown');

console.log('\n\x1b[1mverdict carries a non-colour symbol\x1b[0m');
check('short symbol', compareDurations(1000, 400).symbol, '↓');
check('long symbol', compareDurations(1000, 2000).symbol, '↑');
check('match symbol', compareDurations(1000, 1000).symbol, '✓');
checkThat(
  'every verdict has a distinct symbol',
  new Set([
    compareDurations(1000, 400).symbol,
    compareDurations(1000, 2000).symbol,
    compareDurations(1000, 1000).symbol,
    compareDurations(null, null).symbol,
  ]).size === 4,
);

console.log('\n\x1b[1mdelta, ratio and percentage\x1b[0m');
check('delta is user minus master', compareDurations(800, 1200).deltaMs, 400);
check('negative delta when short', compareDurations(1200, 800).deltaMs, -400);
check('ratio is user over master', compareDurations(1000, 1500).ratio, 1.5);
check('pctOff is absolute deviation', compareDurations(1000, 1500).pctOff, 50);
check('pctOff when short', compareDurations(1000, 500).pctOff, 50);

console.log('\n\x1b[1menvelopeThirds + envelopeShape\x1b[0m');
checkThat('thirds sum to ~1', Math.abs(envelopeThirds(signal('even')).reduce((a, b) => a + b, 0) - 1) < 1e-6);
check('silence returns zeros', envelopeThirds(signal('silent')), [0, 0, 0]);
check('silence', envelopeShape(envelopeThirds(signal('silent'))), 'silent');
check('end-weighted = held madd', envelopeShape(envelopeThirds(signal('end'))), 'end');
check('front-weighted = clipped', envelopeShape(envelopeThirds(signal('front'))), 'front');
check('middle-weighted', envelopeShape(envelopeThirds(signal('middle'))), 'middle');
check('dip = collapsing ghunnah', envelopeShape(envelopeThirds(signal('dip'))), 'dip');
check('even spread', envelopeShape(envelopeThirds(signal('even'))), 'even');
checkThat('tiny buffers do not throw', envelopeThirds(new Float32Array(2)).length === 3);

console.log('\n\x1b[1mformatting\x1b[0m');
check('short form ms', formatMsShort(820), '820 ms');
check('short form s', formatMsShort(1500), '1.50 s');
check('short form unknown', formatMsShort(null), '—');

console.log('\n\x1b[1mEnglish rendering\x1b[0m');
const en = getTranslator('en');
check('sub-second reads in ms', durationText(en, 820), '820 milliseconds');
check('over a second reads in s', durationText(en, 1500), '1.50 seconds');
check('unknown duration', durationText(en, null), 'unknown');
const longer = announcementText(en, compareDurations(1000, 1400), 1000, 1400);
checkThat('announces direction', longer.includes('longer than'), longer);
checkThat('announces both durations', longer.includes('1.40 seconds') && longer.includes('1.00 seconds'), longer);
checkThat('includes the coaching detail', longer.includes('over-stretching'), longer);
const shorter = announcementText(en, compareDurations(1000, 500), 1000, 500);
checkThat('announces shorter direction', shorter.includes('shorter than'), shorter);
checkThat(
  'unknown comparison still announces something useful',
  announcementText(en, compareDurations(null, null), null, null).includes('could not be measured'),
);

console.log('\n\x1b[1mi18n wiring — every locale renders, and differs\x1b[0m');
for (const loc of LOCALE_ORDER) {
  const tr = getTranslator(loc);
  const v = verdictText(tr, compareDurations(1000, 500));
  const ann = announcementText(tr, compareDurations(1000, 500), 1000, 500);
  checkThat(`[${loc}] verdict headline is non-empty`, v.headline.length > 0, v.headline);
  checkThat(`[${loc}] verdict detail is non-empty`, v.detail.length > 0);
  checkThat(`[${loc}] announcement is non-empty`, ann.length > 20);
  checkThat(`[${loc}] envelope sentence resolves`, (envelopeText(tr, 'dip') ?? '').length > 10);
  checkThat(`[${loc}] rule label resolves`, tr.rule('madd_muttasil').label.length > 0);
  checkThat(`[${loc}] zone cue resolves`, tr.zone('khayshum').cue.length > 0);
  checkThat(`[${loc}] day 1 brief resolves`, (tr.day(1)?.brief.length ?? 0) > 20);
  checkThat(`[${loc}] day 30 brief resolves`, (tr.day(30)?.brief.length ?? 0) > 20);
  checkThat(`[${loc}] phase title resolves`, tr.phase('mastery').title.length > 0);
  // No missing-key markers should survive into rendered output.
  checkThat(`[${loc}] no unresolved {placeholders}`, !/\{[a-z]+\}/i.test(ann), ann);
}

const enDay = getTranslator('en').day(1)!;
const taDay = getTranslator('ta').day(1)!;
const siDay = getTranslator('si').day(1)!;
checkThat('Tamil day 1 differs from English', taDay.brief !== enDay.brief);
checkThat('Sinhala day 1 differs from English', siDay.brief !== enDay.brief);
checkThat('Tamil and Sinhala differ from each other', taDay.brief !== siDay.brief);
checkThat('Arabic titles are never translated', taDay.titleAr === enDay.titleAr);

console.log('\n\x1b[1mengine notes are translatable\x1b[0m');
const spans = analyzeVerse('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'.split(/\s+/)).flat();
checkThat('engine produced spans', spans.length > 0, String(spans.length));
checkThat('every span carries a note key', spans.every((s) => !!s.noteKey));
checkThat('every span keeps its English note', spans.every((s) => s.note.length > 0));
for (const loc of LOCALE_ORDER) {
  const tr = getTranslator(loc);
  const rendered = spans.map((s) => tr.note(s));
  checkThat(`[${loc}] every note renders`, rendered.every((r) => r.length > 0));
  checkThat(`[${loc}] no unresolved {placeholders} in notes`, rendered.every((r) => !/\{[a-z]+\}/i.test(r)));
}
checkThat(
  'Tamil notes differ from English notes',
  getTranslator('ta').note(spans[0]) !== getTranslator('en').note(spans[0]),
);

console.log(`\n${failed === 0 ? '\x1b[32m' : '\x1b[31m'}${passed} passed, ${failed} failed\x1b[0m\n`);
process.exit(failed === 0 ? 0 : 1);
