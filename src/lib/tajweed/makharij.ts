import type { MakhrajId } from '@/types/tajweed';
import * as U from '@/lib/arabic/unicode';

export interface MakhrajZone {
  id: MakhrajId;
  /** Broad anatomical group used by the diagram's region highlighting. */
  group: 'jawf' | 'halq' | 'lisan' | 'shafatan' | 'khayshum';
  name: string;
  nameAr: string;
  letters: string;
  description: string;
  /** Practical cue a learner can feel, not just read. */
  cue: string;
}

export const MAKHRAJ_ZONES: Record<MakhrajId, MakhrajZone> = {
  jawf: {
    id: 'jawf', group: 'jawf', name: 'Al-Jawf — Oral Cavity', nameAr: 'الجوف', letters: 'ا و ي',
    description: 'The empty space of the mouth and throat. The three madd letters have no contact point at all — the sound simply resonates until the breath stops.',
    cue: 'Nothing touches. If you feel contact anywhere, the madd has been cut short.',
  },
  halq_aqsa: {
    id: 'halq_aqsa', group: 'halq', name: 'Deepest Throat', nameAr: 'أقصى الحلق', letters: 'ء هـ',
    description: 'The furthest part of the throat, next to the chest.',
    cue: 'Cough gently — the catch you feel is the hamza.',
  },
  halq_awsat: {
    id: 'halq_awsat', group: 'halq', name: 'Middle of the Throat', nameAr: 'وسط الحلق', letters: 'ع ح',
    description: 'The mid throat, where ع and ح are constricted.',
    cue: 'ح is a dry whisper; ع is the same place with the voice switched on.',
  },
  halq_adna: {
    id: 'halq_adna', group: 'halq', name: 'Nearest Throat', nameAr: 'أدنى الحلق', letters: 'غ خ',
    description: 'Closest to the mouth — these two are heavy (isti‘la) letters.',
    cue: 'Like a gargle held back; the sound fills the mouth.',
  },
  lisan_aqsa: {
    id: 'lisan_aqsa', group: 'lisan', name: 'Back of Tongue + Soft Palate', nameAr: 'أقصى اللسان', letters: 'ق',
    description: 'The deepest part of the tongue against the soft palate.',
    cue: 'Qaf is heavy and bounces — it is also a qalqalah letter.',
  },
  lisan_aqsa_asfal: {
    id: 'lisan_aqsa_asfal', group: 'lisan', name: 'Back of Tongue + Hard Palate', nameAr: 'أقصى اللسان أسفل', letters: 'ك',
    description: 'Slightly forward of ق, against the hard palate.',
    cue: 'Kaf is light and dry — never let it thicken into a qaf.',
  },
  lisan_wasat: {
    id: 'lisan_wasat', group: 'lisan', name: 'Middle of the Tongue', nameAr: 'وسط اللسان', letters: 'ج ش ي',
    description: 'The tongue’s middle pressed against the roof of the mouth.',
    cue: 'Jeem stops the air completely; sheen lets it spread out sideways.',
  },
  lisan_hafatan: {
    id: 'lisan_hafatan', group: 'lisan', name: 'Edges of the Tongue', nameAr: 'حافتا اللسان', letters: 'ض',
    description: 'One or both side edges against the upper molars — the hardest makhraj in Arabic.',
    cue: 'Press the side of the tongue into the molars and hold; ض is heavy and long.',
  },
  lisan_hafa_adna: {
    id: 'lisan_hafa_adna', group: 'lisan', name: 'Tongue Edge + Front Gums', nameAr: 'أدنى حافة اللسان', letters: 'ل',
    description: 'The nearest edge of the tongue meeting the gums of the front teeth.',
    cue: 'Normally light — heavy only in the name of Allah after a fatha or damma.',
  },
  lisan_taraf_noon: {
    id: 'lisan_taraf_noon', group: 'lisan', name: 'Tongue Tip (Noon)', nameAr: 'طرف اللسان — النون', letters: 'ن',
    description: 'The tip of the tongue at the gums, with the nasal passage always partly open.',
    cue: 'Pinch your nose while saying نّ — if the sound does not change, the ghunnah is missing.',
  },
  lisan_taraf_ra: {
    id: 'lisan_taraf_ra', group: 'lisan', name: 'Tongue Tip (Ra)', nameAr: 'طرف اللسان — الراء', letters: 'ر',
    description: 'Slightly deeper into the mouth than noon, with the tip curved up.',
    cue: 'One light tap. Rolling it into a Spanish rr is the most common error.',
  },
  lisan_tarf_nitaa: {
    id: 'lisan_tarf_nitaa', group: 'lisan', name: 'Tongue Tip + Gum Root', nameAr: 'طرف اللسان وأصول الثنايا', letters: 'ط د ت',
    description: 'The tip against the roots of the upper front teeth.',
    cue: 'ط is the heavy one, د is light and voiced, ت is light and voiceless.',
  },
  lisan_tarf_safir: {
    id: 'lisan_tarf_safir', group: 'lisan', name: 'Whistling Letters', nameAr: 'حروف الصفير', letters: 'ص س ز',
    description: 'The tip of the tongue just behind the lower front teeth, forcing air through a narrow channel.',
    cue: 'All three whistle. ص is the heavy member of the set.',
  },
  lisan_tarf_lithah: {
    id: 'lisan_tarf_lithah', group: 'lisan', name: 'Tongue Tip + Teeth Edges', nameAr: 'طرف اللسان وأطراف الثنايا', letters: 'ظ ذ ث',
    description: 'The tip protrudes very slightly between the teeth.',
    cue: 'The tongue must be visible. ظ is heavy; ذ and ث stay light.',
  },
  shafatan_batn: {
    id: 'shafatan_batn', group: 'shafatan', name: 'Inner Lip + Teeth', nameAr: 'بطن الشفة', letters: 'ف',
    description: 'The inside of the lower lip against the edges of the upper front teeth.',
    cue: 'Air escapes continuously — ف can be held indefinitely.',
  },
  shafatan_meem: {
    id: 'shafatan_meem', group: 'shafatan', name: 'Both Lips', nameAr: 'الشفتان', letters: 'ب م و',
    description: 'ب and م close the lips fully; و rounds them without closing.',
    cue: 'For م the lips seal and the nose opens. For و they must never touch.',
  },
  khayshum: {
    // No letters: the nasal passage is the exit for the ghunnah, not the
    // makhraj of any letter. Anything non-empty here leaks into the letter
    // chips as stray characters.
    id: 'khayshum', group: 'khayshum', name: 'Al-Khayshum — Nasal Passage', nameAr: 'الخيشوم', letters: '',
    description: 'The nasal cavity. It is not a letter’s makhraj but the exit for the ghunnah that accompanies every noon and meem.',
    cue: 'Every green rule in this app lives here. Feel the buzz above the roof of your mouth.',
  },
};

