import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecipeCard } from '../components/RecipeCard';
import { listRecipes, getRecipe } from '../db/recipes';
import { useComposeStore } from '../state/composeStore';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { COURSES, type Course, type RecipeWithIngredients } from '../db/types';
import type { ComposeStartProps } from '../navigation/types';

const PROMPTS: Record<Course, string> = {
  entree: fr.compose.pickEntree,
  plat: fr.compose.pickPlat,
  dessert: fr.compose.pickDessert,
};

type Mode = { kind: 'hub' } | { kind: 'deck'; course: Course };

export function Compose({ navigation }: ComposeStartProps) {
  const [mode, setMode] = useState<Mode>({ kind: 'hub' });
  const picks = useComposeStore((s) => s.picks);
  const addPick = useComposeStore((s) => s.addPick);
  const removePickAt = useComposeStore((s) => s.removePickAt);
  const reset = useComposeStore((s) => s.reset);

  useFocusEffect(
    useCallback(() => {
      reset();
      setMode({ kind: 'hub' });
    }, [reset])
  );

  if (mode.kind === 'hub') {
    return (
      <Hub
        picks={picks}
        onPickCourse={(course) => setMode({ kind: 'deck', course })}
        onRemove={(i) => removePickAt(i)}
        onFinish={() => navigation.navigate('MenuSummary')}
      />
    );
  }

  return (
    <Deck
      course={mode.course}
      onBack={() => setMode({ kind: 'hub' })}
      onPicked={(recipeId) => {
        addPick(mode.course, recipeId);
        setMode({ kind: 'hub' });
      }}
    />
  );
}

// ---------- Hub ----------

