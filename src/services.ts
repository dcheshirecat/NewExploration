import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { isBackupLike, normalizeData } from './storage';
import type { AppData } from './types';
import { todayStr } from './utils';

// ── Backup & restore ─────────────────────────────────────────────────────────
export async function exportBackup(data: AppData) {
  const payload = JSON.stringify({ app: 'dinis-money-jar', exportedAt: new Date().toISOString(), ...data }, null, 2);
  const name = `money-jar-backup-${todayStr()}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
    return name;
  }

  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(payload);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save your Money Jar backup' });
  }
  return name;
}

/** Lets the user pick a backup file. Returns null if they cancelled. */
export async function pickBackup(): Promise<AppData | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  let text: string;
  if (Platform.OS === 'web' && asset.file) text = await asset.file.text();
  else text = await new File(asset.uri).text();
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { throw new Error('That file is not a Money Jar backup.'); }
  if (!isBackupLike(parsed)) throw new Error('That file is not a Money Jar backup.');
  return normalizeData(parsed);
}

// ── Reminders ────────────────────────────────────────────────────────────────
const CHANNEL = 'daily-reminder';
export const remindersSupported = Platform.OS !== 'web';

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/** Schedules (or cancels) the daily "log your spending" reminder. Returns false if permission was denied. */
export async function syncReminder(enabled: boolean, hour: number, minute: number) {
  if (!remindersSupported) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return true;
  let perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Daily reminder', importance: Notifications.AndroidImportance.DEFAULT });
  }
  await Notifications.scheduleNotificationAsync({
    content: { title: '🫙 Money Jar check-in', body: 'Did you spend anything today? Log it to keep your streak and feed your pets! 🐾' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL },
  });
  return true;
}
