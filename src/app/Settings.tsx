import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { getApiKey, setApiKey } from '../utils/apiKey';
import { backfillFlavors } from '../flavor/service';
import { FlavorError } from '../flavor/claude';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { SettingsMainProps } from '../navigation/types';

type BackfillState = {
  running: boolean;
  progress: { done: number; total: number } | null;
  message: string | null;
};

export function Settings({ navigation }: SettingsMainProps) {
  const [key, setKey] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backfill, setBackfill] = useState<BackfillState>({
    running: false,
    progress: null,
    message: null,
  });

  useEffect(() => {
    let alive = true;
    getApiKey().then((k) => {
      if (!alive) return;
      setKey(k ?? '');
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      await setApiKey(key);
      Alert.alert(fr.settings.saved);
    } catch (e) {
      Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onClear() {
    setKey('');
    await setApiKey('');
  }

  async function onBackfill() {
    if (backfill.running) return;
    if (key.trim() === '') {
      Alert.alert(fr.ocr.noKeyTitle, fr.ocr.noKeyMessage);
      return;
    }
    setBackfill({ running: true, progress: null, message: null });
    try {
      const result = await backfillFlavors((done, total) =>
        setBackfill((prev) => ({ ...prev, progress: { done, total } }))
      );
      const message =
        result.total === 0
          ? fr.flavor.backfillNothing
          : result.failed === 0
            ? fr.flavor.backfillDone(result.computed)
            : fr.flavor.backfillPartial(result.computed, result.failed);
      setBackfill({ running: false, progress: null, message });
    } catch (e) {
      setBackfill({ running: false, progress: null, message: null });
      if (e instanceof FlavorError && e.kind === 'NO_API_KEY') {
        Alert.alert(fr.ocr.noKeyTitle, fr.ocr.noKeyMessage);
      } else {
        Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
      }
    }
  }

  if (!loaded) {
    return <View style={styles.container} />;
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      bottomOffset={16}
    >
      <Text style={styles.section}>{fr.settings.apiSection}</Text>
      <Text style={styles.label}>{fr.settings.apiKey}</Text>
      <TextInput
        value={key}
        onChangeText={setKey}
        placeholder={fr.settings.apiKeyPlaceholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <Text style={styles.help}>{fr.settings.privacy}</Text>
      <Text style={styles.help}>{fr.settings.howTo}</Text>

      <Pressable
        style={[styles.saveBtn, saving && styles.btnDisabled]}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{fr.settings.save}</Text>
      </Pressable>

      {key.length > 0 && (
        <Pressable style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearBtnText}>{fr.settings.clear}</Text>
        </Pressable>
      )}

      <Text style={[styles.section, styles.sectionSpaced]}>{fr.flavor.backfillSection}</Text>
      <Text style={styles.help}>{fr.flavor.backfillHelp}</Text>
      <Pressable
        style={[styles.saveBtn, backfill.running && styles.btnDisabled]}
        onPress={onBackfill}
        disabled={backfill.running}
      >
        <Text style={styles.saveBtnText}>
          {backfill.running && backfill.progress
            ? fr.flavor.backfillProgress(backfill.progress.done, backfill.progress.total)
            : fr.flavor.backfillBtn}
        </Text>
      </Pressable>
      {backfill.message && <Text style={styles.help}>{backfill.message}</Text>}

      <Text style={[styles.section, styles.sectionSpaced]}>{fr.costHistory.openSection}</Text>
      <Pressable style={styles.linkRow} onPress={() => navigation.navigate('CostHistory')}>
        <Text style={styles.linkRowText}>{fr.costHistory.open}</Text>
        <Text style={styles.linkRowChevron}>›</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48, gap: 8 },
  section: { ...typography.subtitle, color: colors.primary, marginTop: 4, marginBottom: 8 },
  sectionSpaced: { marginTop: 28 },
  label: { ...typography.subtitle, color: colors.text, marginTop: 4, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    ...typography.body,
  },
  help: { ...typography.caption, color: colors.textMuted, marginTop: 6, lineHeight: 18 },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { ...typography.subtitle, color: colors.surface, fontWeight: '700' },
  clearBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  clearBtnText: { ...typography.body, color: colors.danger, fontWeight: '600' },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  linkRowText: { ...typography.body, color: colors.text, fontWeight: '600' },
  linkRowChevron: { fontSize: 20, color: colors.textMuted, lineHeight: 22 },
});
