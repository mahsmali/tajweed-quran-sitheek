'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MakhrajVisualizer } from './MakhrajVisualizer';
import { useT } from '@/lib/i18n/useT';
import type { MakhrajId } from '@/types/tajweed';

export interface MakhrajModalProps {
  open: boolean;
  onClose: () => void;
  /** The word (or letter) being examined. */
  text: string;
  initialLetter?: string | null;
  relatedZones?: MakhrajId[];
  title?: string;
}

/**
 * Full-screen articulation inspector, opened from the word panel or the quiz.
 * Deliberately a modal rather than another inline panel: locating a sound in
 * your own mouth wants the whole screen and none of the reader's distractions.
 */
export function MakhrajModal({
  open,
  onClose,
  text,
  initialLetter = null,
  relatedZones = [],
  title,
}: MakhrajModalProps) {
  const t = useT();
  const heading = title ?? t.t('makhraj.modalTitle');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label={t.t('makhraj.close')}
            onClick={onClose}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="panel relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-b-none p-5 shadow-card sm:rounded-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{heading}</p>
                <p dir="rtl" className="arabic mt-1 pb-1 text-4xl leading-[1.7] text-ink">
                  {text}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-ink"
              >
                {t.t('makhraj.close')}
              </button>
            </div>

            <MakhrajVisualizer text={text} initialLetter={initialLetter} relatedZones={relatedZones} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
