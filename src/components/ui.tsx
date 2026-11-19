import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { useTheme } from '../store';
import type { Theme } from '../theme';

export function useStyles<T extends StyleSheet.NamedStyles<T>>(factory: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => StyleSheet.create(factory(t)), [t]); // eslint-disable-line react-hooks/exhaustive-deps
}

const base = (t: Theme) => ({
  card: { backgroundColor: t.card, borderRadius: 24, padding: 18, gap: 12, borderWidth: t.dark ? 1 : 0, borderColor: t.border, shadowColor: '#3b1d7a', shadowOpacity: t.dark ? 0 : 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: t.dark ? 0 : 2 },
  title: { color: t.text, fontSize: 20, fontWeight: '800' as const },
  heading: { color: t.text, fontSize: 16, fontWeight: '800' as const },
  sub: { color: t.textSoft, fontSize: 14, lineHeight: 20 },
  input: { minWidth: 0, flexShrink: 1, backgroundColor: t.input, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, color: t.text, fontSize: 16 },
  btn: { flexShrink: 0, backgroundColor: t.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' as const, justifyContent: 'center' as const, flexDirection: 'row' as const, gap: 8 },
  btnText: { color: t.primaryText, fontWeight: '800' as const, fontSize: 16 },
  btnSecondary: { backgroundColor: t.chip },
  btnSecondaryText: { color: t.chipText },
  btnGold: { backgroundColor: t.gold },
  btnGoldText: { color: t.goldText },
  btnDanger: { backgroundColor: t.badBg },
  btnDangerText: { color: t.bad },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  btnSmallText: { fontSize: 13 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: t.chip },
  chipText: { color: t.chipText, fontWeight: '700' as const, fontSize: 14 },
  row: { flexDirection: 'row' as const, gap: 12, alignItems: 'center' as const },
  wrap: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  stat: { flex: 1, borderRadius: 18, padding: 14, minHeight: 82, justifyContent: 'space-between' as const },
  statLabel: { color: t.statText, fontWeight: '700' as const, fontSize: 13, opacity: 0.85 },
  statValue: { color: t.statText, fontSize: 19, fontWeight: '900' as const },
  track: { height: 10, borderRadius: 999, backgroundColor: t.chip, overflow: 'hidden' as const },
  seg: { flexDirection: 'row' as const, backgroundColor: t.chip, borderRadius: 999, padding: 4 },
  segItem: { flex: 1, alignItems: 'center' as const, paddingVertical: 9, borderRadius: 999 },
  segItemActive: { backgroundColor: t.card },
  segText: { color: t.textSoft, fontWeight: '700' as const, fontSize: 13 },
  segTextActive: { color: t.text },
  listRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, backgroundColor: t.cardAlt, borderRadius: 18, padding: 12 },
  bar: { width: 8, alignSelf: 'stretch' as const, borderRadius: 999 },
  banner: { borderRadius: 16, padding: 12, flexDirection: 'row' as const, gap: 10, alignItems: 'center' as const },
});

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useStyles(base);
  return <View style={[s.card, style]}>{children}</View>;
}

export function Title({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const s = useStyles(base);
  if (!right) return <Text style={s.title}>{children}</Text>;
  return (
    <View style={[s.row, { justifyContent: 'space-between' }]}>
      <Text style={[s.title, { flex: 1 }]}>{children}</Text>
      {right}
    </View>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  const s = useStyles(base);
  return <Text style={s.heading}>{children}</Text>;
}

export function Sub({ children, style }: { children: ReactNode; style?: any }) {
  const s = useStyles(base);
  return <Text style={[s.sub, style]}>{children}</Text>;
}

export function Input(props: TextInputProps) {
  const s = useStyles(base);
  const t = useTheme();
  return <TextInput placeholderTextColor={t.textFaint} {...props} style={[s.input, props.style]} />;
}

type BtnKind = 'primary' | 'secondary' | 'gold' | 'danger';
export function Btn({ label, onPress, kind = 'primary', small, disabled, style, icon }: { label: string; onPress: () => void; kind?: BtnKind; small?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; icon?: string }) {
  const s = useStyles(base);
  const bg = kind === 'secondary' ? s.btnSecondary : kind === 'gold' ? s.btnGold : kind === 'danger' ? s.btnDanger : null;
  const tx = kind === 'secondary' ? s.btnSecondaryText : kind === 'gold' ? s.btnGoldText : kind === 'danger' ? s.btnDangerText : null;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.btn, bg, small && s.btnSmall, { opacity: disabled ? 0.45 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
    >
      <Text style={[s.btnText, tx, small && s.btnSmallText]}>{icon ? `${icon} ` : ''}{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, color, onPress }: { label: string; active?: boolean; color?: string; onPress: () => void }) {
  const s = useStyles(base);
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: color ?? t.primary }]}>
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useStyles(base);
  return <View style={[s.row, style]}>{children}</View>;
}