function Hub({
  picks,
  onPickCourse,
  onRemove,
  onFinish,
}: {
  picks: { course: Course; recipeId: string }[];
  onPickCourse: (course: Course) => void;
  onRemove: (index: number) => void;
  onFinish: () => void;
}) {
  const [recipes, setRecipes] = useState<Record<string, RecipeWithIngredients | null>>({});

  useEffect(() => {
    let alive = true;
    const missing = picks
      .map((p) => p.recipeId)
      .filter((id) => !(id in recipes));
    if (missing.length === 0) return;
    Promise.all(missing.map((id) => getRecipe(id))).then((rs) => {
      if (!alive) return;
      setRecipes((prev) => {
        const next = { ...prev };
        missing.forEach((id, i) => {
          next[id] = rs[i];
        });
        return next;
      });
    });
    return () => {
      alive = false;
    };
  }, [picks, recipes]);

  const counts: Record<Course, number> = { entree: 0, plat: 0, dessert: 0 };
  picks.forEach((p) => {
    counts[p.course] += 1;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.hubContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.hubTitle}>{fr.compose.hubTitle}</Text>
      <Text style={styles.hubSubtitle}>{fr.compose.hubSubtitle}</Text>

      <View style={styles.courseList}>
        {COURSES.map((c) => (
          <Pressable
            key={c}
            style={styles.courseRow}
            onPress={() => onPickCourse(c)}
            accessibilityRole="button"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.courseRowLabel}>+ {fr.course[c]}</Text>
              <Text style={styles.courseRowMeta}>
                {fr.compose.countLabel(counts[c])}
              </Text>
            </View>
            <Text style={styles.courseRowChevron}>›</Text>
          </Pressable>
        ))}
      </View>

      {picks.length > 0 && (
        <View style={styles.picksBlock}>
          <Text style={styles.picksHeader}>{fr.compose.picksHeader}</Text>
          {picks.map((p, i) => {
            const r = recipes[p.recipeId];
            return (
              <View key={`${p.recipeId}-${i}`} style={styles.pickRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickName} numberOfLines={1}>
                    {r ? r.name : '…'}
                  </Text>
                  <Text style={styles.pickCourse}>{fr.course[p.course]}</Text>
                </View>
                <Pressable
                  onPress={() => onRemove(i)}
                  hitSlop={10}
                  style={styles.removeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={fr.compose.removePick}
                >
                  <Text style={styles.removeBtnText}>×</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <Pressable
        style={[styles.finishBtn, picks.length === 0 && styles.btnDisabled]}
        disabled={picks.length === 0}
        onPress={onFinish}
      >
        <Text style={styles.finishBtnText}>{fr.compose.terminer}</Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------- Deck ----------

function Deck({
  course,
  onBack,
  onPicked,
}: {
  course: Course;
  onBack: () => void;
  onPicked: (recipeId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<Swiper<RecipeWithIngredients> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoading(true);
      listRecipes(course).then((r) => {
        if (alive) {
          setRecipes(r);
          setLoading(false);
        }
      });
      return () => {
        alive = false;
      };
    }, [course])
  );

  function onSwipedRight(cardIndex: number) {
    const r = recipes[cardIndex];
    if (r) onPicked(r.id);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (recipes.length === 0) {
    return (
      <View style={[styles.container, styles.center, styles.emptyPad]}>
        <Text style={styles.emptyText}>{fr.compose.empty(fr.course[course])}</Text>
        <Pressable style={styles.primaryBtn} onPress={onBack}>
          <Text style={styles.primaryBtnText}>{fr.compose.backToHub}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.deckHeader}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.prompt}>{PROMPTS[course]}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.deckFull}>
        <Swiper
          ref={(r) => {
            swiperRef.current = r;
          }}
          cards={recipes}
          renderCard={(card) => (card ? <RecipeCard recipe={card} /> : null)}
          onSwipedRight={onSwipedRight}
          onSwipedLeft={() => {}}
          cardIndex={0}
          backgroundColor={colors.background}
          stackSize={Math.min(3, recipes.length)}
          stackSeparation={14}
          cardVerticalMargin={10}
          cardHorizontalMargin={16}
          disableTopSwipe
          disableBottomSwipe
          verticalSwipe={false}
          showSecondCard
          animateCardOpacity
        />

        <View
          pointerEvents="box-none"
          style={[styles.fabRow, { bottom: insets.bottom + 16 }]}
        >
          <Pressable
            style={[styles.fab, styles.skipFab]}
            onPress={() => swiperRef.current?.swipeLeft()}
            accessibilityRole="button"
            accessibilityLabel={fr.compose.skip}
          >
            <Text style={styles.skipText}>✗</Text>
          </Pressable>
          <Pressable
            style={[styles.fab, styles.pickFab]}
            onPress={() => swiperRef.current?.swipeRight()}
            accessibilityRole="button"
            accessibilityLabel={fr.compose.pick}
          >
            <Text style={styles.pickText}>✓</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  emptyPad: { padding: 24, gap: 16 },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryBtnText: { color: colors.surface, fontWeight: '700' },

  // Hub
  hubContent: { padding: 20, paddingBottom: 48, gap: 12 },
  hubTitle: { ...typography.display, color: colors.text },
  hubSubtitle: { ...typography.body, color: colors.textMuted, marginBottom: 8 },
  courseList: { gap: 10 },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  courseRowLabel: { ...typography.subtitle, color: colors.text, fontWeight: '700' },
  courseRowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  courseRowChevron: { fontSize: 26, color: colors.textMuted, fontWeight: '300' },

  picksBlock: { marginTop: 12, gap: 8 },
  picksHeader: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  pickName: { ...typography.body, color: colors.text, fontWeight: '600' },
  pickCourse: { ...typography.caption, color: colors.primary, marginTop: 2 },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  removeBtnText: { fontSize: 20, color: colors.danger, fontWeight: '700', lineHeight: 22 },

  finishBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  btnDisabled: { opacity: 0.4 },
  finishBtnText: { ...typography.subtitle, color: colors.surface, fontWeight: '700' },

  // Deck
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 30, color: colors.primary, fontWeight: '300', lineHeight: 32 },
  prompt: { ...typography.title, color: colors.text, flex: 1, textAlign: 'center' },
  deckFull: { flex: 1 },

  fabRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
  },
  fab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  skipFab: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pickFab: { backgroundColor: colors.primary },
  skipText: { fontSize: 28, color: colors.danger, fontWeight: '700' },
  pickText: { fontSize: 28, color: colors.surface, fontWeight: '700' },
});
