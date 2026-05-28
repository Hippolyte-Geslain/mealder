import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { getApiKey, setApiKey } from '../utils/apiKey';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export function Settings() {
  const [key, setKey] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

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
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48, gap: 8 },
  section: { ...typography.subtitle, color: colors.primary, marginTop: 4, marginBottom: 8 },
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
});
