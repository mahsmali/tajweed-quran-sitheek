import type { CurriculumPhase, DailyMilestone, PhaseMeta } from '@/types/curriculum';

/**
 * ============================================================================
 *  THE 30-DAY TAJWEED MASTERY ROADMAP
 * ============================================================================
 *  Ten to fifteen minutes a day. Every day names the rules it activates, and
 *  those ids are the only thing the lesson screen needs: the engine colours
 *  the practice verses automatically and the quiz builds itself from the same
 *  list. Adding a day is a data edit, never a code change.
 */

export const PHASES: PhaseMeta[] = [
  { id: 'foundation', title: 'Foundation', blurb: 'Where the sounds are made, and the two that bounce or hum.', days: [1, 4] },
  { id: 'nasal', title: 'The Nasal Family', blurb: 'Noon and meem — every green rule in the Qur’an.', days: [5, 7] },
  { id: 'elongation', title: 'The Madd Ladder', blurb: 'From a 2-count hold to a full 6.', days: [8, 12] },
  { id: 'weight', title: 'Weight & Silence', blurb: 'Heavy against light, and the letters you never say.', days: [13, 19] },
  { id: 'mastery', title: 'Mastery', blurb: 'The rare madds, waqf, and reading whole surahs unaided.', days: [20, 30] },
];

const M = (m: DailyMilestone) => m;

