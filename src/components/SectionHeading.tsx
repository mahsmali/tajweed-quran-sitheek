import type { ReactNode } from 'react';

export interface SectionHeadingProps {
  /** Small caps label above the title. */
  eyebrow?: string;
  title: ReactNode;
  blurb?: ReactNode;
  /** Right-hand slot for controls that belong to the section. */
  action?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'lg' | 'md' | 'sm';
  className?: string;
}

const SIZE = {
  lg: 'text-[clamp(1.5rem,3vw,2rem)]',
  md: 'text-[1.15rem] sm:text-[1.3rem]',
  sm: 'text-[1rem]',
};

/**
 * One heading treatment, used everywhere.
 *
 * Every screen had grown its own eyebrow + title + paragraph stack with
 * slightly different sizes and colours. Centralising it means the vertical
 * rhythm matches from page to page, and a change to the display face lands
 * in one file rather than eight.
 */
export function SectionHeading({
  eyebrow,
  title,
  blurb,
  action,
  as: Tag = 'h2',
  size = 'md',
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag className={`display ${SIZE[size]} ${eyebrow ? 'mt-1.5' : ''} leading-[1.2] text-ink [text-wrap:balance]`}>
          {title}
        </Tag>
        {blurb && (
          <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-muted [text-wrap:pretty]">{blurb}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
