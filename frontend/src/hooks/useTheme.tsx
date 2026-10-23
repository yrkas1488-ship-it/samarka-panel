import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

const STORAGE_DARK = 'dark-mode';
const STORAGE_ULTRA = 'isUltraDarkThemeEnabled';

function readBool(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === 'true';
}

function applyDom(isDark: boolean, isUltra: boolean) {
  document.body.setAttribute('class', isDark ? 'dark' : 'light');
  if (isUltra) {
    document.documentElement.setAttribute('data-theme', 'ultra-dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const msg = document.getElementById('message');
  if (msg) msg.className = isDark ? 'dark' : 'light';
}

// module load so the document is in the right theme before React mounts.
const initialDark = readBool(STORAGE_DARK, true);
const initialUltra = readBool(STORAGE_ULTRA, false);
applyDom(initialDark, initialUltra);

const DARK_TOKENS = {
  colorBgBase: '#090a0f',
  colorBgLayout: '#090a0f',
  colorBgContainer: '#12141d',
  colorBgElevated: '#171a26',
  colorPrimary: '#8b5cf6',
  colorPrimaryHover: '#a78bfa',
  colorLink: '#8b5cf6',
  colorLinkHover: '#a78bfa',
  colorBorder: 'rgba(255, 255, 255, 0.08)',
  colorBorderSecondary: 'rgba(255, 255, 255, 0.05)',
  colorSuccess: '#10b981',
  colorWarning: '#f59e0b',
  colorError: '#f43f5e',
  colorInfo: '#6366f1',
  borderRadius: 12,
  borderRadiusLG: 16,
  borderRadiusSM: 8,
};
const ULTRA_DARK_TOKENS = {
  colorBgBase: '#050608',
  colorBgLayout: '#050608',
  colorBgContainer: '#0c0e14',
  colorBgElevated: '#12141c',
  colorPrimary: '#8b5cf6',
  colorPrimaryHover: '#a78bfa',
  colorLink: '#8b5cf6',
  colorLinkHover: '#a78bfa',
  colorBorder: 'rgba(255, 255, 255, 0.06)',
  colorBorderSecondary: 'rgba(255, 255, 255, 0.04)',
  colorSuccess: '#10b981',
  colorWarning: '#f59e0b',
  colorError: '#f43f5e',
  colorInfo: '#6366f1',
  borderRadius: 12,
  borderRadiusLG: 16,
  borderRadiusSM: 8,
};
const DARK_LAYOUT_TOKENS = {
  bodyBg: '#090a0f',
  headerBg: '#0b0d14',
  headerColor: '#ffffff',
  footerBg: '#090a0f',
  siderBg: '#0b0d14',
  triggerBg: '#12141d',
  triggerColor: '#ffffff',
};
const ULTRA_DARK_LAYOUT_TOKENS = {
  bodyBg: '#050608',
  headerBg: '#07080c',
  headerColor: '#ffffff',
  footerBg: '#050608',
  siderBg: '#07080c',
  triggerBg: '#0c0e14',
  triggerColor: '#ffffff',
};
const DARK_MENU_TOKENS = {
  darkItemBg: '#0b0d14',
  darkSubMenuItemBg: '#090a0f',
  darkPopupBg: '#12141d',
  darkItemSelectedBg: 'rgba(139, 92, 246, 0.2)',
  darkItemSelectedColor: '#ffffff',
  itemBorderRadius: 10,
};
const ULTRA_DARK_MENU_TOKENS = {
  darkItemBg: '#07080c',
  darkSubMenuItemBg: '#050608',
  darkPopupBg: '#0c0e14',
  darkItemSelectedBg: 'rgba(139, 92, 246, 0.22)',
  darkItemSelectedColor: '#ffffff',
  itemBorderRadius: 10,
};
const DARK_CARD_TOKENS = {
  colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
};
const ULTRA_DARK_CARD_TOKENS = {
  colorBorderSecondary: 'rgba(255, 255, 255, 0.05)',
};
const STATISTIC_TOKENS = {
  contentFontSize: 17,
  titleFontSize: 11,
};

export function buildAntdThemeConfig(isDark: boolean, isUltra: boolean): ThemeConfig {
  if (!isDark) {
    return {
      algorithm: antdTheme.defaultAlgorithm,
      components: {
        Statistic: STATISTIC_TOKENS,
      },
    };
  }
  return {
    algorithm: antdTheme.darkAlgorithm,
    token: isUltra ? ULTRA_DARK_TOKENS : DARK_TOKENS,
    components: {
      Layout: isUltra ? ULTRA_DARK_LAYOUT_TOKENS : DARK_LAYOUT_TOKENS,
      Menu: isUltra ? ULTRA_DARK_MENU_TOKENS : DARK_MENU_TOKENS,
      Card: isUltra ? ULTRA_DARK_CARD_TOKENS : DARK_CARD_TOKENS,
      Statistic: STATISTIC_TOKENS,
    },
  };
}

export function pauseAnimationsUntilLeave(elementId: string): void {
  document.documentElement.setAttribute('data-theme-animations', 'off');
  const el = document.getElementById(elementId);
  if (!el) return;
  const restore = () => {
    document.documentElement.removeAttribute('data-theme-animations');
    el.removeEventListener('mouseleave', restore);
    el.removeEventListener('touchend', restore);
  };
  el.addEventListener('mouseleave', restore);
  el.addEventListener('touchend', restore);
}

interface ThemeContextValue {
  isDark: boolean;
  isUltra: boolean;
  toggleTheme: () => void;
  toggleUltra: () => void;
  antdThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(initialDark);
  const [isUltra, setIsUltra] = useState<boolean>(initialUltra);

  useEffect(() => {
    applyDom(isDark, isUltra);
    localStorage.setItem(STORAGE_DARK, String(isDark));
    localStorage.setItem(STORAGE_ULTRA, String(isUltra));
  }, [isDark, isUltra]);

  const toggleTheme = useCallback(() => setIsDark((v) => !v), []);
  const toggleUltra = useCallback(() => setIsUltra((v) => !v), []);

  const antdThemeConfig = useMemo(() => buildAntdThemeConfig(isDark, isUltra), [isDark, isUltra]);

  const value = useMemo<ThemeContextValue>(
    () => ({ isDark, isUltra, toggleTheme, toggleUltra, antdThemeConfig }),
    [isDark, isUltra, toggleTheme, toggleUltra, antdThemeConfig],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
