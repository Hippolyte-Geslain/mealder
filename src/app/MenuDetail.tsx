import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { deleteMenu, getMenu, updateMenuCouverts } from '../db/menus';
import { COURSES, type MenuWithCourses } from '../db/types';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { formatEUR } from '../utils/money';
import { exportMenuPdf } from '../export/menuPdf';
import type { ComposeStackParamList, MenusStackParamList } from '../navigation/types';

type Props = {
  route:
    | RouteProp<ComposeStackParamList, 'MenuDetail'>
    | RouteProp<MenusStackParamList, 'MenuDetail'>;
  navigation:
    | NativeStackNavigationProp<ComposeStackParamList, 'MenuDetail'>
    | NativeStackNavigationProp<MenusStackParamList, 'MenuDetail'>;
};

export function MenuDetail({ route, navigation }: Props) {
  const { menuId } = route.params;
  const [menu, setMenu] = useState<MenuWithCourses | null>(null);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getMenu(menuId).then((m) => {
        if (alive) setMenu(m);
      });
      return () => {
        alive = false;
      };
    }, [menuId])
  );

  async function changeCouverts(delta: number) {
    if (!menu) return;
    const next = Math.max(1, menu.couverts + delta);
    if (next === menu.couverts) return;
    setMenu({ ...menu, couverts: next });
    try {
      await updateMenuCouverts(menu.id, next);
    } catch (e) {
      setMenu(menu);
      Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
    }
  }

  async function onExport() {
    if (!menu || exporting) return;
    setExporting(true);
    try {
      await exportMenuPdf(menu);
    } catch (e) {
      Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  function onDelete() {
    if (!menu) return;
    Alert.alert(fr.menuDetail.confirmDelete, '', [
      { text: fr.recipeForm.cancel, style: 'cancel' },
      {
        text: fr.menuDetail.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMenu(menu.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  }

  if (!menu) {
    return <View style={styles.container} />;
  }

  const recipesByCourse = Object.fromEntries(menu.courses.map((c) => [c.course, c.recipe]));
  const grandTotal = menu.totalCostPerPortion * menu.couverts;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{menu.title}</Text>

      {COURSES.map((c) => {
        const r = recipesByCourse[c];
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

      <View style={styles.couvertsRow}>
        <Text style={styles.couvertsLabel}>{fr.menuSummary.couverts}</Text>
        <View style={styles.stepper}>
          <Pressable onPress={() => changeCouverts(-1)} style={styles.stepBtn} hitSlop={8}>
            <Text style={styles.stepBtnText}>−</Text>
          </Pressable>
          <Text style={styles.stepValue}>{menu.couverts}</Text>
          <Pressable onPress={() => changeCouverts(+1)} style={styles.stepBtn} hitSlop={8}>
            <Text style={styles.stepBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{fr.menuSummary.total}</Text>
        <Text style={styles.totalValueMuted}>{formatEUR(menu.totalCostPerPortion)}</Text>
      </View>
      <View style={styles.totalRowGrand}>
        <Text style={styles.totalLabel}>{fr.menuSummary.grandTotal(menu.couverts)}</Text>
        <Text style={styles.totalValue}>{formatEUR(grandTotal)}</Text>
      </View>

      <Pressable
        style={[styles.primaryBtn, exporting && styles.btnDisabled]}
        onPress={onExport}
        disabled={exporting}
      >
        <Text style={styles.primaryBtnText}>{fr.menuDetail.exportPdf}</Text>
      </Pressable>

      <Pressable style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteBtnText}>{fr.menuDetail.delete}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  title: { ...typography.display, color: colors.primary, marginBottom: 4 },
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
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { ...typography.subtitle, color: colors.surface, fontWeight: '700' },
  deleteBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  deleteBtnText: { ...typography.body, color: colors.danger, fontWeight: '600' },
});
