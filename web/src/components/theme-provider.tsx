'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { themeStorageKey } from '@/theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={themeStorageKey}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
