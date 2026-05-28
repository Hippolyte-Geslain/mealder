import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { CourseChip } from '../components/CourseChip';
import { createRecipesBulk } from '../db/recipes';
import { COURSES, type Course } from '../db/types';
import { uuid } from '../utils/uuid';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RecipeDraft } from '../ocr/claude';
import type { ImportReviewProps } from '../navigation/types';

type DraftRow = {
  key: string;
  selected: boolean;
  name: string;
  course: Course;
  ingredients: RecipeDraft['ingredients'];
};

function fromDrafts(drafts: RecipeDraft[]): DraftRow[] {
  return drafts.map((d) => ({
    key: uuid(),
    selected: true,
    name: d.name,
    course: d.course,
    ingredients: d.ingredients,
  }));
}

export function ImportReview({ navigation, route }: ImportReviewProps) {
  const [rows, setRows] = useState<DraftRow[]>(() => fromDrafts(route.params.drafts));
  const [saving, setSaving] = useState(false);

  const selectedCount = rows.filter((r) => r.selected).length;

  function toggle(key: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, selected: !r.selected } : r)));
  }

  function setName(key: string, name: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, name } : r)));
  }

  function setCourse(key: string, course: Course) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, course } : r)));
  }

  async function onConfirm() {
    if (saving || selectedCount === 0) return;
    setSaving(true);
    try {
      const inputs = rows
        .filter((r) => r.selected && r.name.trim() !== '')
        .map((r) => ({
          name: r.name.trim(),
          course: r.course,
          photoUri: null,
          ingredients: r.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            costPerPortion: 0,
          })),
        }));
      await createRecipesBulk(inputs);
      const parent = navigation.getParent();
      parent?.navigate('LibraryTab' as never);
    } catch (e) {
      Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      bottomOffset={16}
    >
      {rows.map((row) => (
        <View key={row.key} style={[styles.card, !row.selected && styles.cardDimmed]}>
          <View style={styles.cardHeader}>
            <Pressable onPress={() => toggle(row.key)} hitSlop={8} style={styles.checkboxWrap}>
              <View style={[styles.checkbox, row.selected && styles.checkboxOn]}>
                {row.selected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
            <TextInput
              value={row.name}
              onChangeText={(v) => setName(row.key, v)}
              style={styles.nameInput}
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.courseRow}>
            {COURSES.map((c) => (
              <CourseChip
                key={c}
                label={fr.course[c]}
                selected={row.course === c}
                onPress={() => setCourse(row.key, c)}
              />
            ))}
          </View>
          <Text style={styles.meta}>{fr.import.ingredientCount(row.ingredients.length)}</Text>
        </View>
      ))}

      <Pressable
        style={[styles.confirmBtn, (saving || selectedCount === 0) && styles.btnDisabled]}
        onPress={onConfirm}
        disabled={saving || selectedCount === 0}
      >
        <Text style={styles.confirmBtnText}>{fr.import.confirmBtn(selectedCount)}</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  cardDimmed: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxWrap: { padding: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary },
  checkmark: { color: colors.surface, fontWeight: '700', fontSize: 14, lineHeight: 16 },
  nameInput: {
    flex: 1,
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  courseRow: { flexDirection: 'row', gap: 6 },
  meta: { ...typography.caption, color: colors.textMuted },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  confirmBtnText: { ...typography.subtitle, color: colors.surface, fontWeight: '700' },
});
