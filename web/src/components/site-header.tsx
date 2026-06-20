import Link from 'next/link';
import { StayOnMark } from './stayon-mark';
import { ThemeToggle } from './theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-90">
          <StayOnMark size={28} />
          <span className="font-semibold tracking-tight">StayOn</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/setup" className="text-muted transition-colors hover:text-foreground">
            Setup
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