export function Wrap({ children }: { children: ReactNode }) {
  const s = useStyles(base);
  return <View style={s.wrap}>{children}</View>;
}

export function Stat({ label, value, tone }: { label: string; value: string; tone: 'pink' | 'green' | 'yellow' | 'purple' }) {
  const s = useStyles(base);
  const t = useTheme();
  const bg = tone === 'pink' ? t.statPink : tone === 'green' ? t.statGreen : tone === 'yellow' ? t.statYellow : t.statPurple;
  return (
    <View style={[s.stat, { backgroundColor: bg }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue} adjustsFontSizeToFit numberOfLines={1}>{value}</Text>
    </View>
  );
}

export function Progress({ value, color, height = 10 }: { value: number; color: string; height?: number }) {
  const s = useStyles(base);
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={[s.track, { height }]}>
      <View style={{ width: `${v * 100}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const s = useStyles(base);
  return (
    <View style={s.seg}>
      {options.map(o => (
        <Pressable key={o.key} onPress={() => onChange(o.key)} style={[s.segItem, value === o.key && s.segItemActive]}>
          <Text style={[s.segText, value === o.key && s.segTextActive]} numberOfLines={1}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ListRow({ color, title, subtitle, right, onPress }: { color?: string; title: string; subtitle?: string; right?: ReactNode; onPress?: () => void }) {
  const s = useStyles(base);
  const body = (
    <>
      {color ? <View style={[s.bar, { backgroundColor: color }]} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.heading} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[s.sub, { fontSize: 13 }]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right}
    </>
  );
  if (onPress) return <Pressable onPress={onPress} style={s.listRow}>{body}</Pressable>;
  return <View style={s.listRow}>{body}</View>;
}

export function Banner({ tone, text, onPress }: { tone: 'warn' | 'bad' | 'good' | 'info'; text: string; onPress?: () => void }) {
  const s = useStyles(base);
  const t = useTheme();
  const bg = tone === 'warn' ? t.warnBg : tone === 'bad' ? t.badBg : tone === 'good' ? t.goodBg : t.infoBg;
  const fg = tone === 'warn' ? t.warn : tone === 'bad' ? t.bad : tone === 'good' ? t.good : t.info;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[s.banner, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: 14, flex: 1 }}>{text}</Text>
    </Pressable>
  );
}

export function SummaryRow({ label, value, tone, bold }: { label: string; value: string; tone?: 'good' | 'bad' | 'info' | 'warn' | 'plain'; bold?: boolean }) {
  const t = useTheme();
  const bg = tone === 'good' ? t.goodBg : tone === 'bad' ? t.badBg : tone === 'info' ? t.infoBg : tone === 'warn' ? t.warnBg : t.cardAlt;
  const fg = tone === 'good' ? t.good : tone === 'bad' ? t.bad : tone === 'info' ? t.info : tone === 'warn' ? t.warn : t.text;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, padding: 13, backgroundColor: bg }}>
      <Text style={{ color: t.text, fontWeight: bold ? '900' : '700', fontSize: 15, flex: 1 }}>{label}</Text>
      <Text style={{ color: fg, fontWeight: '900', fontSize: bold ? 21 : 18 }}>{value}</Text>
    </View>
  );
}

export function SmallLink({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={{ color: danger ? t.bad : t.primary, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.textFaint, fontSize: 14, textAlign: 'center', paddingVertical: 12 }}>{children}</Text>;
}
