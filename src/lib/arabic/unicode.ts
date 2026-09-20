/**
 * Arabic + Uthmani-specific code points used by the Tajweed engine.
 * Naming follows the Unicode character names so the table can be checked
 * against the standard directly.
 */

// ── Base letters ────────────────────────────────────────────────────────────
export const HAMZA = 0x0621; // ء
export const ALEF_MADDA = 0x0622; // آ
export const ALEF_HAMZA_ABOVE = 0x0623; // أ
export const WAW_HAMZA = 0x0624; // ؤ
export const ALEF_HAMZA_BELOW = 0x0625; // إ
export const YEH_HAMZA = 0x0626; // ئ
export const ALEF = 0x0627; // ا
export const BEH = 0x0628; // ب
export const TEH_MARBUTA = 0x0629; // ة
export const TEH = 0x062a; // ت
export const THEH = 0x062b; // ث
export const JEEM = 0x062c; // ج
export const HAH = 0x062d; // ح
export const KHAH = 0x062e; // خ
export const DAL = 0x062f; // د
export const THAL = 0x0630; // ذ
export const REH = 0x0631; // ر
export const ZAIN = 0x0632; // ز
export const SEEN = 0x0633; // س
export const SHEEN = 0x0634; // ش
export const SAD = 0x0635; // ص
export const DAD = 0x0636; // ض
export const TAH = 0x0637; // ط
export const ZAH = 0x0638; // ظ
export const AIN = 0x0639; // ع
export const GHAIN = 0x063a; // غ
export const TATWEEL = 0x0640; // ـ
export const FEH = 0x0641; // ف
export const QAF = 0x0642; // ق
export const KAF = 0x0643; // ك
export const LAM = 0x0644; // ل
export const MEEM = 0x0645; // م
export const NOON = 0x0646; // ن
export const HEH = 0x0647; // ه
export const WAW = 0x0648; // و
export const ALEF_MAKSURA = 0x0649; // ى
export const YEH = 0x064a; // ي
export const ALEF_WASLA = 0x0671; // ٱ

// ── Marks ───────────────────────────────────────────────────────────────────
export const FATHATAN = 0x064b;
export const DAMMATAN = 0x064c;
export const KASRATAN = 0x064d;
export const FATHA = 0x064e;
export const DAMMA = 0x064f;
export const KASRA = 0x0650;
export const SHADDA = 0x0651;
export const SUKUN = 0x0652;
export const MADDAH_ABOVE = 0x0653; // ٓ  — obligatory/permissible madd marker
export const HAMZA_ABOVE = 0x0654;
export const HAMZA_BELOW = 0x0655;
export const SUPERSCRIPT_ALEF = 0x0670; // ٰ  — dagger alif, a 2-count madd

export const SMALL_HIGH_SEEN = 0x06dc;
export const SMALL_HIGH_ROUNDED_ZERO = 0x06df; // ۟ — always silent
export const SMALL_HIGH_UPRIGHT_ZERO = 0x06e0; // ۠ — silent when continuing
export const SMALL_HIGH_MEEM_ISOLATED = 0x06e2; // ۢ — iqlab marker
export const SMALL_LOW_SEEN = 0x06e3;
export const SMALL_WAW = 0x06e5; // ۥ — silah (2-count)
export const SMALL_YEH = 0x06e6; // ۦ — silah (2-count)
export const SMALL_HIGH_NOON = 0x06e8;
export const EMPTY_CENTRE_LOW_STOP = 0x06ea;
export const EMPTY_CENTRE_HIGH_STOP = 0x06eb;
export const ROUNDED_HIGH_STOP = 0x06ec;
export const SMALL_LOW_MEEM = 0x06ed;

export const END_OF_AYAH = 0x06dd;

const inRange = (c: number, a: number, b: number) => c >= a && c <= b;

/** Combining marks + Uthmani annotation signs (everything that is not a base). */
export function isMark(code: number): boolean {
  return (
    inRange(code, 0x064b, 0x065f) ||
    code === 0x0670 ||
    inRange(code, 0x06d6, 0x06dc) ||
    inRange(code, 0x06df, 0x06e8) ||
    inRange(code, 0x06ea, 0x06ed) ||
    code === 0x0640 // tatweel behaves as a non-letter for our purposes
  );
}

export function isArabicLetter(code: number): boolean {
  return (inRange(code, 0x0621, 0x064a) && code !== 0x0640) || code === ALEF_WASLA;
}

/** Any form of hamza that carries a real (qat') glottal stop. */
export const HAMZA_FORMS = new Set([HAMZA, ALEF_MADDA, ALEF_HAMZA_ABOVE, WAW_HAMZA, ALEF_HAMZA_BELOW, YEH_HAMZA]);

/** حروف الاستعلاء — always pronounced heavy. */
export const ISTILA_LETTERS = new Set([KHAH, SAD, DAD, GHAIN, TAH, QAF, ZAH]);

/** حروف القلقلة — قُطْبُ جَدٍّ */
export const QALQALAH_LETTERS = new Set([QAF, TAH, BEH, JEEM, DAL]);

/** The 15 letters of ikhfa haqiqi. */
export const IKHFA_LETTERS = new Set([TEH, THEH, JEEM, DAL, THAL, ZAIN, SEEN, SHEEN, SAD, DAD, TAH, ZAH, FEH, QAF, KAF]);

/** يرملون, split by whether a ghunnah is retained. */
export const IDGHAM_GHUNNAH_LETTERS = new Set([YEH, NOON, MEEM, WAW]);
export const IDGHAM_NO_GHUNNAH_LETTERS = new Set([LAM, REH]);

/** حروف الحلق — izhar halqi. */
export const HALQI_LETTERS = new Set([HAMZA, ALEF_HAMZA_ABOVE, ALEF_HAMZA_BELOW, HEH, AIN, HAH, GHAIN, KHAH]);

/** الحروف الشمسية — the lam of "ال" assimilates into these. */
export const SOLAR_LETTERS = new Set([TEH, THEH, DAL, THAL, REH, ZAIN, SEEN, SHEEN, SAD, DAD, TAH, ZAH, LAM, NOON]);

/** The four words where noon sakinah + و/ي stays clear (izhar mutlaq). */
export const IZHAR_MUTLAQ_ROOTS = ['دنيا', 'بنيان', 'صنوان', 'قنوان'];

/** Strips every mark, leaving bare letters — used for lookups + search. */
export function stripMarks(text: string): string {
  let out = '';
  for (const ch of text) {
    const c = ch.codePointAt(0)!;
    if (!isMark(c) && c !== END_OF_AYAH) out += ch;
  }
  return out.replace(/ٱ/g, 'ا');
}
