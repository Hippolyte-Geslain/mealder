import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useComposeStore } from '../state/composeStore';
import { MenuFlavorMix } from '../components/MenuFlavorMix';
import { getRecipe } from '../db/recipes';
import { createMenu } from '../db/menus';
import { COURSES, type Course, type RecipeWithIngredients } from '../db/types';
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
  const entree = useComposeStore((s) => s.entree);
  const plat = useComposeStore((s) => s.plat);
  const dessert = useComposeStore((s) => s.dessert);
  const reset = useComposeStore((s) => s.reset);

  const [recipes, setRecipes] = useState<Record<Course, RecipeWithIngredients | null>>({
    entree: null,
    plat: null,
    dessert: null,
  });
  const [title, setTitle] = useState(defaultMenuTitle);
  const [couverts, setCouverts] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    const ids: Record<Course, string | null> = { entree, plat, dessert };
    Promise.all(COURSES.map((c) => (ids[c] ? getRecipe(ids[c]!) : Promise.resolve(null)))).then(
      ([e, p, d]) => {
        if (!alive) return;
        setRecipes({ entree: e, plat: p, dessert: d });
      }
    );
    return () => {
      alive = false;
    };
  }, [entree, plat, dessert]);

  const perPortion = COURSES.reduce((s, c) => s + (recipes[c]?.totalCostPerPortion ?? 0), 0);
  const grandTotal = perPortion * couverts;
  const allPicked = COURSES.every((c) => recipes[c] != null);

  async function onSave() {
    if (!title.trim() || saving || !allPicked) return;
    setSaving(true);
    try {
      const menuId = await createMenu({
        title: title.trim(),
        couverts,
        picks: COURSES.map((c) => ({ course: c, recipeId: recipes[c]!.id })),
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

        {COURSES.map((c) => {
          const r = recipes[c];
          return (
            <View key={c} style={styles.courseCard}>
              <Text style={styles.courseLabel}>{fr.course[c]}</Text>
              {r ? (
                <View style={styles.recipeRow}>
                  {r.photoUri ? (
                    <Image source={{ uri: r.photoUri }} style={styles.photo} />
                  ) : (
                    <View style={[styles.photo, styles.photoPlaceholder]}>
                      <Text style={styles.photoPlaceholderText}>{fr.course[c].charAt(0)}</Text>
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

        <MenuFlavorMix
          profiles={{
            entree: recipes.entree?.flavor,
            plat: recipes.plat?.flavor,
            dessert: recipes.dessert?.flavor,
          }}
        />

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
          style={[styles.saveBtn, (!title.trim() || saving || !allPicked) && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={!title.trim() || saving || !allPicked}
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
