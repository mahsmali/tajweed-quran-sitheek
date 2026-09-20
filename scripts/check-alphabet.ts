/**
 * Do Āl-‘Imrān 3:154 and Al-Fath 48:29 really contain every Arabic letter?
 *
 * These two verses are traditionally cited as each containing all 28 letters
 * of the alphabet, which would make them the ideal makharij practice set —
 * every articulation point exercised in a single reading. Worth checking
 * rather than repeating.
 */
import { stripMarks } from '../src/lib/arabic/unicode';
import { makhrajForLetter, MAKHRAJ_ZONES } from '../src/lib/tajweed/makharij';
import { analyzeVerse, uniqueRuleIds } from '../src/lib/tajweed/engine';
import { getRule } from '../src/lib/tajweed/rules';
import type { MakhrajId } from '../src/types/tajweed';

const API = 'https://api.quran.com/api/v4';

/** The 28 letters, in alphabetical order. Hamza is counted separately. */
const ALPHABET = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'.split('');

/** Normalise the orthographic variants onto their base letter. */
function normalise(ch: string): string {
  const map: Record<string, string> = {
    'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي',
  };
  return map[ch] ?? ch;
}

/**
 * Fetched through `by_chapter` — the same endpoint the app's ingestion uses.
 * `by_key` segments words slightly differently, so checking against it would
 * verify a text the reader never actually displays.
 */
async function fetchVerse(key: string): Promise<string[]> {
  const [surah, ayah] = key.split(':').map(Number);
  const r = await fetch(
    `${API}/verses/by_chapter/${surah}?words=true&per_page=300&word_fields=text_uthmani&fields=text_uthmani`,
  ).then((x) => x.json());
  const verse = r.verses.find((v: { verse_number: number }) => v.verse_number === ayah);
  // Returned as an array, not a joined string: re-splitting on whitespace
  // over-counts (a few Uthmani words carry an internal space) and would hand
  // the engine different word boundaries than the app uses — which changes
  // every cross-word rule, madd munfasil and idgham included.
  return verse.words
    .filter((w: { char_type_name: string }) => w.char_type_name === 'word')
    .map((w: { text_uthmani: string }) => w.text_uthmani);
}

async function main() {
  for (const key of ['3:154', '48:29']) {
    const words = await fetchVerse(key);
    const text = words.join(' ');
    const letters = Array.from(stripMarks(text)).filter((c) => c.trim()).map(normalise);
    const present = new Set(letters);

    const missing = ALPHABET.filter((l) => !present.has(l));
    const hasHamza = present.has('ء') || /[ءأإؤئآ]/.test(text);

    // Which articulation zones does it exercise?
    const zones = new Set<MakhrajId>();
    for (const ch of letters) {
      const z = makhrajForLetter(ch.codePointAt(0)!);
      if (z) zones.add(z);
    }

    const spans = analyzeVerse(words);
    const rules = new Set(spans.flatMap((s) => uniqueRuleIds(s)));

    console.log(`\n\x1b[1m${key}\x1b[0m  (${words.length} words, ${letters.length} letters)`);
    console.log(`  alphabet coverage : ${ALPHABET.length - missing.length}/28`);
    console.log(
      missing.length === 0
        ? '  \x1b[32m✓ contains every letter of the Arabic alphabet\x1b[0m'
        : `  \x1b[31m✗ missing: ${missing.join(' ')}\x1b[0m`,
    );
    console.log(`  hamza present     : ${hasHamza ? 'yes' : 'no'}`);
    console.log(`  makharij zones    : ${zones.size}/${Object.keys(MAKHRAJ_ZONES).length}`);
    console.log(`  tajweed rules     : ${rules.size}`);
    console.log(`    ${[...rules].map((r) => getRule(r).label).join(', ')}`);
  }
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
