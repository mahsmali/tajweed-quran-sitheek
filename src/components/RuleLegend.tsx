'use client';

import { useMemo } from 'react';
import { FAMILY_ORDER, RULES_BY_FAMILY } from '@/lib/tajweed/rules';
import { useReaderStore } from '@/store/useReaderStore';
import { useT } from '@/lib/i18n/useT';
import type { RuleFamily, TajweedRuleId } from '@/types/tajweed';

const SWATCH: Record<RuleFamily, string> = {
  madd: 'bg-madd', ghunnah: 'bg-ghunnah', qalqalah: 'bg-qalqalah',
  makharij: 'bg-makharij', silent: 'bg-silent', izhar: 'bg-muted',
};


/**
 * The colour key, doubling as the rule filter. Clicking a family narrows the
 * reader to just those rules; clicking the active one clears it.
 *
 * `rail` is the layout for the reader's sidebar: one column at the width the
 * rail actually is, two while the rail is still full-bleed on a narrow screen.
 * The three-across grid the key used to use only ever fitted a full-width row.
 */
export function RuleLegend({
  counts,
  variant = 'grid',
}: {
  counts?: Partial<Record<TajweedRuleId, number>>;
  variant?: 'grid' | 'rail' | 'compact';
}) {
  const compact = variant === 'compact';
  const t = useT();
  const ruleFilter = useReaderStore((s) => s.ruleFilter);
  const setRuleFilter = useReaderStore((s) => s.setRuleFilter);

  const familyCounts = useMemo(() => {
    const out = {} as Record<RuleFamily, number>;
    for (const fam of FAMILY_ORDER) {
      out[fam] = RULES_BY_FAMILY[fam].reduce((s, r) => s + (counts?.[r.id] ?? 0), 0);
    }
    return out;
  }, [counts]);

  const activeFamily = useMemo(() => {
    if (!ruleFilter?.length) return null;
    const fams = new Set(FAMILY_ORDER.filter((f) => RULES_BY_FAMILY[f].some((r) => ruleFilter.includes(r.id))));
    return fams.size === 1 ? [...fams][0] : null;
  }, [ruleFilter]);

  const LAYOUT = {
    compact: 'flex flex-wrap gap-1.5',
    rail: 'grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1',
    grid: 'grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3',
  } as const;

  return (
    <div className={LAYOUT[variant]}>
      {FAMILY_ORDER.filter((f) => f !== 'izhar' || !compact).map((fam) => {
        const n = familyCounts[fam];
        const active = activeFamily === fam;
        return (
          <button
            key={fam}
            type="button"
            onClick={() => setRuleFilter(active ? null : RULES_BY_FAMILY[fam].map((r) => r.id))}
            aria-pressed={active}
            className={[
              'group flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition',
              active ? 'border-accent bg-accent/10' : 'border-line bg-raised hover:border-accent/40',
            ].join(' ')}
          >
            <span className={`h-3 w-3 shrink-0 rounded-full ${SWATCH[fam]}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-ink">
                {t.t(`families.${fam}`)}
              </span>
              {!compact && (
                <span className="block truncate text-[11px] text-muted">{t.t(`legend.${fam}`)}</span>
              )}
            </span>
            {counts && (
              <span className="shrink-0 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted">
                {n}
              </span>
            )}
          </button>
        );
      })}
      {ruleFilter && (
        <button
          type="button"
          onClick={() => setRuleFilter(null)}
          className="rounded-xl border border-dashed border-line px-3 py-2 text-[12px] font-medium text-muted transition hover:border-accent/50 hover:text-ink"
        >
          {t.t('reader.clearFilter')}
        </button>
      )}
    </div>
  );
}
