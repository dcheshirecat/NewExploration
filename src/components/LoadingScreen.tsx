import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../theme';

export function LoadingScreen({ theme }: { theme: Theme }) {
  const jarY = useRef(new Animated.Value(0)).current;
  const moneyA = useRef(new Animated.Value(-80)).current;
  const moneyB = useRef(new Animated.Value(-120)).current;
  const opA = useRef(new Animated.Value(0)).current;
  const opB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drop = (v: Animated.Value, op: Animated.Value, from: number, dur: number, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(op, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(v, { toValue: 170, duration: dur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(op, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(v, { toValue: from, duration: 1, useNativeDriver: true }),
      ]));
    const bounce = Animated.loop(Animated.sequence([
      Animated.timing(jarY, { toValue: -6, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(jarY, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const anims = [bounce, drop(moneyA, opA, -80, 1050, 0), drop(moneyB, opB, -120, 1120, 300)];
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, [jarY, moneyA, moneyB, opA, opB]);

  return (
    <View style={[s.screen, { backgroundColor: '#24134d' }]}>
      <StatusBar style="light" />
      <Text style={s.brand}>Dini&apos;s Money Jar</Text>
      <Text style={s.title}>Counting coins, waking up pets, loading your months…</Text>
      <View style={s.stage}>
        <Animated.View style={[s.bill, { left: 60, top: 20, opacity: opA, transform: [{ translateY: moneyA }, { rotate: '-10deg' }] }]}>
          <Text style={s.billText}>₪</Text>
        </Animated.View>
        <Animated.View style={[s.bill, { right: 60, top: 0, opacity: opB, transform: [{ translateY: moneyB }, { rotate: '8deg' }] }]}>
          <Text style={s.billText}>₪</Text>
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: jarY }], alignItems: 'center' }}>
          <View style={s.lid} />
          <View style={s.jar}><View style={[s.fill, { backgroundColor: theme.jarFill }]} /></View>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 14 },
  brand: { color: '#fff2a8', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', lineHeight: 32, textAlign: 'center', maxWidth: 320 },
  stage: { width: 260, height: 330, justifyContent: 'flex-end', alignItems: 'center' },
  bill: { position: 'absolute', width: 64, height: 34, borderRadius: 8, backgroundColor: '#d7ffd7', borderWidth: 2, borderColor: '#61b26b', justifyContent: 'center', alignItems: 'center' },
  billText: { color: '#2c7a3b', fontSize: 16, fontWeight: '900' },
  lid: { width: 150, height: 28, borderRadius: 18, backgroundColor: '#ff5d8f', marginBottom: -4, zIndex: 2 },
  jar: { width: 180, height: 230, borderRadius: 54, borderWidth: 6, borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(189,234,255,0.16)', justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { marginHorizontal: 10, marginBottom: 10, height: 108, borderRadius: 34 },
});
