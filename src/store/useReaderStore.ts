'use client';

import { create } from 'zustand';
import type { TajweedRuleId } from '@/types/tajweed';
import type { QuranWord } from '@/types/quran';
import { DEFAULT_RECITER } from '@/lib/pipeline/quranClient';

/**
 * Hot path state. Every field here is touched on the audio frame loop, so the
 * store is intentionally flat and the selectors in components are narrow —
 * a word re-renders only when its own active flag flips, not when the
 * playhead moves.
 */
interface ReaderState {
  // ── playback ─────────────────────────────────────────────────────────────
  playingVerseKey: string | null;
  activeWordId: string | null;
  positionMs: number;
  isPlaying: boolean;
  playbackRate: number;
  reciterId: number;
  /** Loop a single word until the learner stops it. */
  loopWordId: string | null;

  // ── inspection ───────────────────────────────────────────────────────────
  inspectedWord: QuranWord | null;
  makhrajModalLetter: string | null;

  // ── display ──────────────────────────────────────────────────────────────
  colorEnabled: boolean;
  highContrast: boolean;
  showTranslation: boolean;
  showTransliteration: boolean;
  /** null = show everything; otherwise only these rules are coloured. */
  ruleFilter: TajweedRuleId[] | null;

  setPlaying: (v: boolean) => void;
  setPlayhead: (verseKey: string | null, ms: number, wordId: string | null) => void;
  setActiveWord: (id: string | null) => void;
  setReciter: (id: number) => void;
  setRate: (r: number) => void;
  setLoopWord: (id: string | null) => void;
  inspect: (w: QuranWord | null) => void;
  openMakhraj: (letter: string | null) => void;
  toggleColor: () => void;
  toggleContrast: () => void;
  toggleTranslation: () => void;
  toggleTransliteration: () => void;
  setRuleFilter: (ids: TajweedRuleId[] | null) => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  playingVerseKey: null,
  activeWordId: null,
  positionMs: 0,
  isPlaying: false,
  playbackRate: 1,
  reciterId: DEFAULT_RECITER,
  loopWordId: null,

  inspectedWord: null,
  makhrajModalLetter: null,

  colorEnabled: true,
  highContrast: false,
  showTranslation: true,
  showTransliteration: false,
  ruleFilter: null,

  setPlaying: (v) => set({ isPlaying: v }),
  setPlayhead: (playingVerseKey, positionMs, activeWordId) => set({ playingVerseKey, positionMs, activeWordId }),
  setActiveWord: (activeWordId) => set({ activeWordId }),
  setReciter: (reciterId) => set({ reciterId }),
  setRate: (playbackRate) => set({ playbackRate }),
  setLoopWord: (loopWordId) => set({ loopWordId }),
  inspect: (inspectedWord) => set({ inspectedWord, makhrajModalLetter: null }),
  openMakhraj: (makhrajModalLetter) => set({ makhrajModalLetter }),
  toggleColor: () => set((s) => ({ colorEnabled: !s.colorEnabled })),
  toggleContrast: () => set((s) => ({ highContrast: !s.highContrast })),
  toggleTranslation: () => set((s) => ({ showTranslation: !s.showTranslation })),
  toggleTransliteration: () => set((s) => ({ showTransliteration: !s.showTransliteration })),
  setRuleFilter: (ruleFilter) => set({ ruleFilter }),
}));
