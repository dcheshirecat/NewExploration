import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../store';
import { fmt, fmtShort } from '../utils';

// ── Legend ───────────────────────────────────────────────────────────────────
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {items.map(i => (
        <View key={i.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: i.color }} />
          <Text style={{ color: t.textSoft, fontSize: 13, fontWeight: '600' }}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Donut ────────────────────────────────────────────────────────────────────
type Slice = { key: string; label: string; value: number; color: string };

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export function Donut({ slices, title }: { slices: Slice[]; title: string }) {
  const t = useTheme();
  const [sel, setSel] = useState<string | null>(null);
  const data = slices.filter(s => s.value > 0).sort((a, b) => b.value - a.value);
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 180, cx = 90, cy = 90, r = 70, stroke = 26;
  const gap = data.length > 1 ? 0.025 : 0; // radians of surface between segments

  let angle = -Math.PI / 2;
  const arcs = data.map(d => {
    const sweep = (d.value / total) * Math.PI * 2;
    const a0 = angle + gap / 2;
    const a1 = angle + sweep - gap / 2;
    angle += sweep;
    return { ...d, a0, a1, sweep };
  });
  const focus = sel ? data.find(d => d.key === sel) : null;

  if (!total) return <Text style={{ color: t.textFaint, textAlign: 'center', paddingVertical: 16 }}>No spending logged in this period yet.</Text>;

  return (
    <View style={{ gap: 14 }}>
      <View style={{ alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke={t.grid} strokeWidth={stroke} fill="none" />
          {arcs.map(a => (
            a.sweep >= Math.PI * 2 - 0.001
              ? <Circle key={a.key} cx={cx} cy={cy} r={r} stroke={a.color} strokeWidth={stroke} fill="none" />
              : <Path key={a.key} d={arcPath(cx, cy, r, a.a0, a.a1)} stroke={a.color} strokeWidth={sel && sel !== a.key ? stroke - 8 : stroke} fill="none"
                  opacity={sel && sel !== a.key ? 0.35 : 1} onPress={() => setSel(sel === a.key ? null : a.key)} />
          ))}
        </Svg>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: t.textSoft, fontSize: 12, fontWeight: '700' }}>{focus ? focus.label : title}</Text>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '900' }}>{fmtShort(focus ? focus.value : total)}</Text>
          {focus ? <Text style={{ color: t.textSoft, fontSize: 12 }}>{Math.round((focus.value / total) * 100)}%</Text> : null}
        </View>
      </View>
      <View style={{ gap: 6 }}>
        {data.map(d => (
          <Pressable key={d.key} onPress={() => setSel(sel === d.key ? null : d.key)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12, backgroundColor: sel === d.key ? t.cardAlt : 'transparent' }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: d.color }} />
            <Text style={{ flex: 1, color: t.text, fontWeight: '700' }} numberOfLines={1}>{d.label}</Text>
            <Text style={{ color: t.textSoft, fontWeight: '600', width: 44, textAlign: 'right' }}>{Math.round((d.value / total) * 100)}%</Text>
            <Text style={{ color: t.text, fontWeight: '800', minWidth: 84, textAlign: 'right' }}>{fmt(d.value)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── Month comparison: income bar + stacked spending bar per period ──────────
export type MonthPoint = { key: string; label: string; income: number; reg: number; fun: number };

export function MonthCompare({ points }: { points: MonthPoint[] }) {
  const t = useTheme();
  const [sel, setSel] = useState<string | null>(points.at(-1)?.key ?? null);
  const max = Math.max(1, ...points.map(p => Math.max(p.income, p.reg + p.fun)));
  const H = 150;
  const ticks = [1, 0.5, 0];
  const focus = points.find(p => p.key === sel);
  const h = (v: number) => (v / max) * H;

  return (
    <View style={{ gap: 12 }}>
      <Legend items={[{ label: 'Income', color: t.chartIncome }, { label: 'Regular', color: t.chartReg }, { label: 'Fun', color: t.chartFun }]} />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 44, height: H, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6, marginTop: 6 }}>
          {ticks.map(f => <Text key={f} style={{ color: t.textFaint, fontSize: 10, marginVertical: -6 }}>{fmtShort(max * f)}</Text>)}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ position: 'absolute', top: 6, left: 0, right: 0, height: H, justifyContent: 'space-between' }}>
            {ticks.map(f => <View key={f} style={{ height: 1, backgroundColor: t.grid }} />)}
          </View>
          <View style={{ flexDirection: 'row', height: H + 6, alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {points.map(p => {
              const active = p.key === sel;
              return (
                <Pressable key={p.key} onPress={() => setSel(p.key)} hitSlop={6}
                  style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, paddingHorizontal: 4, opacity: sel && !active ? 0.55 : 1 }}>
                  <View style={{ width: 14, height: Math.max(h(p.income), p.income ? 3 : 0), backgroundColor: t.chartIncome, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                  <View style={{ width: 14, gap: 2 }}>
                    {p.fun > 0 && <View style={{ height: Math.max(h(p.fun) - 2, 2), backgroundColor: t.chartFun, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />}
                    {p.reg > 0 && <View style={{ height: Math.max(h(p.reg), 2), backgroundColor: t.chartReg, borderTopLeftRadius: p.fun > 0 ? 0 : 4, borderTopRightRadius: p.fun > 0 ? 0 : 4 }} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 }}>
            {points.map(p => <Text key={p.key} style={{ color: p.key === sel ? t.text : t.textFaint, fontWeight: p.key === sel ? '800' : '600', fontSize: 11, width: 40, textAlign: 'center' }}>{p.label}</Text>)}
          </View>
        </View>
      </View>
      {focus && (
        <View style={{ backgroundColor: t.cardAlt, borderRadius: 14, padding: 12, gap: 4 }}>
          <Text style={{ color: t.text, fontWeight: '800' }}>{focus.label} period</Text>
          <ValueLine color={t.chartIncome} label="Income" value={fmt(focus.income)} />
          <ValueLine color={t.chartReg} label="Regular" value={fmt(focus.reg)} />
          <ValueLine color={t.chartFun} label="Fun" value={fmt(focus.fun)} />
          <ValueLine label="Left over" value={fmt(focus.income - focus.reg - focus.fun)} />
        </View>
      )}
    </View>
  );
}

function ValueLine({ color, label, value }: { color?: string; label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color ?? 'transparent' }} />
      <Text style={{ color: t.textSoft, flex: 1 }}>{label}</Text>
      <Text style={{ color: t.text, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

// ── Daily stacked bars ───────────────────────────────────────────────────────
export type DayPoint = { dateStr: string; dayNum: number; fun: number; reg: number };

export function DailyBars({ days, selected, onSelect }: { days: DayPoint[]; selected: string | null; onSelect: (d: string | null) => void }) {
  const t = useTheme();
  const max = Math.max(1, ...days.map(d => d.fun + d.reg));
  const H = 140;
  return (
    <View style={{ gap: 10 }}>
      <Legend items={[{ label: 'Regular', color: t.chartReg }, { label: 'Fun', color: t.chartFun }]} />
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: 40, height: H, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 }}>
          {[1, 0.5, 0].map(f => <Text key={f} style={{ color: t.textFaint, fontSize: 10, marginVertical: -6 }}>{fmtShort(max * f)}</Text>)}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H, justifyContent: 'space-between' }}>
              {[1, 0.5, 0].map(f => <View key={f} style={{ height: 1, backgroundColor: t.grid }} />)}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: H, gap: 4 }}>
              {days.map(d => {
                const active = selected === d.dateStr;
                const fh = (d.fun / max) * H, rh = (d.reg / max) * H;
                return (
                  <Pressable key={d.dateStr} onPress={() => onSelect(active ? null : d.dateStr)} style={{ width: 16, height: H, justifyContent: 'flex-end', gap: 2, opacity: selected && !active ? 0.5 : 1 }}>
                    {d.fun > 0 && <View style={{ height: Math.max(fh - 2, 2), backgroundColor: t.chartFun, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />}
                    {d.reg > 0 && <View style={{ height: Math.max(rh, 2), backgroundColor: t.chartReg, borderTopLeftRadius: d.fun > 0 ? 0 : 4, borderTopRightRadius: d.fun > 0 ? 0 : 4 }} />}
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
              {days.map(d => <Text key={d.dateStr} style={{ width: 16, textAlign: 'center', fontSize: 9, color: selected === d.dateStr ? t.primary : t.textFaint, fontWeight: selected === d.dateStr ? '800' : '600' }}>{d.dayNum}</Text>)}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
