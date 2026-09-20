import type { NoonSource, NoteKey, Vowel } from './keys';

export interface NoteLocale {
  src: Record<NoonSource, string>;
  vowel: Record<Vowel, string>;
  obstacle: { shadda: string; sukun: string };
  templates: Record<NoteKey, string>;
}

export const notesEn: NoteLocale = {
  src: {
    noon: 'نْ',
    tanween_fath: 'tanween fath',
    tanween_damm: 'tanween damm',
    tanween_kasr: 'tanween kasr',
  },
  vowel: { fatha: 'fatha', damma: 'damma', kasra: 'kasra' },
  obstacle: { shadda: 'shadda', sukun: 'sukun' },
  templates: {
    ikhfa: '{src} before {letter} → hide the noon in a 2-count nasal hum.',
    iqlab: '{src} before ب → convert the noon to a hidden meem, 2-count ghunnah.',
    idgham_ghunnah: '{src} before {letter} → merge into it, carrying a 2-count ghunnah.',
    idgham_no_ghunnah: '{src} before {letter} → merge completely, with no nasal sound at all.',
    izhar_halqi: '{src} before the throat letter {letter} → pronounce the noon clearly.',
    izhar_mutlaq: '{src} + {letter} inside one word → izhar mutlaq, read the noon clearly.',

    ikhfa_shafawi: 'مْ before ب → touch the lips lightly and hum for 2 counts.',
    idgham_shafawi: 'مْ before م → merge into one doubled meem with a full ghunnah.',
    izhar_shafawi: 'مْ before {letter} → close the lips and read it plainly.',

    ghunnah_mushaddadah: '{letter}ّ carries a shadda → hold a full 2-count ghunnah in the nose.',

    qalqalah_sughra: '{letter}ْ is sakin mid-flow → give it a light, dry bounce with no added vowel.',
    qalqalah_kubra: 'Stopping on {letter} → release it with a clear, full bounce.',
    qalqalah_akbar: 'Stopping on a doubled {letter} → the strongest echo of all (akbar).',

    madd_iwad: 'Stopping on tanween fath → drop the noon sound and stretch an alif for 2 counts.',
    silah_sughra: 'Pronoun ه between two vowels → link it with a hidden و/ي for 2 counts.',
    silah_kubra: 'Pronoun ه linked to a following hamza → stretch 4–5 counts.',
    lazim_harfi: 'The disjointed letter {letter} spells out to a 6-count madd.',
    madd_lin: 'Soft {letter} before a stop → 2, 4 or 6 counts (match your madd ‘arid length).',
    lazim_kalimi: 'Madd meeting a permanent {obstacle} on {letter} → a necessary 6 counts.',
    muttasil: 'Madd followed by a hamza in the same word → obligatory 4–5 counts.',
    munfasil: 'Madd at the end of a word meeting a hamza in the next → 4–5 counts.',
    aarid: 'Madd before the letter you stop on → 2, 4 or 6 counts; keep it consistent.',
    badal: 'Hamza comes before the madd letter → it stays at its natural 2 counts.',
    tabee: 'Natural madd — hold for exactly 2 counts, no more and no less.',

    istila: '{letter} is an isti‘la letter → raise the back of the tongue and read it heavy.',
    ra_haraka_heavy: 'ر carries a {vowel} → read it heavy.',
    ra_haraka_light: 'ر carries a kasra → read it light.',
    ra_no_prev: 'ر with no preceding vowel → default to heavy.',
    ra_wasl_heavy: 'The kasra before ر belongs to a hamzat wasl, so it does not lighten it → heavy.',
    ra_kasra_then_istila: 'Sakin ر after a kasra but followed by the heavy letter {letter} → heavy.',
    ra_sakin_kasra_light: 'Sakin ر after an original kasra → read it light.',
    ra_after_sakin_yeh: 'Sakin ر after a sakin ي → read it light.',
    ra_sakin_heavy: 'Sakin ر after a {vowel} → read it heavy.',
    lam_light: 'The name of Allah after a kasra → the lam is read light.',
    lam_heavy: 'The name of Allah after a {vowel} → the lam is read heavy.',

    silent_always: 'This {letter} is written in the rasm but never pronounced.',
    silent_continuing: 'This {letter} is dropped while continuing, and only sounded if you stop here.',
    hamzat_wasl: 'Hamzat al-wasl reached mid-flow → skip it and join straight to the next letter.',
    lam_shamsiyyah: 'The ل of "ال" is silent before the solar letter {letter} — read it as {letter}{letter}.',
  },
};
