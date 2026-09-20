'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TajweedWordRenderer } from '@/components/TajweedWordRenderer';
import { MakhrajModal } from '@/components/MakhrajModal';
import { FAMILY_STYLE } from '@/lib/tajweed/rules';
import { playCorrect, playWrong, playFanfare } from '@/lib/audio/chime';
import { useProgressStore } from '@/store/useProgressStore';
import { useReaderStore } from '@/store/useReaderStore';
import { useLocaleStore } from '@/store/useLocaleStore';
import { useT } from '@/lib/i18n/useT';
import type { Translator } from '@/lib/i18n';
import type { ChapterData, QuranWord, VerseData } from '@/types/quran';
import type { RuleFamily, TajweedRuleId } from '@/types/tajweed';

export interface GamifiedQuizScreenProps {
  /** Curriculum day this drill belongs to, or null for free play. */
  day?: number | null;
  /** Rules the questions are drawn from. */
  ruleIds: TajweedRuleId[];
  questionCount?: number;
  /** Surahs to mine for questions. */
  surahPool?: number[];
  promptOverride?: string;
}

interface QuizQuestion {
  verse: VerseData;
  targetRuleId: TajweedRuleId;
  /** Every word that legitimately contains the target rule. */
  answerIds: Set<string>;
}

type Phase = 'loading' | 'asking' | 'correct' | 'wrong' | 'finished' | 'empty';

const DEFAULT_POOL = [1, 112, 113, 114, 103, 108, 110];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Builds a question set from already-analysed verses.
 *
 * Two constraints make a question worth asking:
 *  • the verse must contain at least one word with the target rule, and
 *  • it must contain at least three words *without* it, so a lucky tap is
 *    unlikely and the learner has to actually discriminate.
 */
function buildQuestions(verses: VerseData[], ruleIds: TajweedRuleId[], count: number): QuizQuestion[] {
  const candidates: QuizQuestion[] = [];

  for (const ruleId of ruleIds) {
    for (const verse of verses) {
      const answers = verse.words.filter((w) => w.ruleIds.includes(ruleId));
      if (answers.length === 0) continue;
      if (verse.words.length - answers.length < 3) continue;
      candidates.push({ verse, targetRuleId: ruleId, answerIds: new Set(answers.map((w) => w.id)) });
    }
  }

  // Round-robin across rules so one very common rule cannot dominate the set.
  const byRule = new Map<TajweedRuleId, QuizQuestion[]>();
  for (const q of shuffle(candidates)) {
    const list = byRule.get(q.targetRuleId) ?? [];
    list.push(q);
    byRule.set(q.targetRuleId, list);
  }

  const out: QuizQuestion[] = [];
  const seenVerses = new Set<string>();
  let exhausted = false;
  while (out.length < count && !exhausted) {
    exhausted = true;
    for (const list of byRule.values()) {
      if (out.length >= count) break;
      const next = list.shift();
      if (!next) continue;
      exhausted = false;
      const key = `${next.verse.verseKey}|${next.targetRuleId}`;
      if (seenVerses.has(key)) continue;
      seenVerses.add(key);
      out.push(next);
    }
  }
  return out;
}

