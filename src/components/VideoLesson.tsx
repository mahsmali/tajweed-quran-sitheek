'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n/useT';

export interface VideoLessonProps {
  videoId: string;
  /** The creator's own title — never translated; it is their words. */
  title: string;
  channel: string;
  channelUrl: string;
  className?: string;
}

/**
 * A YouTube lesson embedded as a "facade": until the learner presses play we
 * render nothing but a thumbnail and a button.
 *
 * Why not a plain <iframe>: YouTube's embed pulls roughly a megabyte of
 * JavaScript and sets third-party cookies on page load, whether or not anyone
 * watches. On the home page of a study app — which most visitors open to read,
 * not to watch — that is a large tax on the first paint and an unasked-for
 * tracker. The facade costs one image, and the real player is swapped in on
 * the click that actually needs it.
 *
 * `youtube-nocookie.com` is used for the same reason.
 */
export function VideoLesson({ videoId, title, channel, channelUrl, className = '' }: VideoLessonProps) {
  const t = useT();
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <figure className={`panel m-0 overflow-hidden ${className}`}>
      <div className="relative aspect-video w-full bg-ink/[0.06]">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={t.t('video.playAria', { title, channel })}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote
                thumbnail with a runtime fallback; next/image would need the
                host allow-listed and gives nothing back here. */}
            <img
              src={thumb}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setThumb(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            {/* Black, not `ink`. This scrim sits over a photograph rather than
                over the app's own surface, and `ink` inverts to cream in dark
                mode — which turned the gradient behind the white caption into a
                *light* wash and made the title unreadable on exactly the theme
                most people read this page in. */}
            <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 transition-opacity duration-300 group-hover:opacity-80" />

            <motion.span
              aria-hidden="true"
              initial={false}
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent shadow-anchor-glow"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </motion.span>
          </button>
        )}
      </div>

      {/* The title sits UNDER the artwork, not on it.
          This thumbnail already carries the words "ALL BASIC TAJWEED RULES IN
          1 VIDEO" at poster size, plus a rule-by-rule contents list; laying a
          second copy of the same sentence over the top of it produced two
          overlapping blocks of text and no legible reading of either. Below
          the image the creator's title is readable in both themes, at full
          contrast, and is no longer competing with their own artwork. */}
      {!playing && (
        <div className="border-t border-line px-4 pb-3 pt-3">
          <p className="eyebrow">{t.t('video.duration')}</p>
          <p className="mt-1.5 text-[13.5px] font-semibold leading-snug text-ink">{title}</p>
        </div>
      )}

      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <span className="min-w-0 text-[11.5px] text-muted">
          {t.t('video.byChannel', { channel })}
          {!playing && <span className="ml-1.5 opacity-70">· {t.t('video.privacyNote')}</span>}
        </span>
        <span className="flex shrink-0 gap-3">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11.5px] font-medium text-muted underline decoration-dotted underline-offset-4 hover:text-ink"
          >
            {channel}
          </a>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11.5px] font-medium text-accent underline decoration-dotted underline-offset-4 hover:brightness-110"
          >
            {t.t('video.watchOnYouTube')} ↗
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