/** code point -> primary articulation zone. */
const LETTER_MAKHRAJ: Record<number, MakhrajId> = {
  [U.HAMZA]: 'halq_aqsa', [U.ALEF_HAMZA_ABOVE]: 'halq_aqsa', [U.ALEF_HAMZA_BELOW]: 'halq_aqsa',
  [U.WAW_HAMZA]: 'halq_aqsa', [U.YEH_HAMZA]: 'halq_aqsa', [U.ALEF_MADDA]: 'halq_aqsa',
  [U.HEH]: 'halq_aqsa', [U.TEH_MARBUTA]: 'halq_aqsa',
  [U.AIN]: 'halq_awsat', [U.HAH]: 'halq_awsat',
  [U.GHAIN]: 'halq_adna', [U.KHAH]: 'halq_adna',
  [U.QAF]: 'lisan_aqsa', [U.KAF]: 'lisan_aqsa_asfal',
  [U.JEEM]: 'lisan_wasat', [U.SHEEN]: 'lisan_wasat', [U.YEH]: 'lisan_wasat',
  [U.DAD]: 'lisan_hafatan', [U.LAM]: 'lisan_hafa_adna',
  [U.NOON]: 'lisan_taraf_noon', [U.REH]: 'lisan_taraf_ra',
  [U.TAH]: 'lisan_tarf_nitaa', [U.DAL]: 'lisan_tarf_nitaa', [U.TEH]: 'lisan_tarf_nitaa',
  [U.SAD]: 'lisan_tarf_safir', [U.SEEN]: 'lisan_tarf_safir', [U.ZAIN]: 'lisan_tarf_safir',
  [U.ZAH]: 'lisan_tarf_lithah', [U.THAL]: 'lisan_tarf_lithah', [U.THEH]: 'lisan_tarf_lithah',
  [U.FEH]: 'shafatan_batn',
  [U.BEH]: 'shafatan_meem', [U.MEEM]: 'shafatan_meem', [U.WAW]: 'shafatan_meem',
  [U.ALEF]: 'jawf', [U.ALEF_WASLA]: 'jawf', [U.ALEF_MAKSURA]: 'jawf',
};

export function makhrajForLetter(code: number): MakhrajId | null {
  return LETTER_MAKHRAJ[code] ?? null;
}

/** Every distinct zone exercised by a string of Arabic text. */
export function makharijForText(text: string): MakhrajId[] {
  const seen = new Set<MakhrajId>();
  for (const ch of text) {
    const z = makhrajForLetter(ch.codePointAt(0)!);
    if (z) seen.add(z);
  }
  return [...seen];
}

/** The letters of a zone, as individual characters, for the visualiser. */
export function lettersOfZone(id: MakhrajId): string[] {
  return MAKHRAJ_ZONES[id].letters.split(' ').filter((s) => s.length === 1);
}