export function GamifiedQuizScreen({
  day = null,
  ruleIds,
  questionCount = 8,
  surahPool = DEFAULT_POOL,
  promptOverride,
}: GamifiedQuizScreenProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [makhrajWord, setMakhrajWord] = useState<QuranWord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const recordQuiz = useProgressStore((s) => s.recordQuiz);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const inspect = useReaderStore((s) => s.inspect);

  // The quiz must never show the colour coding — that would hand over the
  // answer. Clear any inspector state left over from the reader too.
  useEffect(() => {
    inspect(null);
  }, [inspect]);

  const ruleKey = useMemo(() => ruleIds.join(','), [ruleIds]);
  const poolKey = useMemo(() => surahPool.join(','), [surahPool]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setError(null);

    Promise.all(
      surahPool.map((s) =>
        fetch(`/api/chapter/${s}?locale=${locale}`)
          .then((r) => (r.ok ? (r.json() as Promise<ChapterData>) : null))
          .catch(() => null),
      ),
    )
      .then((chapters) => {
        if (cancelled) return;
        const verses = chapters.flatMap((c) => c?.verses ?? []);
        if (!verses.length) {
          setError(t.t('quiz.emptyError'));
          setPhase('empty');
          return;
        }
        const qs = buildQuestions(verses, ruleIds, questionCount);
        setQuestions(qs);
        setIndex(0);
        setCorrect(0);
        setStreak(0);
        setBestStreak(0);
        setPicked(null);
        setPhase(qs.length ? 'asking' : 'empty');
      })
      .catch(() => !cancelled && setPhase('empty'));

    return () => {
      cancelled = true;
    };
  }, [ruleKey, poolKey, questionCount, ruleIds, surahPool, locale, t]);

  const question = questions[index];
  const rule = question ? t.rule(question.targetRuleId) : null;

  const answer = useCallback(
    (word: QuranWord) => {
      if (!question || phase !== 'asking') return;
      const isRight = question.answerIds.has(word.id);
      setPicked(word.id);
      recordAnswer(question.targetRuleId, isRight);

      if (isRight) {
        setPhase('correct');
        setCorrect((c) => c + 1);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        playCorrect();
      } else {
        setPhase('wrong');
        setStreak(0);
        playWrong();
      }
    },
    [question, phase, recordAnswer],
  );

  const finishedRef = useRef(false);
  const next = useCallback(() => {
    setPicked(null);
    if (index + 1 >= questions.length) {
      setPhase('finished');
      if (!finishedRef.current) {
        finishedRef.current = true;
        playFanfare();
        recordQuiz({
          day,
          ruleIds,
          correct,
          total: questions.length,
          bestStreak,
          finishedAt: new Date().toISOString(),
        });
      }
      return;
    }
    setIndex((i) => i + 1);
    setPhase('asking');
  }, [index, questions.length, day, ruleIds, correct, bestStreak, recordQuiz]);

  const restart = useCallback(() => {
    finishedRef.current = false;
    setQuestions((qs) => shuffle(qs));
    setIndex(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setPicked(null);
    setPhase('asking');
  }, []);

  // Enter / Space advances once an answer has been given.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && (phase === 'correct' || phase === 'wrong')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, next]);

  if (phase === 'loading') return <QuizSkeleton t={t} />;
  if (phase === 'empty') {
    return (
      <div className="panel px-6 py-10 text-center">
        <p className="text-[14px] font-medium text-ink">{t.t('quiz.emptyTitle')}</p>
        <p className="mt-1.5 text-[13px] text-muted">{error ?? t.t('quiz.emptyBody')}</p>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <QuizResult t={t} correct={correct} total={questions.length} bestStreak={bestStreak} onRestart={restart} />
    );
  }

  const revealed = phase === 'wrong';

  return (
    <div className="space-y-4">
      <ScoreBar
        t={t}
        index={index}
        total={questions.length}
        correct={correct}
        streak={streak}
        family={rule?.family ?? 'madd'}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${question?.verse.verseKey}-${question?.targetRuleId}-${index}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="panel paper relative overflow-hidden px-5 py-6 sm:px-7"
        >
          {phase === 'correct' && <Confetti />}

          {/* ── the prompt ─────────────────────────────────────────────── */}
          <div className="mb-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              {t.t('quiz.questionOf', {
                verse: question?.verse.verseKey ?? '',
                index: index + 1,
                total: questions.length,
              })}
            </p>
            {/* A curriculum day supplies a complete sentence ("Click the word
                that contains a Ghunnah!"); free play supplies a prefix that the
                rule name completes. Appending the label to a complete sentence
                would read as a stutter, so the two shapes are kept apart — and
                the label still appears on the line below either way. */}
            <h2 className="display mt-2 text-[clamp(1.25rem,2.6vw,1.75rem)] leading-tight text-ink [text-wrap:balance]">
              {promptOverride ?? (
                <>
                  {t.t('quiz.prompt')}{' '}
                  <span className={FAMILY_STYLE[rule!.family].text}>
                    {rule!.label.replace(/\s*\(.*\)$/, '')}
                  </span>
                </>
              )}
            </h2>
            <p className="mx-auto mt-1.5 max-w-xl text-[13px] text-muted">
              {promptOverride && (
                <span className={`font-medium ${FAMILY_STYLE[rule!.family].text}`}>
                  {rule!.label.replace(/\s*\(.*\)$/, '')} ·{' '}
                </span>
              )}
              {rule!.summary}
            </p>
          </div>

          {/* ── the board: colour is suppressed so it cannot give the answer ── */}
          <div dir="rtl" className="flex flex-wrap items-end justify-center gap-x-1 gap-y-2">
            {question!.verse.words.map((w) => {
              const isAnswer = question!.answerIds.has(w.id);
              const state =
                phase === 'correct' && w.id === picked
                  ? 'correct'
                  : phase === 'wrong' && w.id === picked
                    ? 'wrong'
                    : revealed && isAnswer
                      ? 'reveal'
                      : 'idle';
              return (
                <TajweedWordRenderer
                  key={w.id}
                  word={w}
                  forcePlain
                  size="lg"
                  quizState={state}
                  onSelect={phase === 'asking' ? answer : undefined}
                  interactive={phase === 'asking'}
                />
              );
            })}
          </div>

          {/* ── feedback ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {(phase === 'correct' || phase === 'wrong') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6"
              >
                <Explanation
                  t={t}
                  question={question!}
                  pickedId={picked}
                  correct={phase === 'correct'}
                  onShowMakhraj={setMakhrajWord}
                />
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
                  >
                    {t.t(index + 1 >= questions.length ? 'quiz.seeResults' : 'quiz.next')} →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <MakhrajModal
        open={!!makhrajWord}
        onClose={() => setMakhrajWord(null)}
        text={makhrajWord?.textUthmani ?? ''}
        relatedZones={makhrajWord?.makharij ?? []}
        title={t.t('makhraj.whereMade')}
      />
    </div>
  );
}

/* ── feedback panel ───────────────────────────────────────────────────── */

function Explanation({
  t,
  question,
  pickedId,
  correct,
  onShowMakhraj,
}: {
  t: Translator;
  question: QuizQuestion;
  pickedId: string | null;
  correct: boolean;
  onShowMakhraj: (w: QuranWord) => void;
}) {
  const rule = t.rule(question.targetRuleId);
  const answerWord = question.verse.words.find((w) => question.answerIds.has(w.id))!;
  const pickedWord = question.verse.words.find((w) => w.id === pickedId);
  const span = answerWord.spans.find((s) => s.ruleId === question.targetRuleId);

  return (
    <div
      className={[
        'mx-auto max-w-2xl rounded-2xl border px-4 py-4',
        correct ? 'border-ghunnah/40 bg-ghunnah/[0.07]' : 'border-makharij/40 bg-makharij/[0.07]',
      ].join(' ')}
    >
      <p className={`text-[13px] font-semibold ${correct ? 'text-ghunnah' : 'text-makharij'}`}>
        {t.t(correct ? 'quiz.correct' : 'quiz.wrong')}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted">{t.t('quiz.ruleIsIn')}</p>
          <p dir="rtl" className="arabic mt-0.5 text-4xl leading-tight text-ink">
            {answerWord.textUthmani}
          </p>
        </div>
        {span && (
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted">{t.t('quiz.why')}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{t.note(span)}</p>
          </div>
        )}
      </div>

      {!correct && pickedWord && (
        <p className="mt-3 rounded-lg bg-ink/[0.04] px-3 py-2 text-[12.5px] text-muted">
          {t.t('quiz.youChose')}{' '}
          <span dir="rtl" className="arabic text-lg text-ink">
            {pickedWord.textUthmani}
          </span>{' '}
          {pickedWord.ruleIds.length
            ? t.t('quiz.youChoseHasRule', {
                rule: t.rule(pickedWord.ruleIds[0]).label,
                target: rule.label,
              })
            : t.t('quiz.youChoseNoRule')}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onShowMakhraj(answerWord)}
          className="chip border border-line bg-raised text-muted transition hover:border-accent/50 hover:text-ink"
        >
          {t.t('quiz.showArticulation')}
        </button>
        {rule.counts && (
          <span className="chip bg-ink/[0.06] text-muted">
            {t.t('inspector.counts', { counts: rule.counts.join('/') })}
          </span>
        )}
        <span className="chip bg-ink/[0.06] text-muted">{rule.labelAr}</span>
      </div>
    </div>
  );
}

/* ── chrome ───────────────────────────────────────────────────────────── */

function ScoreBar({
  t,
  index,
  total,
  correct,
  streak,
  family,
}: {
  t: Translator;
  index: number;
  total: number;
  correct: number;
  streak: number;
  family: RuleFamily;
}) {
  return (
    <div className="panel flex flex-wrap items-center gap-4 px-4 py-3">
      <div className="flex min-w-[140px] flex-1 items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
          <motion.div
            className={`h-full rounded-full ${FAMILY_STYLE[family].dot}`}
            animate={{ width: `${(index / total) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          />
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-muted">
          {index}/{total}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Metric label={t.t('quiz.correctLabel')} value={String(correct)} tone="text-ghunnah" />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={streak}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          >
            <Metric label={t.t('quiz.streakLabel')} value={streak > 0 ? `🔥 ${streak}` : '—'} tone="text-makharij" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={`text-[15px] font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

/** Lightweight confetti — 20 divs, no canvas, no dependency. */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 420,
        y: -120 - Math.random() * 160,
        rotate: (Math.random() - 0.5) * 540,
        delay: Math.random() * 0.12,
        color: ['bg-madd', 'bg-ghunnah', 'bg-qalqalah', 'bg-makharij', 'bg-accent'][i % 5],
      })),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 z-20 flex justify-center">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute h-2 w-2 rounded-[2px] ${p.color}`}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate, scale: 0.6 }}
          transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function QuizResult({
  t,
  correct,
  total,
  bestStreak,
  onRestart,
}: {
  t: Translator;
  correct: number;
  total: number;
  bestStreak: number;
  onRestart: () => void;
}) {
  const pct = Math.round((correct / total) * 100);
  const verdict = t.t(
    pct >= 90 ? 'quiz.verdictMastered' : pct >= 70 ? 'quiz.verdictSolid' : 'quiz.verdictRevisit',
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="panel paper relative overflow-hidden px-6 py-10 text-center"
    >
      <Confetti />
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        {t.t('quiz.sessionComplete')}
      </p>
      <p className="display mt-3 text-[4.5rem] font-semibold leading-none tabular-nums text-ink">{pct}%</p>
      <p className="mt-1.5 text-[14px] text-muted">
        {t.t('quiz.resultLine', { correct, total, streak: bestStreak })}
      </p>
      <p className="mt-3 text-[14px] font-medium text-ink">{verdict}</p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-5 rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
      >
        {t.t('quiz.playAgain')}
      </button>
    </motion.div>
  );
}

function QuizSkeleton({ t }: { t: Translator }) {
  return (
    <div className="panel px-6 py-16 text-center">
      <div className="mx-auto h-3 w-40 animate-shimmer rounded bg-gradient-to-r from-ink/[0.05] via-ink/[0.1] to-ink/[0.05] bg-[length:200%_100%]" />
      <p className="mt-4 text-[13px] text-muted">{t.t('quiz.building')}</p>
    </div>
  );
}
