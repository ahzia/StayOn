import type { ReactNode } from 'react';

type CodeBlockProps = {
  children: ReactNode;
  accent?: boolean;
};

export function CodeBlock({ children, accent }: CodeBlockProps) {
  return (
    <pre
      className={[
        'overflow-x-auto rounded-lg p-4 font-mono text-sm leading-relaxed',
        accent ? 'bg-code text-code-accent' : 'bg-code text-code-text',
      ].join(' ')}
    >
      {children}
    </pre>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-sm text-foreground">
      {children}
    </code>
  );
}
