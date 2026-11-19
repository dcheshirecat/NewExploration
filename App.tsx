import { PixelifySans_700Bold, useFonts } from '@expo-google-fonts/pixelify-sans';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toasts } from './src/components/Toasts';
import { BudgetScreen, type BudgetTab } from './src/screens/BudgetScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { HomeScreen, type Nav } from './src/screens/HomeScreen';
import { InsightsScreen, type InsightsTab } from './src/screens/InsightsScreen';
import { PetsScreen, type PetsTab } from './src/screens/PetsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StoreProvider, useStore } from './src/store';
import { getMonthKey } from './src/utils';
import { LoadingScreen } from './src/components/LoadingScreen';
import { lightTheme, PIXEL_FONT } from './src/theme';

type Tab = 'home' | 'budget' | 'insights' | 'goals' | 'pets';
const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'home', icon: '🏠', label: 'Home' },
  { key: 'budget', icon: '🫙', label: 'Budget' },
  { key: 'insights', icon: '📊', label: 'Insights' },
  { key: 'goals', icon: '🎯', label: 'Goals' },
  { key: 'pets', icon: '🐾', label: 'Pets' },
];

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ PixelifySans_700Bold });
  if (!fontsLoaded && !fontError) return <LoadingScreen theme={lightTheme} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Main />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Main() {
  const { theme, data, setSection } = useStore();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('home');
  const [settings, setSettings] = useState(false);
  const [selKey, setSelKey] = useState(getMonthKey());
  const [budgetTab, setBudgetTab] = useState<BudgetTab>('jar');
  const [insightsTab, setInsightsTab] = useState<InsightsTab>('charts');
  const [petsTab, setPetsTab] = useState<PetsTab>('pets');
  const scroll = useRef<ScrollView>(null);

  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [tab, settings, budgetTab, insightsTab, petsTab]);
  useEffect(() => { setSection(settings ? 'settings' : tab); }, [tab, settings, setSection]);

  // Android back button: close settings / go home instead of quitting
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settings) { setSettings(false); return true; }
      if (tab !== 'home') { setTab('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [settings, tab]);

  const go: Nav = (t, sub) => {
    setSettings(false);
    setTab(t);
    if (t === 'budget' && sub) { setBudgetTab(sub as BudgetTab); setSelKey(getMonthKey()); }
    if (t === 'insights' && sub) setInsightsTab(sub as InsightsTab);
    if (t === 'pets' && sub) setPetsTab(sub as PetsTab);
  };

  const sadPets = data.game.pets.some(p => (p.hunger + p.happiness + p.health) / 3 < 35);
  const readyEggs = data.game.incubating.some(i => Date.now() - i.startTime >= i.duration);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bg }}>
        <Text style={{ flex: 1, color: theme.text, fontSize: 20, fontFamily: PIXEL_FONT }}>Dini&apos;s Money Jar</Text>
        <Pressable onPress={() => go('pets', 'wallet')} style={{ backgroundColor: theme.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.text, fontFamily: PIXEL_FONT, fontSize: 15 }}>🪙 {data.game.coins}</Text>
        </Pressable>
        <Pressable accessibilityLabel="Settings" onPress={() => setSettings(s => !s)} style={{ width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: settings ? theme.primary : theme.card, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ fontSize: 18 }}>⚙️</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32, width: '100%', maxWidth: 640, alignSelf: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {settings ? <SettingsScreen onClose={() => setSettings(false)} /> : (
            <>
              {tab === 'home' && <HomeScreen go={go} />}
              {tab === 'budget' && <BudgetScreen selKey={selKey} setSelKey={setSelKey} tab={budgetTab} setTab={setBudgetTab} />}
              {tab === 'insights' && <InsightsScreen selKey={selKey} setSelKey={setSelKey} tab={insightsTab} setTab={setInsightsTab} openMonth={k => { setSelKey(k); setTab('budget'); setBudgetTab('jar'); }} />}
              {tab === 'goals' && <GoalsScreen />}
              {tab === 'pets' && <PetsScreen tab={petsTab} setTab={setPetsTab} />}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ flexDirection: 'row', backgroundColor: theme.tabBar, borderTopWidth: 1, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 6 }}>
        {TABS.map(t => {
          const active = !settings && tab === t.key;
          const dot = t.key === 'pets' && (sadPets || readyEggs);
          return (
            <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => go(t.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999, backgroundColor: active ? theme.sections[t.key].accent : 'transparent' }}>
                <Text style={{ fontSize: 20 }}>{t.icon}</Text>
                {dot && <View style={{ position: 'absolute', top: 2, right: 10, width: 9, height: 9, borderRadius: 999, backgroundColor: theme.accent }} />}
              </View>
              <Text style={{ fontSize: 11, fontWeight: active ? '900' : '600', color: active ? theme.text : theme.textFaint, marginTop: 2 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Toasts bottom={Math.max(insets.bottom, 8) + 62} />
    </View>
  );
}
