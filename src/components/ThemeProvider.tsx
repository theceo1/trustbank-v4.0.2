'use client';

import * as React from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { ThemeProviderProps as NextThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: NextThemeProviderProps) {
  return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
} 