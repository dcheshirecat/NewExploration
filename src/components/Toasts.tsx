import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';

function ToastItem({ text }: { text: string }) {
  const { theme } = useStore();
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(a, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start(); }, [a]);
  return (
    <Animated.View style={[s.toast, { backgroundColor: theme.dark ? '#f0eaff' : '#241042', opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <Text style={[s.text, { color: theme.dark ? '#241042' : '#fff' }]}>{text}</Text>
    </Animated.View>
  );
}

export function Toasts({ bottom }: { bottom: number }) {
  const { toasts } = useStore();
  if (!toasts.length) return null;
  return (
    <View pointerEvents="none" style={[s.wrap, { bottom: bottom + 10 }]}>
      {toasts.slice(-2).map(t => <ToastItem key={t.id} text={t.text} />)}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, gap: 8, alignItems: 'center', zIndex: 100 },
  toast: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, maxWidth: 480, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  text: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
});
