import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../store';

/** Animated money jar. `level` is 0..1 (how full). */
export function Jar({ level, size = 1, label }: { level: number; size?: number; label?: string }) {
  const t = useTheme();
  const H = 280 * size;
  const W = 210 * size;
  const fill = useRef(new Animated.Value(0)).current;
  const bob = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const lv = Math.max(0, Math.min(1, level));
  const fillH = 20 * size + lv * (H - 40 * size);

  useEffect(() => {
    Animated.spring(fill, { toValue: fillH, friction: 10, tension: 55, useNativeDriver: false }).start();
  }, [fillH, fill]);

  useEffect(() => {
    const anims = bob.map((v, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 220),
      Animated.timing(v, { toValue: -(3 + (i % 3)), duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])));
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fillColor = lv < 0.15 ? '#ff8a80' : lv < 0.35 ? '#ffd166' : t.jarFill;
  // Coins/bills appear only up to the fill level
  const items = [
    { kind: 'coin', bottom: 0.14, left: 0.18 },
    { kind: 'coin', bottom: 0.1, left: 0.52 },
    { kind: 'bill', bottom: 0.32, left: 0.12 },
    { kind: 'coin', bottom: 0.42, left: 0.6 },
    { kind: 'bill', bottom: 0.55, left: 0.45 },
  ].filter(it => it.bottom < lv * 0.95);

  return (
    <View style={{ alignItems: 'center', paddingVertical: 6 }}>
      <View style={[s.lid, { width: W * 0.8, height: 24 * size, backgroundColor: t.accent }]} />
      <View style={[s.glass, { width: W, height: H, borderRadius: 60 * size, borderColor: t.dark ? 'rgba(255,255,255,0.35)' : '#c9b6f2', backgroundColor: t.jarGlass }]}>
        <Animated.View style={[s.fill, { height: fill, backgroundColor: fillColor, borderRadius: 44 * size }]} />
        {items.map((it, i) => (
          <Animated.View
            key={i}
            style={[
              it.kind === 'coin' ? s.coin : s.bill,
              { bottom: it.bottom * H, left: it.left * W, transform: [{ translateY: bob[i % bob.length] }, { rotate: it.kind === 'bill' ? (i % 2 ? '7deg' : '-8deg') : '0deg' }, { scale: size }] },
            ]}
          >
            <Text style={it.kind === 'coin' ? s.coinText : s.billText}>₪</Text>
          </Animated.View>
        ))}
        {label ? (
          <View style={s.labelWrap}><Text style={[s.label, { color: t.dark ? '#fff' : '#241042' }]}>{label}</Text></View>
        ) : null}
        <View style={s.shine} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  lid: { borderRadius: 14, marginBottom: -4, zIndex: 2 },
  glass: { borderWidth: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  fill: { position: 'absolute', bottom: 0, left: 10, right: 10 },
  coin: { position: 'absolute', width: 38, height: 38, borderRadius: 999, backgroundColor: '#ffe38a', borderWidth: 2, borderColor: '#c9960a', justifyContent: 'center', alignItems: 'center' },
  coinText: { color: '#7a5c00', fontSize: 13, fontWeight: '900' },
  bill: { position: 'absolute', width: 66, height: 34, borderRadius: 8, backgroundColor: '#d7ffd7', borderWidth: 2, borderColor: '#61b26b', justifyContent: 'center', alignItems: 'center' },
  billText: { color: '#2c7a3b', fontSize: 15, fontWeight: '900' },
  labelWrap: { position: 'absolute', top: 18, left: 0, right: 0, alignItems: 'center' },
  label: { fontWeight: '900', fontSize: 22 },
  shine: { position: 'absolute', top: 30, left: 18, width: 14, height: 90, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' },
});
