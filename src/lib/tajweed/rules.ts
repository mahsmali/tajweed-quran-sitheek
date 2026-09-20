import type { RuleFamily, TajweedRule, TajweedRuleId } from '@/types/tajweed';

/** Tailwind class fragments per family — the only place colour is mapped. */
export const FAMILY_STYLE: Record<
  RuleFamily,
  { text: string; bg: string; ring: string; dot: string; label: string; hex: string }
> = {
  madd: { text: 'text-madd', bg: 'bg-madd/10', ring: 'ring-madd/40', dot: 'bg-madd', label: 'Madd · Elongation', hex: '#C2323C' },
  ghunnah: { text: 'text-ghunnah', bg: 'bg-ghunnah/10', ring: 'ring-ghunnah/40', dot: 'bg-ghunnah', label: 'Ghunnah · Nasalisation', hex: '#0E7A52' },
  qalqalah: { text: 'text-qalqalah', bg: 'bg-qalqalah/10', ring: 'ring-qalqalah/40', dot: 'bg-qalqalah', label: 'Qalqalah · Echo', hex: '#1D5BD6' },
  makharij: { text: 'text-makharij', bg: 'bg-makharij/10', ring: 'ring-makharij/40', dot: 'bg-makharij', label: 'Makharij · Heavy / Light', hex: '#96500F' },
  silent: { text: 'text-silent', bg: 'bg-silent/10', ring: 'ring-silent/40', dot: 'bg-silent', label: 'Silent · Merged', hex: '#79746C' },
  izhar: { text: 'text-izhar', bg: 'bg-ink/5', ring: 'ring-ink/20', dot: 'bg-muted', label: 'Izhar · Clear', hex: '#1B1815' },
};

export const FAMILY_ORDER: RuleFamily[] = ['madd', 'ghunnah', 'qalqalah', 'makharij', 'silent', 'izhar'];

const R = (r: TajweedRule) => r;

