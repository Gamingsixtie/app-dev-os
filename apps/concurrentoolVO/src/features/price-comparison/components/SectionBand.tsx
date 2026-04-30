import type { ReactNode } from 'react';

interface SectionBandProps {
  bg?: 'bg-white' | 'bg-neutral-50';
  children: ReactNode;
}

/** Full-bleed section wrapper with alternating background colors (D-15). */
export function SectionBand({ bg = 'bg-white', children }: SectionBandProps) {
  return (
    <section className={`${bg} py-8`}>
      <div className="max-w-[960px] mx-auto px-4 sm:px-8">
        {children}
      </div>
    </section>
  );
}
