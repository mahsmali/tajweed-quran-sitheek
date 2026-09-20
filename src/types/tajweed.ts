import type { NoteKey, NoteParams } from '@/lib/i18n/notes/keys';

/**
 * ============================================================================
 *  TAJWEED DOMAIN MODEL
 * ============================================================================
 *  Everything the renderer needs to colour a glyph is expressed here. The
 *  engine (src/lib/tajweed/engine.ts) derives these values from raw Uthmani
 *  text — nothing in this file is ever hand-authored per verse.
 */

/** The five visual anchors from the unified colour-code spec (+ neutral). */
export type RuleFamily =
  | 'madd' // RED    — elongation
  | 'ghunnah' // GREEN  — nasalisation
  | 'qalqalah' // BLUE   — echo / bounce
  | 'makharij' // ORANGE — heavy vs light articulation
  | 'silent' // GREY   — written, not pronounced
  | 'izhar'; // INK    — clear, deliberately uncoloured

export type TajweedRuleId =
  // ── RED · Madd ───────────────────────────────────────────────────────────
  | 'madd_tabee' // natural, 2 counts
  | 'madd_badal' // hamza then madd letter, 2
  | 'madd_iwad' // tanween fath at waqf, 2
  | 'madd_silah_sughra' // ha' al-damir between vowels, 2
  | 'madd_lin' // layyin letter at waqf, 2–4–6
  | 'madd_aarid' // madd before an accidental sukun, 2–4–6
  | 'madd_muttasil' // madd + hamza, same word, 4–5
  | 'madd_munfasil' // madd + hamza, next word, 4–5
  | 'madd_silah_kubra' // silah + hamza, 4–5
  | 'madd_lazim_kalimi' // madd + sukun/shadda in a word, 6
  | 'madd_lazim_harfi' // muqatta'at letters, 6
  // ── GREEN · Ghunnah ──────────────────────────────────────────────────────
  | 'ghunnah_mushaddadah' // نّ / مّ
  | 'ikhfa' // noon sakinah + 15 letters
  | 'idgham_ghunnah' // noon sakinah + ي ن م و
  | 'iqlab' // noon sakinah + ب
  | 'ikhfa_shafawi' // meem sakinah + ب
  | 'idgham_shafawi' // meem sakinah + م
  // ── BLUE · Qalqalah ──────────────────────────────────────────────────────
  | 'qalqalah_sughra' // mid-word sukun
  | 'qalqalah_kubra' // at waqf
  | 'qalqalah_akbar' // at waqf with shadda
  // ── ORANGE · Makharij / weight ───────────────────────────────────────────
  | 'tafkheem_istila' // خ ص ض غ ط ق ظ
  | 'ra_tafkheem'
  | 'ra_tarqeeq'
  | 'lam_tafkheem' // lafz al-jalalah after fatha/damma
  | 'lam_tarqeeq' // lafz al-jalalah after kasra
  // ── GREY · Silent / merged ───────────────────────────────────────────────
  | 'idgham_no_ghunnah' // noon sakinah + ل ر
  | 'lam_shamsiyyah' // solar lam
  | 'hamzat_wasl' // connecting hamza, dropped mid-flow
  | 'silent_letter' // 06DF / 06E0 marked glyphs
  // ── INK · Izhar (clear) ──────────────────────────────────────────────────
  | 'izhar_halqi'
  | 'izhar_shafawi';

/** Articulation zones of the vocal tract (makhraj groups). */
export type MakhrajId =
  | 'jawf' // oral cavity — the madd letters
  | 'halq_aqsa' // deepest throat — ء هـ
  | 'halq_awsat' // mid throat   — ع ح
  | 'halq_adna' // near throat  — غ خ
  | 'lisan_aqsa' // back of tongue — ق
  | 'lisan_aqsa_asfal' // slightly forward — ك
  | 'lisan_wasat' // middle of tongue — ج ش ي
  | 'lisan_hafatan' // tongue edges — ض
  | 'lisan_hafa_adna' // edge + gums  — ل
  | 'lisan_taraf_noon' // tongue tip — ن
  | 'lisan_taraf_ra' // tongue tip, deeper — ر
  | 'lisan_tarf_nitaa' // tip + gum root — ط د ت
  | 'lisan_tarf_safir' // whistling — ص س ز
  | 'lisan_tarf_lithah' // tip + incisor edges — ظ ذ ث
  | 'shafatan_batn' // inner lip + teeth — ف
  | 'shafatan_meem' // both lips — ب م و
  | 'khayshum'; // nasal passage — all ghunnah

/** Static, human-readable metadata for one rule. Pure data, no per-verse info. */
export interface TajweedRule {
  id: TajweedRuleId;
  family: RuleFamily;
  /** English label shown in the UI. */
  label: string;
  /** Arabic name, rendered in the Uthmani face. */
  labelAr: string;
  /** Tailwind token name — always one of the six anchors. */
  colorToken: RuleFamily;
  /** Elongation length in harakat, when the rule is a madd. */
  counts?: number[];
  /** One line, shown inline next to a highlighted word. */
  summary: string;
  /** Full teaching text, shown in the inspector panel. */
  detail: string;
  /** Where in the vocal tract the learner should feel this rule. */
  makharij: MakhrajId[];
  /**
   * Conflict resolution weight. When two spans cover the same glyph the
   * higher priority decides the colour; both still appear in the breakdown.
   */
  priority: number;
  /** Curriculum day on which this rule is first formally taught. */
  introducedOnDay: number;
}

/**
 * A character range inside a single word that one rule applies to.
 * `start`/`end` index into `QuranWord.textUthmani` (end exclusive).
 */
export interface TajweedSpan {
  ruleId: TajweedRuleId;
  family: RuleFamily;
  start: number;
  end: number;
  /** The exact substring covered — kept for debugging + quiz explanations. */
  text: string;
  /**
   * The letter that *caused* the rule (e.g. the ب that triggers iqlab),
   * which may live in the next word.
   */
  trigger?: string;
  /** Madd length actually resolved for this occurrence. */
  counts?: number;
  /**
   * Engine-generated micro-explanation in English, e.g. "نْ before ت → ikhfa".
   * Kept so the API payload, SQL export and seed JSON stay self-describing.
   */
  note: string;
  /**
   * The same explanation as a translatable key plus parameters. The UI renders
   * this through `formatNote(locale, …)`; `note` is only the English fallback.
   */
  noteKey: NoteKey;
  noteParams: NoteParams;
}

/** Per-glyph render instruction produced by `resolveGlyphRuns`. */
export interface GlyphRun {
  text: string;
  family: RuleFamily | 'none';
  ruleIds: TajweedRuleId[];
  start: number;
  end: number;
}
