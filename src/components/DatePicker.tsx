import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../store';
import { pad, todayStr } from '../utils';
import { useStyles } from './ui';

export function DatePicker({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date(value + 'T12:00:00').getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(value + 'T12:00:00').getMonth());
  const s = useStyles(th => ({
    trigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: th.input, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, gap: 10 },
    triggerText: { flex: 1, color: th.text, fontWeight: '700', fontSize: 15 },
    caret: { color: th.textFaint, fontSize: 12 },
    picker: { backgroundColor: th.card, borderRadius: 18, borderWidth: 2, borderColor: th.border, padding: 12, gap: 6, marginTop: 6 },
    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { width: 36, height: 36, borderRadius: 999, backgroundColor: th.chip, justifyContent: 'center', alignItems: 'center' },
    navText: { color: th.primary, fontSize: 20, fontWeight: '900' },
    navLabel: { color: th.text, fontWeight: '800', fontSize: 15 },
    head: { flex: 1, textAlign: 'center', color: th.textFaint, fontSize: 11, fontWeight: '700' },
    week: { flexDirection: 'row', gap: 3 },
    day: { flex: 1, aspectRatio: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: th.cardAlt },
    empty: { flex: 1, aspectRatio: 1 },
    dayText: { color: th.text, fontWeight: '700', fontSize: 13 },
  }));

  const today = todayStr();
  const label = new Date(value + 'T12:00:00').toLocaleString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const shift = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View>
      <Pressable onPress={() => setOpen(o => !o)} style={s.trigger}>
        <Text>📅</Text>
        <Text style={s.triggerText}>{value === today ? `Today · ${label}` : label}</Text>
        <Text style={s.caret}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={s.picker}>
          <View style={s.navRow}>
            <Pressable onPress={() => shift(-1)} style={s.navBtn}><Text style={s.navText}>‹</Text></Pressable>
            <Text style={s.navLabel}>{monthLabel}</Text>
            <Pressable onPress={() => shift(1)} style={s.navBtn}><Text style={s.navText}>›</Text></Pressable>
          </View>
          <View style={s.week}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} style={s.head}>{d}</Text>)}</View>
          {weeks.map((w, wi) => (
            <View key={wi} style={s.week}>
              {w.map((day, di) => {
                if (!day) return <View key={di} style={s.empty} />;
                const ds = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
                const sel = ds === value;
                return (
                  <Pressable key={di} onPress={() => { onChange(ds); setOpen(false); }}
                    style={[s.day, sel && { backgroundColor: t.primary }, ds === today && !sel && { borderWidth: 2, borderColor: t.primary }]}>
                    <Text style={[s.dayText, sel && { color: '#fff' }]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
