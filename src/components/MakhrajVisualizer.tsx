'use client';

import { memo, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MAKHRAJ_ZONES, lettersOfZone, makhrajForLetter } from '@/lib/tajweed/makharij';
import { isArabicLetter, stripMarks } from '@/lib/arabic/unicode';
import { useT } from '@/lib/i18n/useT';
import type { MakhrajId } from '@/types/tajweed';

/* ===========================================================================
   MakhrajDiagram — a schematic mid-sagittal section of the vocal tract.

   Drawn rather than photographed so that every region is an addressable,
   clickable element and the whole thing re-colours with the theme. Geometry is
   a deliberate simplification: the goal is for a learner to locate a sound,
   not to pass an anatomy exam.
   =========================================================================== */

type ZoneGroup = 'jawf' | 'halq' | 'lisan' | 'shafatan' | 'khayshum';

const MARKERS: Record<MakhrajId, { x: number; y: number }> = {
  khayshum: { x: 108, y: 153 },
  jawf: { x: 122, y: 202 },
  halq_adna: { x: 179, y: 229 },
  halq_awsat: { x: 187, y: 257 },
  halq_aqsa: { x: 193, y: 287 },
  lisan_aqsa: { x: 168, y: 213 },
  lisan_aqsa_asfal: { x: 155, y: 207 },
  lisan_wasat: { x: 139, y: 210 },
  lisan_hafatan: { x: 124, y: 225 },
  lisan_hafa_adna: { x: 108, y: 215 },
  lisan_taraf_noon: { x: 98, y: 209 },
  lisan_taraf_ra: { x: 104, y: 202 },
  lisan_tarf_nitaa: { x: 92, y: 200 },
  lisan_tarf_safir: { x: 89, y: 215 },
  lisan_tarf_lithah: { x: 83, y: 208 },
  shafatan_batn: { x: 71, y: 207 },
  shafatan_meem: { x: 62, y: 199 },
};

/**
 * Mid-sagittal profile, facing left. Drawn as an actual head — forehead, brow
 * ridge, nose, philtrum, lips, chin, jaw and neck — rather than a rounded
 * blob, because a learner needs to recognise where their own face is before
 * an articulation point means anything.
 */
const HEAD =
  'M 168 22 C 130 22 103 41 92 73 C 85 93 85 109 80 121 ' +
  'C 78 127 74 129 70 133 L 62 141 ' +
  'C 52 153 42 165 36 173 C 32 179 36 184 44 185 ' +
  'C 54 187 62 189 68 191 C 62 197 60 201 62 206 ' +
  'C 66 211 70 213 75 214 C 69 219 67 224 69 230 ' +
  'C 73 239 79 245 87 250 C 97 257 111 263 125 267 ' +
  'C 141 271 152 273 158 277 L 158 338 L 246 338 ' +
  'C 250 300 254 270 258 240 C 266 200 272 170 268 130 ' +
  'C 262 80 220 22 168 22 Z';

const NASAL = 'M 60 151 C 86 139 120 137 150 145 L 154 167 C 120 171 84 171 62 165 Z';
const ORAL = 'M 78 197 C 112 189 145 189 164 195 C 172 207 166 219 152 225 C 120 233 92 231 76 221 Z';
const TONGUE = 'M 74 223 C 100 203 145 201 172 217 C 182 225 176 241 156 247 C 122 253 88 245 74 235 Z';
const PHARYNX = 'M 172 213 C 186 233 190 263 186 297 L 214 301 C 218 265 212 235 200 209 Z';
const LIP_UPPER = 'M 56 189 C 65 185 76 188 85 193 L 81 201 C 70 197 62 197 54 199 Z';
const LIP_LOWER = 'M 54 207 C 63 205 74 206 83 210 L 79 218 C 68 215 60 215 52 217 Z';
const PALATE = 'M 82 193 C 112 185 142 185 162 191';

/** Face detail — not anatomy, but what makes the outline read as a head. */
const EAR = 'M 201 161 C 215 157 223 167 221 179 C 219 191 209 197 203 193 C 209 185 207 171 201 161 Z';
const BROW = 'M 85 121 C 94 115 107 114 116 118';
const NOSTRIL = 'M 43 177 C 49 174 55 175 59 178';
const JAW_LINE = 'M 96 254 C 118 266 140 272 158 277';

const GROUP_SHAPES: Record<ZoneGroup, string[]> = {
  khayshum: [NASAL],
  jawf: [ORAL],
  lisan: [TONGUE],
  halq: [PHARYNX],
  shafatan: [LIP_UPPER, LIP_LOWER],
};

export interface MakhrajDiagramProps {
  activeZone: MakhrajId | null;
  onZoneSelect?: (id: MakhrajId) => void;
  /** Secondary zones lit more faintly — e.g. every zone a whole word touches. */
  relatedZones?: MakhrajId[];
  className?: string;
}

