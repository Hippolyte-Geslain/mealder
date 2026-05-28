import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CourseChip } from '../components/CourseChip';
import { listRecipes } from '../db/recipes';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { formatEUR } from '../utils/money';
import type { Course, RecipeWithIngredients } from '../db/types';
import type { LibraryListProps } from '../navigation/types';

const FILTERS: { value: Course | null; label: string }[] = [
  { value: null, label: fr.library.filterAll },
  { value: 'entree', label: fr.course.entree },
  { value: 'plat', label: fr.course.plat },
  { value: 'dessert', label: fr.course.dessert },
];

export function Library({ navigation, route }: LibraryListProps) {
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [filter, setFilter] = useState<Course | null>(null);
  const [search, setSearch] = useState(route.params?.search ?? '');

  useEffect(() => {
    const incoming = route.params?.search;
    if (incoming != null && incoming !== search) setSearch(incoming);
  }, [route.params?.search]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listRecipes(filter ?? undefined).then((r) => {
        if (alive) setRecipes(r);
      });
      return () => {
        alive = false;
      };
    }, [filter])
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={fr.home.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          returnKeyType="search"
        />
      </View>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <CourseChip
            key={f.value ?? 'all'}
            label={f.label}
            selected={filter === f.value}
            onPress={() => setFilter(f.value)}
          />
        ))}
      </View>
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{fr.library.empty}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('RecipeForm', { recipeId: item.id })}
          >
            {item.photoUri ? (
              <Image source={{ uri: item.photoUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoPlaceholderText}>{fr.course[item.course].charAt(0)}</Text>
              </View>
            )}
            <View style={styles.rowContent}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowMeta}>
                {fr.course[item.course]} · {formatEUR(item.totalCostPerPortion)}
              </Text>
            </View>
          </Pressable>
        )}
      />
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('RecipeForm', { recipeId: undefined })}
      >
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabLabel}>{fr.library.addRecipe}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    ...typography.body,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 96, gap: 10 },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: 48,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { ...typography.title, color: colors.primary },
  rowContent: { flex: 1 },
  rowName: { ...typography.subtitle, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabPlus: { color: colors.surface, fontSize: 22, fontWeight: '700' },
  fabLabel: { color: colors.surface, fontWeight: '700' },
});