export const TAJWEED_RULES: Record<TajweedRuleId, TajweedRule> = {
  // ══ RED · MADD ════════════════════════════════════════════════════════════
  madd_tabee: R({
    id: 'madd_tabee', family: 'madd', colorToken: 'madd', priority: 70, introducedOnDay: 8,
    label: 'Madd Tabee‘i (Natural)', labelAr: 'المد الطبيعي', counts: [2],
    summary: 'Hold the vowel for exactly 2 counts.',
    detail:
      'A madd letter (ا after fatha, و after damma, ي after kasra) with no hamza and no sukun following it. This is the baseline length — every other madd is measured against it.',
    makharij: ['jawf'],
  }),
  madd_badal: R({
    id: 'madd_badal', family: 'madd', colorToken: 'madd', priority: 70, introducedOnDay: 20,
    label: 'Madd Badal (Substitute)', labelAr: 'مد البدل', counts: [2],
    summary: 'Hamza first, then the elongation — 2 counts.',
    detail: 'A hamza precedes the madd letter (ءَامَنَ, أُوتُوا). Because the hamza comes before rather than after, the madd stays at its natural 2 counts.',
    makharij: ['jawf', 'halq_aqsa'],
  }),
  madd_iwad: R({
    id: 'madd_iwad', family: 'madd', colorToken: 'madd', priority: 70, introducedOnDay: 21,
    label: 'Madd ‘Iwad (Compensation)', labelAr: 'مد العوض', counts: [2],
    summary: 'Tanween fath at a stop becomes a 2-count alif.',
    detail: 'When stopping on a word ending in tanween fath, the tanween is dropped and replaced by a 2-count alif — the alif compensates for the lost noon sound.',
    makharij: ['jawf'],
  }),
  madd_silah_sughra: R({
    id: 'madd_silah_sughra', family: 'madd', colorToken: 'madd', priority: 70, introducedOnDay: 22,
    label: 'Madd Silah Sughra (Minor Link)', labelAr: 'مد الصلة الصغرى', counts: [2],
    summary: 'The ه of a pronoun stretches 2 counts into the next word.',
    detail: 'A ha\' al-damir sitting between two vowelled letters is linked with a hidden و or ي (written in the Uthmani script as ۥ or ۦ) and held for 2 counts.',
    makharij: ['jawf', 'halq_aqsa'],
  }),
  madd_lin: R({
    id: 'madd_lin', family: 'madd', colorToken: 'madd', priority: 70, introducedOnDay: 23,
    label: 'Madd Lin (Soft)', labelAr: 'مد اللين', counts: [2, 4, 6],
    summary: 'Soft و/ي before a stop — 2, 4 or 6 counts.',
    detail: 'A sakin و or ي preceded by a fatha (خَوْف, بَيْت). It is only lengthened when you stop on the word; while continuing it stays short.',
    makharij: ['jawf', 'shafatan_meem'],
  }),
  madd_aarid: R({
    id: 'madd_aarid', family: 'madd', colorToken: 'madd', priority: 72, introducedOnDay: 9,
    label: 'Madd ‘Arid lis-Sukun', labelAr: 'المد العارض للسكون', counts: [2, 4, 6],
    summary: 'Madd before a stop — choose 2, 4 or 6 and stay consistent.',
    detail: 'The sukun here is accidental: it exists only because you chose to stop. Any of 2, 4 or 6 counts is permissible, but keep one length for the whole recitation session.',
    makharij: ['jawf'],
  }),
  madd_muttasil: R({
    id: 'madd_muttasil', family: 'madd', colorToken: 'madd', priority: 76, introducedOnDay: 10,
    label: 'Madd Muttasil (Connected)', labelAr: 'المد المتصل', counts: [4, 5],
    summary: 'Madd + hamza in the SAME word — obligatory 4–5 counts.',
    detail: 'The madd letter and the hamza share one word (جَآءَ, سُوٓءٌ). Lengthening is compulsory; every recitation school gives it at least 4 counts.',
    makharij: ['jawf', 'halq_aqsa'],
  }),
  madd_munfasil: R({
    id: 'madd_munfasil', family: 'madd', colorToken: 'madd', priority: 74, introducedOnDay: 11,
    label: 'Madd Munfasil (Separated)', labelAr: 'المد المنفصل', counts: [4, 5],
    summary: 'Madd ends a word, hamza starts the next — 4–5 counts.',
    detail: 'The madd letter finishes one word and a hamza opens the following word (فِى أَنفُسِكُمْ). It is permissible rather than obligatory, so it may also be read at 2 counts in some routes.',
    makharij: ['jawf', 'halq_aqsa'],
  }),
  madd_silah_kubra: R({
    id: 'madd_silah_kubra', family: 'madd', colorToken: 'madd', priority: 74, introducedOnDay: 22,
    label: 'Madd Silah Kubra (Major Link)', labelAr: 'مد الصلة الكبرى', counts: [4, 5],
    summary: 'Pronoun ه followed by a hamza — 4–5 counts.',
    detail: 'The same linking madd as silah sughra, but the next word begins with a hamza, so it takes the length of madd munfasil.',
    makharij: ['jawf', 'halq_aqsa'],
  }),
  madd_lazim_kalimi: R({
    id: 'madd_lazim_kalimi', family: 'madd', colorToken: 'madd', priority: 80, introducedOnDay: 12,
    label: 'Madd Lazim Kalimi (Necessary)', labelAr: 'المد اللازم الكلمي', counts: [6],
    summary: 'Madd meeting a permanent sukun or shadda — a full 6 counts.',
    detail: 'The sukun after the madd letter is original and permanent (ٱلضَّآلِّينَ, ٱلْحَآقَّةُ). Six counts, no alternatives.',
    makharij: ['jawf'],
  }),
  madd_lazim_harfi: R({
    id: 'madd_lazim_harfi', family: 'madd', colorToken: 'madd', priority: 80, introducedOnDay: 24,
    label: 'Madd Lazim Harfi (Letter)', labelAr: 'المد اللازم الحرفي', counts: [6],
    summary: 'Disjointed opening letters held for 6 counts.',
    detail: 'In the muqatta‘at (الٓمٓ, نٓ, قٓ) certain letters spell out to three sounds whose middle is a madd meeting a sukun — giving a necessary 6 counts.',
    makharij: ['jawf'],
  }),

  // ══ GREEN · GHUNNAH ═══════════════════════════════════════════════════════
  ghunnah_mushaddadah: R({
    id: 'ghunnah_mushaddadah', family: 'ghunnah', colorToken: 'ghunnah', priority: 90, introducedOnDay: 3,
    label: 'Ghunnah Mushaddadah', labelAr: 'الغنة المشددة', counts: [2],
    summary: 'نّ or مّ — hum through the nose for 2 counts.',
    detail: 'Any noon or meem carrying a shadda is the most complete ghunnah there is. The sound resonates in the nasal passage (khayshum), not in the mouth.',
    makharij: ['khayshum', 'lisan_taraf_noon', 'shafatan_meem'],
  }),
  ikhfa: R({
    id: 'ikhfa', family: 'ghunnah', colorToken: 'ghunnah', priority: 92, introducedOnDay: 5,
    label: 'Ikhfa Haqiqi (Hiding)', labelAr: 'الإخفاء الحقيقي', counts: [2],
    summary: 'Noon hidden into a nasal hum before 15 letters.',
    detail: 'The noon sakinah or tanween is neither fully clear nor fully merged: the tongue does not touch its articulation point, and the sound is held in the nose for 2 counts while the mouth prepares the next letter.',
    makharij: ['khayshum'],
  }),
  idgham_ghunnah: R({
    id: 'idgham_ghunnah', family: 'ghunnah', colorToken: 'ghunnah', priority: 92, introducedOnDay: 6,
    label: 'Idgham with Ghunnah', labelAr: 'الإدغام بغنة', counts: [2],
    summary: 'Noon merges into ي ن م و and keeps the hum.',
    detail: 'The noon disappears completely into the following letter, which doubles — but the nasal resonance is carried over for 2 counts.',
    makharij: ['khayshum'],
  }),
  iqlab: R({
    id: 'iqlab', family: 'ghunnah', colorToken: 'ghunnah', priority: 92, introducedOnDay: 7,
    label: 'Iqlab (Conversion)', labelAr: 'الإقلاب', counts: [2],
    summary: 'Noon turns into a hidden meem before ب.',
    detail: 'Before a ب the noon sakinah or tanween converts to a meem, pronounced with the lips barely touching and a 2-count ghunnah. The Uthmani script prints a small ۢ above the noon.',
    makharij: ['khayshum', 'shafatan_meem'],
  }),
  ikhfa_shafawi: R({
    id: 'ikhfa_shafawi', family: 'ghunnah', colorToken: 'ghunnah', priority: 90, introducedOnDay: 13,
    label: 'Ikhfa Shafawi (Labial Hiding)', labelAr: 'الإخفاء الشفوي', counts: [2],
    summary: 'Meem sakinah before ب — light lips, 2-count hum.',
    detail: 'A sakin meem followed by ب. The lips come together only lightly, without pressure, and the ghunnah is held for 2 counts.',
    makharij: ['khayshum', 'shafatan_meem'],
  }),
  idgham_shafawi: R({
    id: 'idgham_shafawi', family: 'ghunnah', colorToken: 'ghunnah', priority: 90, introducedOnDay: 13,
    label: 'Idgham Shafawi (Labial Merging)', labelAr: 'الإدغام الشفوي', counts: [2],
    summary: 'Meem into meem — one doubled, humming letter.',
    detail: 'A sakin meem followed by another meem. The two become a single doubled meem with a complete 2-count ghunnah.',
    makharij: ['khayshum', 'shafatan_meem'],
  }),

  // ══ BLUE · QALQALAH ═══════════════════════════════════════════════════════
  qalqalah_sughra: R({
    id: 'qalqalah_sughra', family: 'qalqalah', colorToken: 'qalqalah', priority: 84, introducedOnDay: 4,
    label: 'Qalqalah Sughra (Minor)', labelAr: 'القلقلة الصغرى',
    summary: 'A light bounce in the middle of a word.',
    detail: 'One of قُطْبُ جَدٍّ carrying an original sukun inside the word. Release the letter with a small, dry echo — no vowel may be added.',
    makharij: ['lisan_aqsa', 'lisan_tarf_nitaa', 'shafatan_meem', 'lisan_wasat'],
  }),
  qalqalah_kubra: R({
    id: 'qalqalah_kubra', family: 'qalqalah', colorToken: 'qalqalah', priority: 86, introducedOnDay: 4,
    label: 'Qalqalah Kubra (Major)', labelAr: 'القلقلة الكبرى',
    summary: 'A fuller bounce when you stop on the letter.',
    detail: 'The qalqalah letter is the last letter of the word you stop on. Because it is now sakin by choice, the echo is noticeably stronger than sughra.',
    makharij: ['lisan_aqsa', 'lisan_tarf_nitaa', 'shafatan_meem', 'lisan_wasat'],
  }),
  qalqalah_akbar: R({
    id: 'qalqalah_akbar', family: 'qalqalah', colorToken: 'qalqalah', priority: 88, introducedOnDay: 4,
    label: 'Qalqalah Akbar (Greatest)', labelAr: 'القلقلة الأكبر',
    summary: 'Strongest bounce — stopping on a doubled letter.',
    detail: 'You stop on a qalqalah letter that carries a shadda (بِٱلْحَقِّ, تَبَّ). The letter is doubled and then released with the most pronounced echo of the three.',
    makharij: ['lisan_aqsa', 'lisan_tarf_nitaa', 'shafatan_meem', 'lisan_wasat'],
  }),

  // ══ ORANGE · MAKHARIJ / WEIGHT ════════════════════════════════════════════
  tafkheem_istila: R({
    id: 'tafkheem_istila', family: 'makharij', colorToken: 'makharij', priority: 50, introducedOnDay: 2,
    label: 'Tafkheem — Isti‘la Letter', labelAr: 'التفخيم (حروف الاستعلاء)',
    summary: 'خ ص ض غ ط ق ظ — always heavy.',
    detail: 'The back of the tongue rises toward the palate, filling the mouth with sound. These seven letters are never read lightly, whatever vowel they carry.',
    makharij: ['lisan_aqsa', 'lisan_tarf_safir', 'lisan_hafatan', 'halq_adna', 'lisan_tarf_nitaa', 'lisan_tarf_lithah'],
  }),
  ra_tafkheem: R({
    id: 'ra_tafkheem', family: 'makharij', colorToken: 'makharij', priority: 52, introducedOnDay: 14,
    label: 'Ra Tafkheem (Heavy Ra)', labelAr: 'تفخيم الراء',
    summary: 'Heavy ر — after fatha or damma.',
    detail: 'Ra is read heavy when it carries a fatha or damma, or when it is sakin after a fatha or damma. The tongue body raises and the vowel colour darkens toward "aw".',
    makharij: ['lisan_taraf_ra'],
  }),
  ra_tarqeeq: R({
    id: 'ra_tarqeeq', family: 'makharij', colorToken: 'makharij', priority: 52, introducedOnDay: 14,
    label: 'Ra Tarqeeq (Light Ra)', labelAr: 'ترقيق الراء',
    summary: 'Light ر — with kasra, or sakin after kasra.',
    detail: 'Ra is read light when it carries a kasra, or is sakin after an original kasra, or is sakin after a sakin ي. The tongue stays low and the sound thins.',
    makharij: ['lisan_taraf_ra'],
  }),
  lam_tafkheem: R({
    id: 'lam_tafkheem', family: 'makharij', colorToken: 'makharij', priority: 52, introducedOnDay: 15,
    label: 'Heavy Lam of Allah', labelAr: 'تفخيم لام لفظ الجلالة',
    summary: 'اللَّه after fatha or damma — heavy lam.',
    detail: 'The lam in the name of Allah is pronounced heavy when the preceding letter carries a fatha or damma (قَالَ ٱللَّهُ, عَبْدُ ٱللَّهِ).',
    makharij: ['lisan_hafa_adna'],
  }),
  lam_tarqeeq: R({
    id: 'lam_tarqeeq', family: 'makharij', colorToken: 'makharij', priority: 52, introducedOnDay: 15,
    label: 'Light Lam of Allah', labelAr: 'ترقيق لام لفظ الجلالة',
    summary: 'بِسْمِ ٱللَّه after kasra — light lam.',
    detail: 'When the letter before the name of Allah carries a kasra, the lam is read light (بِسْمِ ٱللَّهِ, لِلَّهِ).',
    makharij: ['lisan_hafa_adna'],
  }),

  // ══ GREY · SILENT / MERGED ════════════════════════════════════════════════
  idgham_no_ghunnah: R({
    id: 'idgham_no_ghunnah', family: 'silent', colorToken: 'silent', priority: 94, introducedOnDay: 6,
    label: 'Idgham without Ghunnah', labelAr: 'الإدغام بغير غنة',
    summary: 'Noon vanishes completely into ل or ر.',
    detail: 'The noon sakinah or tanween merges into a following ل or ر with no nasal residue at all — the noon is simply gone.',
    makharij: ['lisan_hafa_adna', 'lisan_taraf_ra'],
  }),
  lam_shamsiyyah: R({
    id: 'lam_shamsiyyah', family: 'silent', colorToken: 'silent', priority: 60, introducedOnDay: 17,
    label: 'Lam Shamsiyyah (Solar Lam)', labelAr: 'اللام الشمسية',
    summary: 'The ل of "ال" is written but not said.',
    detail: 'Before the fourteen solar letters the lam of the definite article assimilates into the next letter, which then carries a shadda (ٱلشَّمْس, not al-shams).',
    makharij: ['lisan_hafa_adna'],
  }),
  hamzat_wasl: R({
    id: 'hamzat_wasl', family: 'silent', colorToken: 'silent', priority: 58, introducedOnDay: 18,
    label: 'Hamzat al-Wasl', labelAr: 'همزة الوصل',
    summary: 'ٱ is dropped when you come to it mid-flow.',
    detail: 'The connecting hamza is only pronounced when you begin speech with it. Joined to what came before, it is skipped entirely and the reading flows straight through.',
    makharij: ['halq_aqsa'],
  }),
  silent_letter: R({
    id: 'silent_letter', family: 'silent', colorToken: 'silent', priority: 96, introducedOnDay: 18,
    label: 'Silent Letter', labelAr: 'حرف لا يُنطق',
    summary: 'Written in the rasm, never pronounced.',
    detail: 'The Uthmani script preserves letters that the recitation does not sound — the alif of وا, أَنَا۠, لَا۠ — marked by a small circle ۟ above the glyph.',
    makharij: [],
  }),

  // ══ INK · IZHAR ═══════════════════════════════════════════════════════════
  izhar_halqi: R({
    id: 'izhar_halqi', family: 'izhar', colorToken: 'izhar', priority: 10, introducedOnDay: 5,
    label: 'Izhar Halqi (Clear)', labelAr: 'الإظهار الحلقي',
    summary: 'Noon stays crisp before the six throat letters.',
    detail: 'Before ء ه ع ح غ خ the noon sakinah is pronounced clearly with no nasalisation and no merging. Deliberately left uncoloured so the eye learns "no colour = no change".',
    makharij: ['lisan_taraf_noon', 'halq_aqsa', 'halq_awsat', 'halq_adna'],
  }),
  izhar_shafawi: R({
    id: 'izhar_shafawi', family: 'izhar', colorToken: 'izhar', priority: 10, introducedOnDay: 13,
    label: 'Izhar Shafawi', labelAr: 'الإظهار الشفوي',
    summary: 'Meem sakinah stays clear before all but ب and م.',
    detail: 'A sakin meem before any letter other than ب or م is pronounced plainly, with the lips fully closed and no extra hum.',
    makharij: ['shafatan_meem'],
  }),
};

export const ALL_RULES: TajweedRule[] = Object.values(TAJWEED_RULES);

export const RULES_BY_FAMILY: Record<RuleFamily, TajweedRule[]> = FAMILY_ORDER.reduce(
  (acc, fam) => {
    acc[fam] = ALL_RULES.filter((r) => r.family === fam);
    return acc;
  },
  {} as Record<RuleFamily, TajweedRule[]>,
);

export const getRule = (id: TajweedRuleId): TajweedRule => TAJWEED_RULES[id];
