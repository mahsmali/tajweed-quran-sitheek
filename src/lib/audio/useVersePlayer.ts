'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useReaderStore } from '@/store/useReaderStore';
import type { QuranWord, VerseData } from '@/types/quran';

/**
 * Drives verse playback and keeps the word highlight locked to the audio
 * playhead.
 *
 * The highlight is resolved on a requestAnimationFrame loop rather than from
 * `timeupdate`, which only fires about four times a second — far too coarse
 * when a word can be 300 ms long. The loop writes to the store only when the
 * active word actually changes, so a 40-word verse causes ~40 renders over its
 * whole duration instead of one per frame.
 */
export function useVersePlayer(verses: VerseData[]) {
  const verseAudio = useRef<HTMLAudioElement | null>(null);
  const wordAudio = useRef<HTMLAudioElement | null>(null);
  const raf = useRef<number | null>(null);
  const activeRef = useRef<string | null>(null);
  /** When set, playback stops as soon as the playhead passes this ms mark. */
  const stopAtRef = useRef<number | null>(null);

  const setPlayhead = useReaderStore((s) => s.setPlayhead);
  const setPlaying = useReaderStore((s) => s.setPlaying);
  const playbackRate = useReaderStore((s) => s.playbackRate);

  // Lazily create the two elements once, client-side only.
  useEffect(() => {
    verseAudio.current = new Audio();
    verseAudio.current.preload = 'auto';
    wordAudio.current = new Audio();
    wordAudio.current.preload = 'auto';
    return () => {
      verseAudio.current?.pause();
      wordAudio.current?.pause();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  useEffect(() => {
    if (verseAudio.current) verseAudio.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const stopLoop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  const tick = useCallback(
    (verse: VerseData) => {
      const el = verseAudio.current;
      if (!el) return;
      const ms = el.currentTime * 1000;

      if (stopAtRef.current !== null && ms >= stopAtRef.current) {
        el.pause();
        stopAtRef.current = null;
        setPlaying(false);
        stopLoop();
        return;
      }

      // Words are time-ordered, so a linear scan is fine and branch-predicts
      // well; a binary search here would be premature for ~40 entries.
      let found: string | null = null;
      for (const w of verse.words) {
        if (!w.timing) continue;
        if (ms >= w.timing.startMs && ms < w.timing.endMs) {
          found = w.id;
          break;
        }
      }
      if (found !== activeRef.current) {
        activeRef.current = found;
        setPlayhead(verse.verseKey, ms, found);
      }
      raf.current = requestAnimationFrame(() => tick(verse));
    },
    [setPlayhead, setPlaying, stopLoop],
  );

  const pause = useCallback(() => {
    verseAudio.current?.pause();
    wordAudio.current?.pause();
    stopAtRef.current = null;
    setPlaying(false);
    stopLoop();
  }, [setPlaying, stopLoop]);

  /** Play one verse from the start, or from a given millisecond offset. */
  const playVerse = useCallback(
    async (verseKey: string, fromMs = 0, untilMs: number | null = null) => {
      const verse = verses.find((v) => v.verseKey === verseKey);
      const el = verseAudio.current;
      if (!verse || !el) return;

      wordAudio.current?.pause();
      if (!el.src.endsWith(verse.audio.verseAudioUrl)) el.src = verse.audio.verseAudioUrl;
      el.playbackRate = playbackRate;
      stopAtRef.current = untilMs;

      try {
        el.currentTime = fromMs / 1000;
      } catch {
        /* seeking before metadata loads throws on some browsers; harmless */
      }

      try {
        await el.play();
      } catch {
        setPlaying(false);
        return;
      }
      setPlaying(true);
      activeRef.current = null;
      stopLoop();
      raf.current = requestAnimationFrame(() => tick(verse));

      el.onended = () => {
        setPlaying(false);
        setPlayhead(null, 0, null);
        activeRef.current = null;
        stopLoop();
      };
    },
    [verses, playbackRate, setPlaying, setPlayhead, stopLoop, tick],
  );

  /**
   * Play one isolated word. Prefers the dedicated word-by-word clip; if that
   * asset is missing, falls back to slicing the verse recitation with the
   * word's own millisecond bounds.
   */
  const playWord = useCallback(
    async (word: QuranWord) => {
      pause();
      const el = wordAudio.current;
      const fallback = () => {
        if (word.timing) void playVerse(`${word.surah}:${word.ayah}`, word.timing.startMs, word.timing.endMs);
      };
      if (!el || !word.audioUrl) return fallback();

      el.src = word.audioUrl;
      el.onerror = fallback;
      useReaderStore.getState().setActiveWord(word.id);
      try {
        await el.play();
      } catch {
        fallback();
      }
      el.onended = () => useReaderStore.getState().setActiveWord(null);
    },
    [pause, playVerse],
  );

  return { playVerse, playWord, pause, verseAudio, wordAudio };
}
