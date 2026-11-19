import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Btn, Card, Chip, Heading, Row, Segmented, Sub, Title, Wrap } from '../components/ui';
import { remindersSupported, exportBackup, pickBackup, syncReminder } from '../services';
import { confirmAction, useStore } from '../store';
import type { ThemeMode } from '../types';
import { pad } from '../utils';

const HOURS = [8, 12, 18, 20, 21, 22];

export function SettingsScreen({ onClose }: { onClose: () => void }) {
  const { data, update, replaceAll, toast, theme } = useStore();
  const st = data.settings;
  const [busy, setBusy] = useState(false);

  const setReminder = async (enabled: boolean, hour = st.reminderHour, minute = st.reminderMinute) => {
    update(d => { d.settings.remindersEnabled = enabled; d.settings.reminderHour = hour; d.settings.reminderMinute = minute; });
    try {
      const ok = await syncReminder(enabled, hour, minute);
      if (!ok && enabled) {
        update(d => { d.settings.remindersEnabled = false; });
        toast('Notifications are blocked — allow them for Money Jar in your phone settings.');
      } else if (enabled) toast(`⏰ Daily reminder set for ${pad(hour)}:${pad(minute)}`);
      else toast('Reminder turned off');
    } catch {
      toast('Could not set the reminder on this device.');
    }
  };

  const doExport = async () => {
    setBusy(true);
    try { const name = await exportBackup(data); toast(`💾 Backup ready: ${name}`); }
    catch { toast('Could not create the backup file.'); }
    finally { setBusy(false); }
  };
  const doImport = async () => {
    try {
      const next = await pickBackup();
      if (!next) return;
      const months = Object.keys(next.months).length;
      confirmAction('Restore this backup?', `It has ${months} ${months === 1 ? 'month' : 'months'}, ${next.goals.length} goals and ${next.game.pets.length} pets. Your current data will be replaced.`, 'Restore', () => {
        replaceAll(next);
        toast('✅ Backup restored');
        if (next.settings.remindersEnabled) syncReminder(true, next.settings.reminderHour, next.settings.reminderMinute).catch(() => {});
      });
    } catch (e: any) {
      toast(e?.message ?? 'Could not read that file.');
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={{ color: theme.text, fontSize: 26, fontWeight: '900' }}>Settings</Text>
        <Btn small kind="secondary" label="Done" onPress={onClose} />
      </Row>

      <Card>
        <Title>Appearance</Title>
        <Segmented<ThemeMode> value={st.theme} onChange={v => update(d => { d.settings.theme = v; })}
          options={[{ key: 'system', label: '📱 Auto' }, { key: 'light', label: '☀️ Light' }, { key: 'dark', label: '🌙 Dark' }]} />
        <Sub>Auto follows your phone&apos;s dark mode setting.</Sub>
      </Card>

      <Card>
        <Title>Daily reminder</Title>
        <Sub>A gentle nudge to log what you spent (and keep your streak and pets happy).</Sub>
        {remindersSupported ? (
          <>
            <Pressable onPress={() => setReminder(!st.remindersEnabled)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Heading>Remind me every day</Heading>
              <Switch value={st.remindersEnabled} onValueChange={v => setReminder(v)} trackColor={{ true: theme.primary, false: theme.chip }} />
            </Pressable>
            {st.remindersEnabled && (
              <>
                <Heading>At {pad(st.reminderHour)}:{pad(st.reminderMinute)}</Heading>
                <Wrap>{HOURS.map(h => <Chip key={h} label={`${pad(h)}:00`} active={st.reminderHour === h && st.reminderMinute === 0} onPress={() => setReminder(true, h, 0)} />)}</Wrap>
              </>
            )}
          </>
        ) : <Sub>Reminders work in the Android app.</Sub>}
      </Card>

      <Card>
        <Title>Budget warnings</Title>
        <Sub>Warn me when a budget or plan reaches:</Sub>
        <Wrap>{[0.7, 0.8, 0.9].map(v => <Chip key={v} label={`${Math.round(v * 100)}%`} active={st.warnAt === v} onPress={() => update(d => { d.settings.warnAt = v; })} />)}</Wrap>
        <Sub>You always get a warning when you go over.</Sub>
      </Card>

      <Card>
        <Title>Backup & restore</Title>
        <Sub>Save everything (budgets, goals, recurring items, pets) to a file. Keep it in Google Drive or send it to yourself, so you never lose your data — even if you change phones.</Sub>
        <Btn icon="💾" label={busy ? 'Preparing…' : 'Back up to a file'} onPress={doExport} disabled={busy} />
        <Btn icon="📂" kind="secondary" label="Restore from a backup file" onPress={doImport} />
      </Card>

      <Card>
        <Title>About</Title>
        <Sub>Dini&apos;s Money Jar 2.0 — your budget, savings goals and pet friends in one app. Everything is stored only on this device.</Sub>
      </Card>
    </View>
  );
}
