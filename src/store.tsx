import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Platform, useColorScheme } from 'react-native';
import { LoadingScreen } from './components/LoadingScreen';
import { applyRecurring, payPeriodBonuses } from './actions';
import { applyDecay, COINS, earn } from './game';
import { loadData, saveData } from './storage';
import { darkTheme, lightTheme, type Theme } from './theme';
import type { AppData } from './types';

type Updater = (draft: AppData) => void | string | string[];

type Store = {
  data: AppData;
  ready: boolean;
  theme: Theme;
  /** Mutate a copy of the data; any returned strings are shown as toasts. */
  update: (fn: Updater) => void;
  /** Replace all data (restore from backup). */
  replaceAll: (next: AppData) => void;
  toast: (msg: string | string[]) => void;
  toasts: { id: number; text: string }[];
  /** ticks every second-ish so timers (incubators) re-render */
  now: number;
};

const Ctx = createContext<Store | null>(null);

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const dataRef = useRef<AppData | null>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [now, setNow] = useState(Date.now());
  const toastId = useRef(0);
  const scheme = useColorScheme();

  const toast = useCallback((msg: string | string[]) => {
    const list = (Array.isArray(msg) ? msg : [msg]).filter(Boolean);
    if (!list.length) return;
    list.forEach((text, i) => {
      const id = ++toastId.current;
      setTimeout(() => setToasts(cur => [...cur, { id, text }].slice(-3)), i * 900);
      setTimeout(() => setToasts(cur => cur.filter(t => t.id !== id)), i * 900 + 3400);
    });
  }, []);

  const commit = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const update = useCallback((fn: Updater) => {
    if (!dataRef.current) return;
    const draft = clone(dataRef.current);
    const res = fn(draft);
    commit(draft);
    if (res) toast(res);
  }, [commit, toast]);

  const replaceAll = useCallback((next: AppData) => commit(clone(next)), [commit]);

  // Load + start-of-session housekeeping
  useEffect(() => {
    let mounted = true;
    (async () => {
      const started = Date.now();
      let loaded: AppData;
      let migrated = false;
      try {
        const r = await loadData();
        loaded = r.data; migrated = r.migrated;
      } catch {
        loaded = (await import('./storage')).defaultData();
      }
      const msgs: string[] = [];
      if (migrated) msgs.push('✨ Welcome to the new Money Jar! Your data came along.');
      if (!loaded.game.welcomeGiven) {
        loaded.game.welcomeGiven = true;
        earn(loaded.game, COINS.welcome, 'Welcome bonus');
        msgs.push(`🎁 Welcome gift: ${COINS.welcome} coins to hatch your first pet!`);
      }
      applyDecay(loaded.game);
      msgs.push(...applyRecurring(loaded));
      msgs.push(...payPeriodBonuses(loaded));
      // keep the loading animation on screen for a moment
      await new Promise(r => setTimeout(r, Math.max(0, 1400 - (Date.now() - started))));
      if (!mounted) return;
      commit(loaded);
      toast(msgs);
    })();
    return () => { mounted = false; };
  }, [commit, toast]);

  // Persist (debounced)
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => {
      saveData(data).catch(() => toast('⚠️ Could not save your latest changes'));
    }, 250);
    return () => clearTimeout(t);
  }, [data, toast]);

  // Clock: re-render timers each second, decay pets + check recurring each minute
  useEffect(() => {
    if (!data) return;
    const sec = setInterval(() => setNow(Date.now()), 1000);
    const min = setInterval(() => {
      update(d => {
        applyDecay(d.game);
        return [...applyRecurring(d), ...payPeriodBonuses(d)];
      });
    }, 60000);
    return () => { clearInterval(sec); clearInterval(min); };
  }, [!!data, update]); // eslint-disable-line react-hooks/exhaustive-deps

  const mode = data?.settings.theme ?? 'system';
  const theme = mode === 'dark' || (mode === 'system' && scheme === 'dark') ? darkTheme : lightTheme;

  const value = useMemo<Store | null>(() => data ? ({
    data, ready: true, theme, update, replaceAll, toast, toasts, now,
  }) : null, [data, theme, update, replaceAll, toast, toasts, now]);

  if (!value) return <LoadingScreen theme={theme} />;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}


export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside provider');
  return s;
}

export function useTheme() { return useStore().theme; }

/** Cross-platform confirm dialog. */
export function confirmAction(title: string, message: string, confirmText: string, onConfirm: () => void, destructive = true) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