export const MakhrajDiagram = memo(function MakhrajDiagram({
  activeZone,
  onZoneSelect,
  relatedZones = [],
  className = '',
}: MakhrajDiagramProps) {
  const t = useT();
  const activeGroup = activeZone ? MAKHRAJ_ZONES[activeZone].group : null;
  const relatedGroups = useMemo(
    () => new Set(relatedZones.map((z) => MAKHRAJ_ZONES[z].group)),
    [relatedZones],
  );

  /**
   * Resting fills differ by tissue type so the section reads as anatomy rather
   * than one flat silhouette: the air spaces (nose, mouth, throat) are painted
   * in the page background so they look hollow, while the tongue and lips are
   * solid muscle.
   */
  const BASE_FILL: Record<ZoneGroup, string> = {
    khayshum: 'rgb(var(--tj-surface))',
    jawf: 'rgb(var(--tj-surface))',
    halq: 'rgb(var(--tj-surface))',
    lisan: 'rgb(var(--tj-accent) / 0.32)',
    shafatan: 'rgb(var(--tj-accent) / 0.42)',
  };

  const shapeFill = (g: ZoneGroup) =>
    activeGroup === g
      ? 'rgb(var(--tj-accent) / 0.8)'
      : relatedGroups.has(g)
        ? 'rgb(var(--tj-accent) / 0.45)'
        : BASE_FILL[g];

  return (
    <svg
      viewBox="0 0 320 340"
      role="img"
      aria-label={
        activeZone
          ? t.t('makhraj.diagramLabelActive', { zone: t.zone(activeZone).name })
          : t.t('makhraj.diagramLabel')
      }
      className={`w-full ${className}`}
    >
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--tj-accent) / 0.13)" />
          <stop offset="100%" stopColor="rgb(var(--tj-accent) / 0.04)" />
        </linearGradient>
      </defs>

      {/* head + neck silhouette */}
      <path d={HEAD} fill="url(#skin)" stroke="rgb(var(--tj-ink) / 0.32)" strokeWidth={2} strokeLinejoin="round" />

      {/* face detail: ear, brow, eye, nostril, jaw — purely so the section
          reads as a face. All non-interactive. */}
      <g aria-hidden="true" pointerEvents="none">
        <path d={EAR} fill="rgb(var(--tj-accent) / 0.1)" stroke="rgb(var(--tj-line))" strokeWidth={1.2} />
        <path d={BROW} fill="none" stroke="rgb(var(--tj-ink) / 0.35)" strokeWidth={2.4} strokeLinecap="round" />
        <ellipse cx={103} cy={130} rx={5.6} ry={3.2} fill="rgb(var(--tj-raised))" stroke="rgb(var(--tj-ink) / 0.35)" strokeWidth={1.1} />
        <circle cx={101} cy={130} r={1.9} fill="rgb(var(--tj-ink) / 0.55)" />
        <path d={NOSTRIL} fill="none" stroke="rgb(var(--tj-ink) / 0.3)" strokeWidth={1.6} strokeLinecap="round" />
        <path d={JAW_LINE} fill="none" stroke="rgb(var(--tj-ink) / 0.14)" strokeWidth={1.4} strokeLinecap="round" />
      </g>

      {/* anatomical regions, each clickable */}
      {(Object.keys(GROUP_SHAPES) as ZoneGroup[]).map((g) =>
        GROUP_SHAPES[g].map((d, i) => (
          <motion.path
            key={`${g}-${i}`}
            d={d}
            animate={{ fill: shapeFill(g) }}
            transition={{ duration: 0.35 }}
            stroke="rgb(var(--tj-ink) / 0.28)"
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
        )),
      )}

      {/* hard palate line, for orientation */}
      <path d={PALATE} fill="none" stroke="rgb(var(--tj-ink) / 0.25)" strokeWidth={1.4} strokeLinecap="round" />
      {/* incisors — the landmark half the tongue makhraj are measured against */}
      <rect x={83} y={193} width={4} height={9} rx={1.2} fill="rgb(var(--tj-ink) / 0.4)" />
      <rect x={83} y={208} width={4} height={9} rx={1.2} fill="rgb(var(--tj-ink) / 0.32)" />

      {/* articulation points */}
      {(Object.keys(MARKERS) as MakhrajId[]).map((id) => {
        const m = MARKERS[id];
        const isActive = id === activeZone;
        const isRelated = relatedZones.includes(id);
        return (
          <g
            key={id}
            onClick={() => onZoneSelect?.(id)}
            className={onZoneSelect ? 'cursor-pointer' : ''}
            role={onZoneSelect ? 'button' : undefined}
            aria-label={t.zone(id).name}
          >
            {isActive && (
              <motion.circle
                cx={m.x}
                cy={m.y}
                r={6}
                fill="rgb(var(--tj-accent))"
                initial={{ opacity: 0.55, scale: 1 }}
                animate={{ opacity: [0.5, 0, 0.5], scale: [1, 2.6, 1] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
                style={{ transformOrigin: `${m.x}px ${m.y}px` }}
              />
            )}
            <circle
              cx={m.x}
              cy={m.y}
              r={isActive ? 5.4 : isRelated ? 4.2 : 3}
              fill={isActive ? 'rgb(var(--tj-accent))' : isRelated ? 'rgb(var(--tj-accent) / 0.6)' : 'rgb(var(--tj-ink) / 0.3)'}
              stroke="rgb(var(--tj-raised))"
              strokeWidth={1.4}
            />
            {/* invisible, finger-sized hit area */}
            <circle cx={m.x} cy={m.y} r={13} fill="transparent" />
          </g>
        );
      })}

      {/* orientation labels */}
      <text x={26} y={228} fontSize={9} fill="rgb(var(--tj-muted))" textAnchor="middle">{t.t('makhraj.lips')}</text>
      <text x={132} y={132} fontSize={9} fill="rgb(var(--tj-muted))" textAnchor="middle">{t.t('makhraj.nasal')}</text>
      <text x={236} y={276} fontSize={9} fill="rgb(var(--tj-muted))" textAnchor="middle">{t.t('makhraj.throat')}</text>
      <text x={126} y={264} fontSize={9} fill="rgb(var(--tj-muted))" textAnchor="middle">{t.t('makhraj.tongue')}</text>
    </svg>
  );
});

