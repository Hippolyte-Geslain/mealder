import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { parseRecipesCsv, CsvParseError } from '../import/csv';
import { runBatchRecipeOcr } from '../ocr/claudePdf';
import { OcrError } from '../ocr/claude';
import type { ImportPickerProps } from '../navigation/types';

function ocrErrorMessage(err: OcrError): string {
  switch (err.kind) {
    case 'AUTH':
      return 'Clé API invalide. Vérifiez-la dans Réglages.';
    case 'RATE_LIMIT':
      return 'Limite de requêtes atteinte. Réessayez dans un instant.';
    case 'NETWORK':
      return 'Pas de réseau. Vérifiez votre connexion.';
    case 'SERVER':
      return "Serveur Anthropic indisponible. Réessayez plus tard.";
    default:
      return `${fr.ocr.failed}\n\n[${err.kind}] ${err.message}`;
  }
}

export function ImportPicker({ navigation }: ImportPickerProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  async function onPickCsv() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    try {
      const text = await FileSystem.readAsStringAsync(asset.uri);
      const drafts = parseRecipesCsv(text);
      if (drafts.length === 0) {
        Alert.alert(fr.common.error, fr.import.emptyReview);
        return;
      }
      navigation.navigate('ImportReview', { drafts });
    } catch (e) {
      if (e instanceof CsvParseError) {
        Alert.alert(fr.common.error, e.message);
      } else {
        Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
      }
    }
  }

  async function onPickPdf() {
    if (pdfLoading) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPdfLoading(true);
    try {
      const drafts = await runBatchRecipeOcr(asset.uri);
      if (drafts.length === 0) {
        Alert.alert(fr.common.error, fr.import.emptyReview);
        return;
      }
      navigation.navigate('ImportReview', { drafts });
    } catch (e) {
      if (e instanceof OcrError && e.kind === 'NO_API_KEY') {
        Alert.alert(fr.ocr.noKeyTitle, fr.ocr.noKeyMessage, [
          { text: fr.recipeForm.cancel, style: 'cancel' },
          {
            text: fr.ocr.openSettings,
            onPress: () => {
              const parent = navigation.getParent();
              parent?.navigate('SettingsTab' as never);
            },
          },
        ]);
      } else if (e instanceof OcrError) {
        Alert.alert(fr.common.error, ocrErrorMessage(e));
      } else {
        Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
      }
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Pressable style={styles.bigBtn} onPress={onPickCsv}>
          <Text style={styles.bigBtnIcon}>📄</Text>
          <Text style={styles.bigBtnText}>{fr.import.csvBtn}</Text>
        </Pressable>
        <Text style={styles.help}>{fr.import.csvHelp}</Text>
      </View>

      <View style={styles.section}>
        <Pressable
          style={[styles.bigBtn, pdfLoading && styles.btnDisabled]}
          onPress={onPickPdf}
          disabled={pdfLoading}
        >
          <Text style={styles.bigBtnIcon}>📚</Text>
          <Text style={styles.bigBtnText}>{fr.import.pdfBtn}</Text>
        </Pressable>
        <Text style={styles.help}>{fr.import.pdfHelp}</Text>
      </View>

      {pdfLoading && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.overlayText}>{fr.import.scanning}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 20 },
  section: { gap: 8 },
  bigBtn: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  btnDisabled: { opacity: 0.5 },
  bigBtnIcon: { fontSize: 36 },
  bigBtnText: { ...typography.subtitle, color: colors.primaryDark, fontWeight: '700' },
  help: { ...typography.caption, color: colors.textMuted, lineHeight: 18, paddingHorizontal: 4 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(42, 42, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  overlayCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 14,
    minWidth: 220,
  },
  overlayText: { ...typography.body, color: colors.text, fontWeight: '600' },
});
