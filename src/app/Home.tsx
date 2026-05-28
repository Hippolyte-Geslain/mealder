import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { listMenus } from '../db/menus';
import { COURSES, type MenuWithCourses } from '../db/types';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { formatEUR } from '../utils/money';
import type { DrawerParamList } from '../navigation/types';

export function Home() {
  const drawerNav = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const [menus, setMenus] = useState<MenuWithCourses[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listMenus().then((m) => {
        if (alive) setMenus(m);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  function submitSearch() {
    Keyboard.dismiss();
    drawerNav.navigate('LibraryTab', {
      screen: 'LibraryList',
      params: { search: search.trim() },
    });
  }

  function goCompose() {
    drawerNav.navigate('ComposeTab', { screen: 'ComposeStart' });
  }

  function openMenu(menuId: string) {
    drawerNav.navigate('MenusTab', { screen: 'MenuDetail', params: { menuId } });
  }

  const recent = menus.slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>{fr.home.welcome}</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={fr.home.searchPlaceholder}
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        returnKeyType="search"
        onSubmitEditing={submitSearch}
      />

      <Pressable style={styles.cta} onPress={goCompose}>
        <Text style={styles.ctaText}>{fr.home.composeCta}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>{fr.home.recentMenus}</Text>
      {recent.length === 0 ? (
        <Text style={styles.empty}>{fr.home.emptyMenus}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentRow}
        >
          {recent.map((m) => {
            const byCourse = Object.fromEntries(m.courses.map((c) => [c.course, c.recipe]));
            return (
              <Pressable key={m.id} style={styles.recentCard} onPress={() => openMenu(m.id)}>
                <Text style={styles.recentTitle} numberOfLines={2}>
                  {m.title}
                </Text>
                <View style={styles.recentDishes}>
                  {COURSES.map((c) => (
                    <Text key={c} style={styles.recentDish} numberOfLines={1}>
                      {byCourse[c]?.name ?? '—'}
                    </Text>
                  ))}
                </View>
                <Text style={styles.recentTotal}>
                  {formatEUR(m.totalCostPerPortion * m.couverts)}
                  {m.couverts > 1 ? ` · ${m.couverts} cv` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  welcome: { ...typography.display, color: colors.primary, marginTop: 4 },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: colors.text,
    ...typography.body,
  },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  ctaText: { ...typography.subtitle, color: colors.surface, fontWeight: '700' },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginTop: 4 },
  empty: { ...typography.body, color: colors.textMuted },
  recentRow: { gap: 12, paddingRight: 4 },
  recentCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  recentTitle: { ...typography.subtitle, color: colors.text, fontWeight: '700' },
  recentDishes: { marginTop: 4, gap: 2 },
  recentDish: { ...typography.caption, color: colors.textMuted },
  recentTotal: { ...typography.body, color: colors.primary, fontWeight: '700', marginTop: 4 },
});
