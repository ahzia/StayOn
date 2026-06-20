import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  raised?: boolean;
};

export function Card({ children, className = '', raised = false }: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border border-border p-5',
        raised ? 'bg-surface-raised shadow-md' : 'bg-surface shadow-sm',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