export const CURRICULUM: DailyMilestone[] = [
  M({
    day: 1, phase: 'foundation', focusFamily: 'makharij', estimatedMinutes: 12, unlocksAfter: null,
    title: 'The Map of the Mouth', titleAr: 'مخارج الحروف',
    objective: 'Locate all five articulation regions and feel where each one sits.',
    brief:
      'Every Arabic letter has one home. Before any rule makes sense you need the map: the empty cavity (jawf), the throat (halq), the tongue (lisan), the lips (shafatan), and the nose (khayshum). Open any word below and press the anatomy button — the diagram lights up the exact point for the letter you tapped.',
    ruleIds: [], makharij: ['jawf', 'halq_aqsa', 'halq_awsat', 'halq_adna', 'lisan_taraf_noon', 'shafatan_meem', 'khayshum'],
    practice: [
      { surah: 1, from: 1, to: 7, label: 'Al-Fatihah 1–7' },
      // Contains all 28 letters — a complete tour of the mouth in one verse.
      { surah: 48, from: 29, to: 29, label: 'Al-Fath 29 · every letter' },
    ],
    drill: { prompt: 'Which word contains a throat letter?', ruleIds: [], questionCount: 6 },
    checkpoints: ['I can name the five regions', 'I can feel the difference between ح and هـ', 'I found the khayshum buzz on نّ'],
  }),
  M({
    day: 2, phase: 'foundation', focusFamily: 'makharij', estimatedMinutes: 12, unlocksAfter: 1,
    title: 'Heavy and Light Letters', titleAr: 'التفخيم والترقيق',
    objective: 'Recognise the seven isti‘la letters on sight and thicken them correctly.',
    brief:
      'Seven letters — خ ص ض غ ط ق ظ — are always read heavy: the back of the tongue lifts and the sound fills the mouth. Everything else stays light. This single contrast is the fastest audible improvement most beginners make.',
    ruleIds: ['tafkheem_istila'], makharij: ['lisan_aqsa', 'lisan_hafatan', 'halq_adna', 'lisan_tarf_safir'],
    practice: [
      { surah: 1, from: 6, to: 7, label: 'Al-Fatihah 6–7' },
      { surah: 113, from: 1, to: 5, label: 'Al-Falaq 1–5' },
    ],
    drill: { prompt: 'Click the word with a heavy (isti‘la) letter!', ruleIds: ['tafkheem_istila'], questionCount: 8 },
    checkpoints: ['I can list all seven heavy letters', 'My ص no longer sounds like س', 'I keep ك light next to ق'],
  }),
  M({
    day: 3, phase: 'foundation', focusFamily: 'ghunnah', estimatedMinutes: 10, unlocksAfter: 2,
    title: 'Ghunnah Mushaddadah', titleAr: 'الغنة المشددة',
    objective: 'Hold a true 2-count nasal hum on every نّ and مّ.',
    brief:
      'Any noon or meem carrying a shadda is held for two counts in the nose. Pinch your nostrils while you say إِنَّ — if nothing changes, the sound is coming from your mouth and the ghunnah is missing.',
    ruleIds: ['ghunnah_mushaddadah'], makharij: ['khayshum', 'lisan_taraf_noon', 'shafatan_meem'],
    practice: [
      { surah: 114, from: 1, to: 6, label: 'An-Nas 1–6' },
      { surah: 103, from: 2, to: 2, label: 'Al-‘Asr 2' },
    ],
    drill: { prompt: 'Click the word that contains a Ghunnah!', ruleIds: ['ghunnah_mushaddadah'], questionCount: 8 },
    checkpoints: ['I hold exactly 2 counts', 'The hum stops when I pinch my nose', 'I do not add a vowel after نّ'],
  }),
  M({
    day: 4, phase: 'foundation', focusFamily: 'qalqalah', estimatedMinutes: 12, unlocksAfter: 3,
    title: 'Qalqalah — The Echo', titleAr: 'القلقلة',
    objective: 'Bounce ق ط ب ج د cleanly, and grade the bounce by position.',
    brief:
      'قُطْبُ جَدٍّ collects the five letters that echo when they are sakin. Minor inside a word, major when you stop on one, greatest when you stop on a doubled one. The echo is dry — never let it become "qad-a".',
    ruleIds: ['qalqalah_sughra', 'qalqalah_kubra', 'qalqalah_akbar'], makharij: ['lisan_aqsa', 'lisan_tarf_nitaa', 'shafatan_meem', 'lisan_wasat'],
    practice: [
      { surah: 112, from: 1, to: 4, label: 'Al-Ikhlas 1–4' },
      { surah: 113, from: 1, to: 5, label: 'Al-Falaq 1–5' },
    ],
    drill: { prompt: 'Click the word that contains a Qalqalah!', ruleIds: ['qalqalah_sughra', 'qalqalah_kubra', 'qalqalah_akbar'], questionCount: 8 },
    checkpoints: ['I can recite قُطْبُ جَدٍّ from memory', 'My bounce adds no vowel', 'Kubra is louder than sughra'],
  }),
  M({
    day: 5, phase: 'nasal', focusFamily: 'ghunnah', estimatedMinutes: 14, unlocksAfter: 4,
    title: 'Noon Sakinah I — Izhar & Ikhfa', titleAr: 'الإظهار والإخفاء',
    objective: 'Decide instantly whether a noon sakinah is clear or hidden.',
    brief:
      'A noon with no vowel looks at the next letter. Before the six throat letters it stays perfectly clear (izhar — left uncoloured here on purpose). Before fifteen other letters it disappears into a two-count nasal hum while the mouth shapes the next letter (ikhfa).',
    ruleIds: ['ikhfa', 'izhar_halqi'], makharij: ['khayshum', 'lisan_taraf_noon', 'halq_awsat'],
    practice: [
      { surah: 113, from: 2, to: 5, label: 'Al-Falaq 2–5' },
      { surah: 103, from: 2, to: 2, label: 'Al-‘Asr 2' },
    ],
    drill: { prompt: 'Click the word where the Noon is hidden (Ikhfa)!', ruleIds: ['ikhfa'], questionCount: 8 },
    checkpoints: ['I know the six throat letters', 'My ikhfa tongue never touches the gums', 'I hold the hum for 2 counts'],
  }),
  M({
    day: 6, phase: 'nasal', focusFamily: 'ghunnah', estimatedMinutes: 14, unlocksAfter: 5,
    title: 'Noon Sakinah II — Idgham', titleAr: 'الإدغام',
    objective: 'Merge the noon into ي ن م و with a hum, and into ل ر without one.',
    brief:
      'يرملون splits in two. Before ي ن م و the noon vanishes into the next letter but the nasal hum carries over. Before ل and ر it vanishes with no trace at all — which is why those appear grey here, in the "written but not pronounced" colour.',
    ruleIds: ['idgham_ghunnah', 'idgham_no_ghunnah'], makharij: ['khayshum', 'lisan_hafa_adna', 'lisan_taraf_ra'],
    practice: [
      { surah: 112, from: 4, to: 4, label: 'Al-Ikhlas 4' },
      { surah: 110, from: 1, to: 3, label: 'An-Nasr 1–3' },
    ],
    drill: { prompt: 'Click the word where the Noon merges away!', ruleIds: ['idgham_ghunnah', 'idgham_no_ghunnah'], questionCount: 8 },
    checkpoints: ['I can split يرملون correctly', 'No hum at all before ل and ر', 'The next letter doubles'],
  }),
  M({
    day: 7, phase: 'nasal', focusFamily: 'ghunnah', estimatedMinutes: 10, unlocksAfter: 6,
    title: 'Noon Sakinah III — Iqlab', titleAr: 'الإقلاب',
    objective: 'Convert a noon to a hidden meem before ب.',
    brief:
      'One letter, one rule. Before ب the noon becomes a meem with the lips barely touching, plus a two-count hum. The Uthmani script even prints a tiny ۢ above the noon to tell you.',
    ruleIds: ['iqlab'], makharij: ['khayshum', 'shafatan_meem'],
    practice: [
      { surah: 110, from: 3, to: 3, label: 'An-Nasr 3' },
      { surah: 104, from: 1, to: 4, label: 'Al-Humazah 1–4' },
    ],
    drill: { prompt: 'Click the word where the Noon turns into a Meem!', ruleIds: ['iqlab'], questionCount: 6 },
    checkpoints: ['I spot the ۢ marker', 'My lips only kiss, they do not press', 'The hum lasts 2 counts'],
  }),
  M({
    day: 8, phase: 'elongation', focusFamily: 'madd', estimatedMinutes: 12, unlocksAfter: 7,
    title: 'Madd Tabee‘i — The 2-Count Baseline', titleAr: 'المد الطبيعي',
    objective: 'Hold every natural madd for exactly two counts — no more, no less.',
    brief:
      'ا after a fatha, و after a damma, ي after a kasra. Two counts is your ruler; every longer madd is measured against it. Rushing this is the single most common fault in beginner recitation.',
    ruleIds: ['madd_tabee'], makharij: ['jawf'],
    practice: [
      { surah: 1, from: 1, to: 7, label: 'Al-Fatihah 1–7' },
      { surah: 114, from: 1, to: 6, label: 'An-Nas 1–6' },
    ],
    drill: { prompt: 'Click the word that contains a Madd!', ruleIds: ['madd_tabee'], questionCount: 8 },
    checkpoints: ['I count 1-2 consistently', 'I do not shorten madd at speed', 'I do not stretch past 2'],
  }),
  M({
    day: 9, phase: 'elongation', focusFamily: 'madd', estimatedMinutes: 12, unlocksAfter: 8,
    title: 'Madd ‘Arid lis-Sukun', titleAr: 'المد العارض للسكون',
    objective: 'Choose one length for verse endings and keep it all session.',
    brief:
      'When you stop at the end of a verse, the final letter becomes sakin and the madd before it may be held 2, 4 or 6 counts. All three are correct — mixing them at random is not. Pick one and stay there.',
    ruleIds: ['madd_aarid'], makharij: ['jawf'],
    practice: [
      { surah: 1, from: 1, to: 7, label: 'Al-Fatihah 1–7' },
      { surah: 114, from: 1, to: 6, label: 'An-Nas 1–6' },
    ],
    drill: { prompt: 'Click the word that ends in Madd ‘Arid!', ruleIds: ['madd_aarid'], questionCount: 6 },
    checkpoints: ['I picked my length', 'Every verse ending matches it', 'I hear the difference from 2 counts'],
  }),
  M({
    day: 10, phase: 'elongation', focusFamily: 'madd', estimatedMinutes: 12, unlocksAfter: 9,
    title: 'Madd Muttasil — Connected', titleAr: 'المد المتصل',
    objective: 'Give an obligatory 4–5 counts when madd meets hamza inside a word.',
    brief:
      'جَآءَ. The madd letter and the hamza live in the same word, so the stretch is compulsory — never less than four counts, in every reading.',
    ruleIds: ['madd_muttasil'], makharij: ['jawf', 'halq_aqsa'],
    practice: [
      { surah: 110, from: 1, to: 1, label: 'An-Nasr 1' },
      { surah: 105, from: 1, to: 5, label: 'Al-Fil 1–5' },
    ],
    drill: { prompt: 'Click the word with a 4-count connected Madd!', ruleIds: ['madd_muttasil'], questionCount: 6 },
    checkpoints: ['I reach at least 4 counts', 'The hamza is still crisp afterwards', 'I can spot the ٓ marker'],
  }),
  M({
    day: 11, phase: 'elongation', focusFamily: 'madd', estimatedMinutes: 12, unlocksAfter: 10,
    title: 'Madd Munfasil — Separated', titleAr: 'المد المنفصل',
    objective: 'Stretch across a word boundary without breaking the flow.',
    brief:
      'The madd ends one word and a hamza opens the next. Same 4–5 counts as muttasil in Hafs, but permissible rather than obligatory — and it disappears entirely if you stop between the two words.',
    ruleIds: ['madd_munfasil'], makharij: ['jawf', 'halq_aqsa'],
    practice: [
      { surah: 108, from: 1, to: 3, label: 'Al-Kawthar 1–3' },
      { surah: 107, from: 1, to: 7, label: 'Al-Ma‘un 1–7' },
    ],
    drill: { prompt: 'Click the word that starts a separated Madd!', ruleIds: ['madd_munfasil'], questionCount: 6 },
    checkpoints: ['I join the two words smoothly', 'My length matches my muttasil', 'I drop it when I stop'],
  }),
  M({
    day: 12, phase: 'elongation', focusFamily: 'madd', estimatedMinutes: 14, unlocksAfter: 11,
    title: 'Madd Lazim — The Full Six', titleAr: 'المد اللازم الكلمي',
    objective: 'Deliver a steady six counts where the sukun is permanent.',
    brief:
      'ٱلضَّآلِّينَ. The sukun after the madd is original, not a by-product of stopping — so six counts is the only option. Count them out loud until the length is automatic.',
    ruleIds: ['madd_lazim_kalimi'], makharij: ['jawf'],
    practice: [
      { surah: 1, from: 7, to: 7, label: 'Al-Fatihah 7' },
      { surah: 101, from: 1, to: 11, label: 'Al-Qari‘ah 1–11' },
    ],
    drill: { prompt: 'Click the word with a 6-count necessary Madd!', ruleIds: ['madd_lazim_kalimi'], questionCount: 5 },
    checkpoints: ['I hold a full 6', 'The length never wobbles', 'I can tell lazim from ‘arid'],
  }),
  M({
    day: 13, phase: 'weight', focusFamily: 'ghunnah', estimatedMinutes: 12, unlocksAfter: 12,
    title: 'Meem Sakinah', titleAr: 'أحكام الميم الساكنة',
    objective: 'Apply all three meem rules without hesitating.',
    brief:
      'A sakin meem has only three futures: hidden before ب, merged before another م, and plainly clear before everything else. Simpler than the noon — and a fast win.',
    ruleIds: ['ikhfa_shafawi', 'idgham_shafawi', 'izhar_shafawi'], makharij: ['shafatan_meem', 'khayshum'],
    practice: [
      { surah: 112, from: 3, to: 4, label: 'Al-Ikhlas 3–4' },
      { surah: 1, from: 2, to: 7, label: 'Al-Fatihah 2–7' },
    ],
    drill: { prompt: 'Click the word with a hidden or merged Meem!', ruleIds: ['ikhfa_shafawi', 'idgham_shafawi'], questionCount: 6 },
    checkpoints: ['Lips close fully for izhar', 'Lips only kiss for ikhfa shafawi', 'I hum on both green cases'],
  }),
  M({
    day: 14, phase: 'weight', focusFamily: 'makharij', estimatedMinutes: 15, unlocksAfter: 13,
    title: 'The Ra Letter', titleAr: 'أحكام الراء',
    objective: 'Decide heavy or light for every ر you meet.',
    brief:
      'Ra is the most conditional letter in Tajweed. Fatha or damma on it, or before it when sakin, makes it heavy. A kasra on it, or an original kasra before it when sakin, makes it light. Tap any ر below and the panel spells out which branch applied.',
    ruleIds: ['ra_tafkheem', 'ra_tarqeeq'], makharij: ['lisan_taraf_ra'],
    practice: [
      { surah: 103, from: 1, to: 3, label: 'Al-‘Asr 1–3' },
      { surah: 108, from: 1, to: 3, label: 'Al-Kawthar 1–3' },
      { surah: 114, from: 1, to: 6, label: 'An-Nas 1–6' },
    ],
    drill: { prompt: 'Click the word with a LIGHT Ra (tarqeeq)!', ruleIds: ['ra_tarqeeq'], questionCount: 8 },
    checkpoints: ['I never roll the ر', 'I can justify each heavy ر', 'I spot the kasra exception'],
  }),
  M({
    day: 15, phase: 'weight', focusFamily: 'makharij', estimatedMinutes: 10, unlocksAfter: 14,
    title: 'The Lam of Allah', titleAr: 'لام لفظ الجلالة',
    objective: 'Switch the lam of ٱللَّه between heavy and light by the vowel before it.',
    brief:
      'One rule, no exceptions: a kasra before the name of Allah makes the lam light (بِسْمِ ٱللَّهِ), a fatha or damma makes it heavy (نَصْرُ ٱللَّهِ). Nothing else in Arabic behaves this way.',
    ruleIds: ['lam_tafkheem', 'lam_tarqeeq'], makharij: ['lisan_hafa_adna'],
    practice: [
      { surah: 1, from: 1, to: 2, label: 'Al-Fatihah 1–2' },
      { surah: 110, from: 1, to: 3, label: 'An-Nasr 1–3' },
      { surah: 112, from: 1, to: 2, label: 'Al-Ikhlas 1–2' },
    ],
    drill: { prompt: 'Click the word where the Lam of Allah is HEAVY!', ruleIds: ['lam_tafkheem'], questionCount: 6 },
    checkpoints: ['I check the vowel before', 'بِسْمِ ٱللَّهِ is light', 'نَصْرُ ٱللَّهِ is heavy'],
  }),
  M({
    day: 16, phase: 'weight', focusFamily: 'ghunnah', estimatedMinutes: 15, unlocksAfter: 15,
    title: 'Consolidation I — Days 1 to 15', titleAr: 'المراجعة الأولى',
    objective: 'Read a full short surah applying every rule met so far.',
    brief:
      'No new material. Read Al-Falaq and An-Nas end to end at a steady pace, then use the quiz to find the rule you are slowest to spot. Whatever you miss twice, revisit that day before moving on.',
    ruleIds: ['ikhfa', 'idgham_ghunnah', 'iqlab', 'ghunnah_mushaddadah', 'qalqalah_sughra', 'qalqalah_kubra', 'madd_tabee', 'ra_tafkheem', 'ra_tarqeeq', 'tafkheem_istila'],
    makharij: ['khayshum', 'lisan_taraf_ra', 'lisan_aqsa'],
    practice: [
      { surah: 113, from: 1, to: 5, label: 'Al-Falaq 1–5' },
      { surah: 114, from: 1, to: 6, label: 'An-Nas 1–6' },
    ],
    drill: { prompt: 'Mixed review — find the rule named above!', ruleIds: ['ikhfa', 'qalqalah_kubra', 'ghunnah_mushaddadah', 'madd_tabee', 'ra_tarqeeq'], questionCount: 10 },
    checkpoints: ['I read both surahs unaided', 'I scored 80%+ on the drill', 'I know my weakest rule'],
  }),
  M({
    day: 17, phase: 'weight', focusFamily: 'silent', estimatedMinutes: 12, unlocksAfter: 16,
    title: 'Solar and Lunar Lam', titleAr: 'اللام الشمسية والقمرية',
    objective: 'Drop the lam of "ال" before the fourteen solar letters.',
    brief:
      'ٱلشَّمْس is read ash-shams, not al-shams: the lam is written but silent, and the solar letter doubles. ٱلْقَمَر keeps its lam because ق is lunar. The shadda on the next letter is your give-away.',
    ruleIds: ['lam_shamsiyyah'], makharij: ['lisan_hafa_adna'],
    practice: [
      { surah: 1, from: 1, to: 7, label: 'Al-Fatihah 1–7' },
      { surah: 114, from: 1, to: 6, label: 'An-Nas 1–6' },
    ],
    drill: { prompt: 'Click the word with a silent (solar) Lam!', ruleIds: ['lam_shamsiyyah'], questionCount: 8 },
    checkpoints: ['I look for the shadda', 'I never say al-shams', 'I keep lunar lam clear'],
  }),
  M({
    day: 18, phase: 'weight', focusFamily: 'silent', estimatedMinutes: 12, unlocksAfter: 17,
    title: 'Silent Letters and Hamzat al-Wasl', titleAr: 'همزة الوصل والحروف الصامتة',
    objective: 'Skip every letter the rasm writes but the tongue does not say.',
    brief:
      'The Uthmani script preserves spellings the recitation drops: the alif of قَالُوا۟, the connecting ٱ in mid-flow. A small circle ۟ marks the permanent ones. Grey in this app always means "your voice does nothing here".',
    ruleIds: ['silent_letter', 'hamzat_wasl'], makharij: ['halq_aqsa'],
    practice: [
      { surah: 103, from: 3, to: 3, label: 'Al-‘Asr 3' },
      { surah: 1, from: 1, to: 7, label: 'Al-Fatihah 1–7' },
    ],
    drill: { prompt: 'Click the word containing a silent letter!', ruleIds: ['silent_letter'], questionCount: 6 },
    checkpoints: ['I spot the ۟ circle', 'I join through ٱ smoothly', 'I start correctly on ٱ after a pause'],
  }),
  M({
    day: 19, phase: 'weight', focusFamily: 'madd', estimatedMinutes: 15, unlocksAfter: 18,
    title: 'Al-Fatihah, Fully Coded', titleAr: 'تطبيق الفاتحة',
    objective: 'Recite Al-Fatihah with every rule applied and self-verified.',
    brief:
      'The surah you say seventeen times a day. Record yourself word by word in the reader, compare each waveform against the reciter, and fix anything that drifts more than a beat.',
    ruleIds: ['madd_tabee', 'madd_aarid', 'madd_lazim_kalimi', 'lam_shamsiyyah', 'lam_tarqeeq', 'lam_tafkheem', 'ra_tafkheem', 'izhar_halqi', 'izhar_shafawi', 'hamzat_wasl', 'tafkheem_istila'],
    makharij: ['jawf', 'lisan_hafa_adna', 'lisan_taraf_ra'],
    practice: [{ surah: 1, from: 1, to: 7, label: 'Al-Fatihah 1–7' }],
    drill: { prompt: 'Al-Fatihah review — find the named rule!', ruleIds: ['madd_aarid', 'lam_shamsiyyah', 'madd_lazim_kalimi', 'tafkheem_istila'], questionCount: 10 },
    checkpoints: ['I recited it unaided', 'My ٱلضَّآلِّينَ is a full 6', 'My waveforms line up'],
  }),
  M({
    day: 20, phase: 'mastery', focusFamily: 'madd', estimatedMinutes: 10, unlocksAfter: 19,
    title: 'Madd Badal', titleAr: 'مد البدل',
    objective: 'Keep the madd at 2 when the hamza comes first.',
    brief:
      'ءَامَنَ, أُوتُوا, إِيمَان. Because the hamza precedes rather than follows, there is no extra stretch — it stays at the natural two counts. Learners routinely over-lengthen these.',
    ruleIds: ['madd_badal'], makharij: ['jawf', 'halq_aqsa'],
    practice: [
      { surah: 103, from: 3, to: 3, label: 'Al-‘Asr 3' },
      { surah: 114, from: 3, to: 3, label: 'An-Nas 3' },
    ],
    drill: { prompt: 'Click the word with Madd Badal!', ruleIds: ['madd_badal'], questionCount: 5 },
    checkpoints: ['I hold only 2 counts', 'I hear the hamza first', 'I do not confuse it with muttasil'],
  }),
  M({
    day: 21, phase: 'mastery', focusFamily: 'madd', estimatedMinutes: 10, unlocksAfter: 20,
    title: 'Madd ‘Iwad', titleAr: 'مد العوض',
    objective: 'Turn a final tanween fath into a clean 2-count alif when stopping.',
    brief:
      'Stop on أَفْوَاجًا and the "-an" becomes "-aa". The alif compensates for the noon you dropped. It applies only to tanween fath, and only when you actually stop.',
    ruleIds: ['madd_iwad'], makharij: ['jawf'],
    practice: [
      { surah: 110, from: 2, to: 3, label: 'An-Nasr 2–3' },
      { surah: 106, from: 1, to: 4, label: 'Quraysh 1–4' },
    ],
    drill: { prompt: 'Click the word ending in Madd ‘Iwad!', ruleIds: ['madd_iwad'], questionCount: 5 },
    checkpoints: ['I drop the noon sound', 'I hold 2 counts', 'Only on tanween fath'],
  }),
  M({
    day: 22, phase: 'mastery', focusFamily: 'madd', estimatedMinutes: 12, unlocksAfter: 21,
    title: 'Madd Silah — The Linking Madd', titleAr: 'مد الصلة',
    objective: 'Link a pronoun ه into the next word at 2 or at 4–5 counts.',
    brief:
      'A ha’ al-damir sitting between two vowels grows a hidden و or ي — printed in the Uthmani script as ۥ or ۦ. Two counts normally; four to five if a hamza follows.',
    ruleIds: ['madd_silah_sughra', 'madd_silah_kubra'], makharij: ['jawf', 'halq_aqsa'],
    practice: [
      { surah: 112, from: 4, to: 4, label: 'Al-Ikhlas 4' },
      { surah: 110, from: 3, to: 3, label: 'An-Nasr 3' },
      { surah: 104, from: 1, to: 9, label: 'Al-Humazah 1–9' },
    ],
    drill: { prompt: 'Click the word with a linking Madd (Silah)!', ruleIds: ['madd_silah_sughra', 'madd_silah_kubra'], questionCount: 6 },
    checkpoints: ['I spot ۥ and ۦ', 'I link into the next word', 'I lengthen before a hamza'],
  }),
  M({
    day: 23, phase: 'mastery', focusFamily: 'madd', estimatedMinutes: 10, unlocksAfter: 22,
    title: 'Madd Lin — The Soft Letters', titleAr: 'مد اللين',
    objective: 'Lengthen a soft و or ي only when you stop on it.',
    brief:
      'خَوْف, قُرَيْش. While you continue, these stay short. Stop on the word and they stretch to match whatever length you chose for madd ‘arid.',
    ruleIds: ['madd_lin'], makharij: ['jawf', 'shafatan_meem'],
    practice: [
      { surah: 106, from: 1, to: 4, label: 'Quraysh 1–4' },
      { surah: 105, from: 1, to: 5, label: 'Al-Fil 1–5' },
    ],
    drill: { prompt: 'Click the word with a soft (lin) letter!', ruleIds: ['madd_lin'], questionCount: 5 },
    checkpoints: ['Short while continuing', 'Stretched at a stop', 'Matches my ‘arid length'],
  }),
  M({
    day: 24, phase: 'mastery', focusFamily: 'madd', estimatedMinutes: 12, unlocksAfter: 23,
    title: 'The Disjointed Letters', titleAr: 'المد اللازم الحرفي',
    objective: 'Spell out the muqatta‘at with correct 6-count letters.',
    brief:
      'الٓمٓ is not a word — it is three letter names, and لام and ميم each contain a madd meeting a sukun, so each gets six counts. The ٓ sign above the glyph is the instruction.',
    ruleIds: ['madd_lazim_harfi'], makharij: ['jawf'],
    practice: [
      { surah: 68, from: 1, to: 4, label: 'Al-Qalam 1–4' },
      { surah: 50, from: 1, to: 3, label: 'Qaf 1–3' },
    ],
    drill: { prompt: 'Click the disjointed letter with a 6-count Madd!', ruleIds: ['madd_lazim_harfi'], questionCount: 5 },
    checkpoints: ['I spell rather than read', 'Six counts on each', 'I spot the ٓ sign'],
  }),
  M({
    day: 25, phase: 'mastery', focusFamily: 'madd', estimatedMinutes: 15, unlocksAfter: 24,
    title: 'The Whole Madd Ladder', titleAr: 'مراجعة المدود',
    objective: 'Hit 2, 4 and 6 counts correctly inside one continuous reading.',
    brief:
      'Every madd you have learned, in one pass. Filter the reader to red only and read An-Naba slowly — the goal is that the three lengths stay clearly distinct from each other.',
    ruleIds: ['madd_tabee', 'madd_badal', 'madd_iwad', 'madd_lin', 'madd_aarid', 'madd_muttasil', 'madd_munfasil', 'madd_lazim_kalimi', 'madd_silah_sughra', 'madd_silah_kubra'],
    makharij: ['jawf'],
    practice: [
      { surah: 78, from: 1, to: 16, label: 'An-Naba 1–16' },
      { surah: 1, from: 1, to: 7, label: 'Al-Fatihah 1–7' },
    ],
    drill: { prompt: 'Madd review — find the named length!', ruleIds: ['madd_tabee', 'madd_muttasil', 'madd_munfasil', 'madd_aarid', 'madd_lazim_kalimi'], questionCount: 10 },
    checkpoints: ['2, 4 and 6 sound different', 'I never guess a length', 'I scored 80%+'],
  }),
  M({
    day: 26, phase: 'mastery', focusFamily: 'ghunnah', estimatedMinutes: 15, unlocksAfter: 25,
    title: 'The Whole Nasal Family', titleAr: 'مراجعة الغنن',
    objective: 'Apply all six ghunnah rules at reading speed.',
    brief:
      'Filter to green only. Ikhfa, idgham with ghunnah, iqlab, the two labial rules and the doubled letters — six rules that share one sound. If the hum ever disappears under speed, slow down until it does not.',
    ruleIds: ['ghunnah_mushaddadah', 'ikhfa', 'idgham_ghunnah', 'iqlab', 'ikhfa_shafawi', 'idgham_shafawi'],
    makharij: ['khayshum', 'lisan_taraf_noon', 'shafatan_meem'],
    practice: [
      { surah: 78, from: 1, to: 16, label: 'An-Naba 1–16' },
      { surah: 114, from: 1, to: 6, label: 'An-Nas 1–6' },
    ],
    drill: { prompt: 'Ghunnah review — find the named rule!', ruleIds: ['ikhfa', 'idgham_ghunnah', 'iqlab', 'ghunnah_mushaddadah', 'ikhfa_shafawi'], questionCount: 10 },
    checkpoints: ['The hum survives at speed', 'I never merge before throat letters', 'All six feel automatic'],
  }),
  M({
    day: 27, phase: 'mastery', focusFamily: 'qalqalah', estimatedMinutes: 15, unlocksAfter: 26,
    title: 'Echo and Weight Together', titleAr: 'القلقلة والتفخيم',
    objective: 'Combine qalqalah with correct heaviness on the same letter.',
    brief:
      'ق and ط are both heavy and bouncing. The echo must keep the heaviness — a light bounce on ق is the classic tell of a rushed reciter. Filter to blue and orange and work through Al-Falaq.',
    ruleIds: ['qalqalah_sughra', 'qalqalah_kubra', 'qalqalah_akbar', 'tafkheem_istila', 'ra_tafkheem', 'ra_tarqeeq'],
    makharij: ['lisan_aqsa', 'lisan_tarf_nitaa', 'lisan_taraf_ra'],
    practice: [
      { surah: 113, from: 1, to: 5, label: 'Al-Falaq 1–5' },
      { surah: 112, from: 1, to: 4, label: 'Al-Ikhlas 1–4' },
    ],
    drill: { prompt: 'Find the bouncing or heavy letter!', ruleIds: ['qalqalah_kubra', 'qalqalah_sughra', 'tafkheem_istila', 'ra_tarqeeq'], questionCount: 10 },
    checkpoints: ['My ق stays heavy as it bounces', 'Sughra and kubra differ', 'ر weight is automatic'],
  }),
  M({
    day: 28, phase: 'mastery', focusFamily: 'silent', estimatedMinutes: 12, unlocksAfter: 27,
    title: 'Stopping and Starting', titleAr: 'الوقف والابتداء',
    objective: 'Stop on a word correctly and resume without distorting meaning.',
    brief:
      'Stopping changes the last letter to sakin, which switches on qalqalah kubra, madd ‘arid and madd lin all at once. Starting again means restoring a hamzat al-wasl you would otherwise skip.',
    ruleIds: ['qalqalah_kubra', 'qalqalah_akbar', 'madd_aarid', 'madd_lin', 'madd_iwad', 'hamzat_wasl'],
    makharij: ['jawf', 'halq_aqsa'],
    practice: [
      { surah: 78, from: 1, to: 16, label: 'An-Naba 1–16' },
      { surah: 103, from: 1, to: 3, label: 'Al-‘Asr 1–3' },
    ],
    drill: { prompt: 'Find the rule that only appears when you stop!', ruleIds: ['qalqalah_kubra', 'madd_aarid', 'madd_iwad', 'madd_lin'], questionCount: 8 },
    checkpoints: ['I stop on complete meanings', 'I restore ٱ when restarting', 'Stop rules fire together'],
  }),
  M({
    day: 29, phase: 'mastery', focusFamily: 'madd', estimatedMinutes: 15, unlocksAfter: 28,
    title: 'Fluency Run', titleAr: 'التلاوة المتصلة',
    objective: 'Recite three surahs end to end with no colour assistance.',
    brief:
      'Switch the colour coding off in the reader and read Al-Ikhlas, Al-Falaq and An-Nas straight through. Then switch it back on and check what you missed. That gap is your remaining work.',
    ruleIds: ['madd_tabee', 'madd_aarid', 'ikhfa', 'idgham_no_ghunnah', 'ghunnah_mushaddadah', 'qalqalah_kubra', 'ra_tafkheem', 'ra_tarqeeq', 'lam_shamsiyyah', 'madd_silah_sughra'],
    makharij: ['jawf', 'khayshum', 'lisan_taraf_ra'],
    practice: [
      { surah: 112, from: 1, to: 4, label: 'Al-Ikhlas 1–4' },
      { surah: 113, from: 1, to: 5, label: 'Al-Falaq 1–5' },
      { surah: 114, from: 1, to: 6, label: 'An-Nas 1–6' },
    ],
    drill: { prompt: 'Unaided review — find the named rule!', ruleIds: ['ikhfa', 'madd_aarid', 'qalqalah_kubra', 'lam_shamsiyyah', 'ghunnah_mushaddadah'], questionCount: 12 },
    checkpoints: ['I read all three unaided', 'Fewer than 3 misses', 'I no longer need the colours'],
  }),
  M({
    day: 30, phase: 'mastery', focusFamily: 'makharij', estimatedMinutes: 15, unlocksAfter: 29,
    title: 'Comprehensive Mastery', titleAr: 'الإتقان الشامل',
    objective: 'Demonstrate every rule in a single recorded recitation.',
    brief:
      'Final assessment. Record Al-Fatihah and An-Naba 1–16 word by word, compare every waveform, and take the mixed quiz across all thirty days. Above 90% means the material is yours; below it, the roadmap shows exactly which day to revisit.',
    ruleIds: ['madd_tabee', 'madd_muttasil', 'madd_munfasil', 'madd_lazim_kalimi', 'madd_aarid', 'ikhfa', 'idgham_ghunnah', 'idgham_no_ghunnah', 'iqlab', 'ghunnah_mushaddadah', 'qalqalah_sughra', 'qalqalah_kubra', 'tafkheem_istila', 'ra_tafkheem', 'ra_tarqeeq', 'lam_tafkheem', 'lam_tarqeeq', 'lam_shamsiyyah', 'silent_letter'],
    makharij: ['jawf', 'halq_aqsa', 'lisan_aqsa', 'shafatan_meem', 'khayshum'],
    practice: [
      { surah: 1, from: 1, to: 7, label: 'Al-Fatihah 1–7' },
      // The longest of the two complete-alphabet verses: every letter, 19 rules.
      { surah: 3, from: 154, to: 154, label: 'Āl-‘Imrān 154 · every letter' },
      { surah: 48, from: 29, to: 29, label: 'Al-Fath 29 · every letter' },
      { surah: 78, from: 1, to: 16, label: 'An-Naba 1–16' },
    ],
    drill: { prompt: 'Final assessment — find the named rule!', ruleIds: ['ikhfa', 'idgham_ghunnah', 'iqlab', 'qalqalah_kubra', 'madd_muttasil', 'madd_munfasil', 'ra_tarqeeq', 'lam_tafkheem', 'lam_shamsiyyah', 'madd_lazim_kalimi'], questionCount: 15 },
    checkpoints: ['I scored 90%+', 'Every rule is automatic', 'I can teach the five colours'],
  }),
];

export const getMilestone = (day: number) => CURRICULUM.find((d) => d.day === day);
export const phaseOf = (day: number): CurriculumPhase => getMilestone(day)?.phase ?? 'foundation';
export const TOTAL_MINUTES = CURRICULUM.reduce((s, d) => s + d.estimatedMinutes, 0);
