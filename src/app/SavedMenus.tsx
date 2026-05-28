import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { deleteMenu, listMenus } from '../db/menus';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { formatEUR } from '../utils/money';
import { COURSES, type MenuWithCourses } from '../db/types';
import type { SavedMenusListProps } from '../navigation/types';

export function SavedMenus({ navigation }: SavedMenusListProps) {
  const [menus, setMenus] = useState<MenuWithCourses[]>([]);

  const refresh = useCallback(() => {
    let alive = true;
    listMenus().then((m) => {
      if (alive) setMenus(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  useFocusEffect(refresh);

  function onDelete(menu: MenuWithCourses) {
    Alert.alert(fr.menuDetail.confirmDelete, menu.title, [
      { text: fr.recipeForm.cancel, style: 'cancel' },
      {
        text: fr.menuDetail.delete,
        style: 'destructive',
        onPress: async () => {
          await deleteMenu(menu.id);
          refresh();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={menus}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{fr.savedMenus.empty}</Text>}
        renderItem={({ item }) => {
          const byCourse = Object.fromEntries(item.courses.map((c) => [c.course, c.recipe]));
          return (
            <Swipeable
              renderRightActions={() => (
                <Pressable style={styles.swipeDelete} onPress={() => onDelete(item)}>
                  <Text style={styles.swipeDeleteText}>{fr.menuDetail.delete}</Text>
                </Pressable>
              )}
            >
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate('MenuDetail', { menuId: item.id })}
              >
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.dishes}>
                  {COURSES.map((c) => (
                    <Text key={c} style={styles.dish} numberOfLines={1}>
                      <Text style={styles.dishLabel}>{fr.course[c]}</Text>{' '}
                      · {byCourse[c]?.name ?? '—'}
                    </Text>
                  ))}
                </View>
                <Text style={styles.total}>
                  {formatEUR(item.totalCostPerPortion * item.couverts)}
                  {item.couverts > 1 ? ` · ${item.couverts} couverts` : ''}
                </Text>
              </Pressable>
            </Swipeable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, gap: 12 },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: 64,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  title: { ...typography.subtitle, color: colors.text, fontWeight: '700' },
  dishes: { marginTop: 4, gap: 2 },
  dish: { ...typography.caption, color: colors.textMuted },
  dishLabel: { color: colors.primary, fontWeight: '600' },
  total: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 6,
  },
  swipeDelete: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 0,
    borderRadius: 14,
    marginLeft: 8,
  },
  swipeDeleteText: { color: colors.surface, fontWeight: '700' },
});
