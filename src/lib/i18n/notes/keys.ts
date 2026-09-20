/**
 * Engine explanation notes, as keys rather than sentences.
 *
 * The engine used to build its per-span explanation by string concatenation in
 * English, which made those sentences the one part of the app that could never
 * be translated. It now emits a key plus structured parameters, and each locale
 * formats them. `TajweedSpan.note` still carries the English rendering so the
 * API payload, the SQL export and the seed JSON stay self-describing.
 */
export type NoteKey =
  // noon sakinah / tanween
  | 'ikhfa'
  | 'iqlab'
  | 'idgham_ghunnah'
  | 'idgham_no_ghunnah'
  | 'izhar_halqi'
  | 'izhar_mutlaq'
  // meem sakinah
  | 'ikhfa_shafawi'
  | 'idgham_shafawi'
  | 'izhar_shafawi'
  // doubled nasals
  | 'ghunnah_mushaddadah'
  // qalqalah
  | 'qalqalah_sughra'
  | 'qalqalah_kubra'
  | 'qalqalah_akbar'
  // madd
  | 'madd_iwad'
  | 'silah_sughra'
  | 'silah_kubra'
  | 'lazim_harfi'
  | 'madd_lin'
  | 'lazim_kalimi'
  | 'muttasil'
  | 'munfasil'
  | 'aarid'
  | 'badal'
  | 'tabee'
  // weight
  | 'istila'
  | 'ra_haraka_heavy'
  | 'ra_haraka_light'
  | 'ra_no_prev'
  | 'ra_wasl_heavy'
  | 'ra_kasra_then_istila'
  | 'ra_sakin_kasra_light'
  | 'ra_after_sakin_yeh'
  | 'ra_sakin_heavy'
  | 'lam_light'
  | 'lam_heavy'
  // silent
  | 'silent_always'
  | 'silent_continuing'
  | 'hamzat_wasl'
  | 'lam_shamsiyyah';

export type Vowel = 'fatha' | 'damma' | 'kasra';

/** What produced the nasal sound: a bare noon, or one of the three tanween. */
export type NoonSource = 'noon' | 'tanween_fath' | 'tanween_damm' | 'tanween_kasr';

export interface NoteParams {
  /** The triggering or affected Arabic letter, e.g. "ب". Never translated. */
  letter?: string;
  /** Which short vowel governs the ruling. */
  vowel?: Vowel;
  /** Whether the noon came from a letter or a tanween. */
  src?: NoonSource;
  /** For madd lazim: was the obstacle a shadda or a written sukun? */
  obstacle?: 'shadda' | 'sukun';
}

/** Substitute {placeholders} in a template. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? `{${k}}`);
}
