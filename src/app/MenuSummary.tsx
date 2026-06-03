import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useComposeStore } from '../state/composeStore';
import { getRecipe } from '../db/recipes';
import { createMenu } from '../db/menus';
import { type RecipeWithIngredients } from '../db/types';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { formatEUR } from '../utils/money';
import type { MenuSummaryProps } from '../navigation/types';

function defaultMenuTitle(): string {
  const date = new Intl.DateTimeFormat('fr-FR').format(new Date());
  return fr.menuSummary.defaultTitle(date);
}

export function MenuSummary({ navigation }: MenuSummaryProps) {
  const picks = useComposeStore((s) => s.picks);
  const reset = useComposeStore((s) => s.reset);

  const [recipes, setRecipes] = useState<Record<string, RecipeWithIngredients | null>>({});
  const [title, setTitle] = useState(defaultMenuTitle);
  const [couverts, setCouverts] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    const ids = Array.from(new Set(picks.map((p) => p.recipeId)));
    Promise.all(ids.map((id) => getRecipe(id))).then((rs) => {
      if (!alive) return;
      const next: Record<string, RecipeWithIngredients | null> = {};
      ids.forEach((id, i) => {
        next[id] = rs[i];
      });
      setRecipes(next);
    });
    return () => {
      alive = false;
    };
  }, [picks]);

  const perPortion = picks.reduce(
    (s, p) => s + (recipes[p.recipeId]?.totalCostPerPortion ?? 0),
    0
  );
  const grandTotal = perPortion * couverts;
  const canSave = title.trim() !== '' && picks.length > 0 && !saving;

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const menuId = await createMenu({
        title: title.trim(),
        couverts,
        picks: picks.map((p) => ({ course: p.course, recipeId: p.recipeId })),
      });
      reset();
      navigation.replace('MenuDetail', { menuId });
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
      <Text style={styles.label}>{fr.menuSummary.menuTitle}</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.titleInput}
        placeholder={fr.menuSummary.menuTitle}
        placeholderTextColor={colors.textMuted}
      />

      {picks.map((p, idx) => {
        const r = recipes[p.recipeId];
        return (
          <View key={`${p.recipeId}-${idx}`} style={styles.courseCard}>
            <Text style={styles.courseLabel}>{fr.course[p.course]}</Text>
            {r ? (
              <View style={styles.recipeRow}>
                {r.photoUri ? (
                  <Image source={{ uri: r.photoUri }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoPlaceholder]}>
                    <Text style={styles.photoPlaceholderText}>{fr.course[p.course].charAt(0)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.recipeName}>{r.name}</Text>
                  <Text style={styles.recipeCost}>{formatEUR(r.totalCostPerPortion)}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.missing}>—</Text>
            )}
          </View>
        );
      })}

      <View style={styles.couvertsRow}>
        <Text style={styles.couvertsLabel}>{fr.menuSummary.couverts}</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setCouverts((c) => Math.max(1, c - 1))}
            style={styles.stepBtn}
            hitSlop={8}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{couverts}</Text>
          <Pressable
            onPress={() => setCouverts((c) => c + 1)}
            style={styles.stepBtn}
            hitSlop={8}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{fr.menuSummary.total}</Text>
        <Text style={styles.totalValueMuted}>{formatEUR(perPortion)}</Text>
      </View>
      <View style={styles.totalRowGrand}>
        <Text style={styles.totalLabel}>{fr.menuSummary.grandTotal(couverts)}</Text>
        <Text style={styles.totalValue}>{formatEUR(grandTotal)}</Text>
      </View>

      <Pressable
        style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        onPress={onSave}
        disabled={!canSave}
      >
        <Text style={styles.saveBtnText}>{fr.menuSummary.save}</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  label: { ...typography.subtitle, color: colors.text, marginTop: 4 },
  titleInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    ...typography.body,
  },
  courseCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  courseLabel: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  recipeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  recipeName: { ...typography.subtitle, color: colors.text },
  recipeCost: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  missing: { ...typography.body, color: colors.textMuted },
  couvertsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  couvertsLabel: { ...typography.subtitle, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtnText: { fontSize: 22, color: colors.primary, fontWeight: '700', lineHeight: 26 },
  stepValue: { ...typography.title, color: colors.text, minWidth: 28, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRowGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  totalLabel: { ...typography.subtitle, color: colors.text },
  totalValue: { ...typography.title, color: colors.primary, fontWeight: '700' },
  totalValueMuted: { ...typography.subtitle, color: colors.textMuted, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { ...typography.subtitle, color: colors.surface, fontWeight: '700' },
});