/* ===========================================================================
   MakhrajVisualizer — diagram + live description, driven by a letter.
   =========================================================================== */

export interface MakhrajVisualizerProps {
  /** Arabic text whose letters become the selectable chips (usually one word). */
  text: string;
  /** Pre-select this letter. */
  initialLetter?: string | null;
  /** Every zone the parent word touches, lit faintly behind the active one. */
  relatedZones?: MakhrajId[];
  compact?: boolean;
}

export function MakhrajVisualizer({
  text,
  initialLetter = null,
  relatedZones = [],
  compact = false,
}: MakhrajVisualizerProps) {
  const t = useT();
  /**
   * Arabic only, and each letter once.
   *
   * Callers pass arbitrary strings — a Qur'anic word, or the letters of several
   * zones concatenated. Latin characters that slip through render as stray
   * chips, and zones overlap (و belongs to both al-jawf and the lips), so
   * without a de-dupe the same letter appears twice with no way to tell the
   * two chips apart.
   */
  const letters = useMemo(() => {
    const seen: string[] = [];
    for (const c of Array.from(stripMarks(text))) {
      if (!isArabicLetter(c.codePointAt(0) ?? 0)) continue;
      if (!seen.includes(c)) seen.push(c);
    }
    return seen;
  }, [text]);
  const [letter, setLetter] = useState<string | null>(
    initialLetter ?? letters.find((l) => makhrajForLetter(l.codePointAt(0)!)) ?? null,
  );
  const [manualZone, setManualZone] = useState<MakhrajId | null>(null);

  const zoneId: MakhrajId | null =
    manualZone ?? (letter ? makhrajForLetter(letter.codePointAt(0)!) : null);
  const zone = zoneId ? t.zone(zoneId) : null;

  return (
    <div className={compact ? 'grid gap-4' : 'grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'}>
      <div className="panel relative overflow-hidden p-2">
        <MakhrajDiagram
          activeZone={zoneId}
          relatedZones={relatedZones}
          onZoneSelect={(id) => {
            setManualZone(id);
            setLetter(null);
          }}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
            {t.t('makhraj.tapLetter')}
          </p>
          <div dir="rtl" className="flex flex-wrap gap-1.5">
            {letters.map((l, i) => {
              const has = !!makhrajForLetter(l.codePointAt(0)!);
              const selected = letter === l && !manualZone;
              return (
                <button
                  key={`${l}-${i}`}
                  type="button"
                  disabled={!has}
                  onClick={() => {
                    setLetter(l);
                    setManualZone(null);
                  }}
                  className={[
                    'arabic flex h-11 w-11 items-center justify-center rounded-lg border text-2xl leading-none transition',
                    selected
                      ? 'border-accent bg-accent/15 text-ink'
                      : has
                        ? 'border-line bg-raised text-ink hover:border-accent/50'
                        : 'border-transparent text-silent',
                  ].join(' ')}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {zone && (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="panel p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-sm font-semibold text-ink">{zone.name}</h4>
                <span className="arabic text-xl text-accent">{zone.nameAr}</span>
              </div>

              {lettersOfZone(zone.id).length > 0 && (
                <div dir="rtl" className="mt-2.5 flex flex-wrap gap-1.5">
                  {lettersOfZone(zone.id).map((l) => (
                    <span
                      key={l}
                      className="arabic inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-lg text-ink"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 text-[13px] leading-relaxed text-muted">{zone.description}</p>
              <p className="mt-2.5 rounded-lg bg-accent/[0.08] px-3 py-2 text-[13px] leading-relaxed text-ink">
                <span className="font-semibold">{t.t('makhraj.tryIt')}</span>
                {zone.cue}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
