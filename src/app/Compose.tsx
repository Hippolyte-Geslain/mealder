import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useFocusEffect } from '@react-navigation/native';
import { RecipeCard } from '../components/RecipeCard';
import { listRecipes } from '../db/recipes';
import { useComposeStore } from '../state/composeStore';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { Course, RecipeWithIngredients } from '../db/types';
import type { ComposeStartProps } from '../navigation/types';

const STEPS: Course[] = ['entree', 'plat', 'dessert'];
const PROMPTS: Record<Course, string> = {
  entree: fr.compose.pickEntree,
  plat: fr.compose.pickPlat,
  dessert: fr.compose.pickDessert,
};

export function Compose({ navigation }: ComposeStartProps) {
  const [step, setStep] = useState(0);
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
  const [loading, setLoading] = useState(true);
  const setPick = useComposeStore((s) => s.setPick);
  const reset = useComposeStore((s) => s.reset);
  const swiperRef = useRef<Swiper<RecipeWithIngredients> | null>(null);

  const currentCourse = STEPS[step];

  useFocusEffect(
    useCallback(() => {
      reset();
      setStep(0);
    }, [reset])
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setLoading(true);
      listRecipes(currentCourse).then((r) => {
        if (alive) {
          setRecipes(r);
          setLoading(false);
        }
      });
      return () => {
        alive = false;
      };
    }, [currentCourse])
  );

  function onPick(cardIndex: number) {
    const recipe = recipes[cardIndex];
    if (!recipe) return;
    setPick(currentCourse, recipe.id);
    if (step === STEPS.length - 1) {
      navigation.navigate('MenuSummary');
    } else {
      setStep((s) => s + 1);
    }
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
        <Text style={styles.emptyText}>{fr.compose.empty(fr.course[currentCourse])}</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.getParent()?.navigate('LibraryTab' as never)}
        >
          <Text style={styles.primaryBtnText}>{fr.compose.goToLibrary}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>{fr.compose.step(step + 1, STEPS.length)}</Text>
        <Text style={styles.prompt}>{PROMPTS[currentCourse]}</Text>
      </View>
      <View style={styles.deck}>
        <Swiper
          key={step}
          ref={(r) => {
            swiperRef.current = r;
          }}
          cards={recipes}
          renderCard={(card) => (card ? <RecipeCard recipe={card} /> : null)}
          onSwipedRight={onPick}
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
          infinite
          showSecondCard
          animateCardOpacity
        />
      </View>
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, styles.skipBtn]}
          onPress={() => swiperRef.current?.swipeLeft()}
        >
          <Text style={styles.skipText}>✗ {fr.compose.skip}</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.pickBtn]}
          onPress={() => swiperRef.current?.swipeRight()}
        >
          <Text style={styles.pickText}>✓ {fr.compose.pick}</Text>
        </Pressable>
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
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6, gap: 4 },
  stepText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  prompt: { ...typography.title, color: colors.text },
  deck: { flex: 1 },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 28,
    gap: 14,
    justifyContent: 'center',
  },
  actionBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  skipBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pickBtn: { backgroundColor: colors.primary },
  skipText: { fontSize: 18, color: colors.danger, fontWeight: '700' },
  pickText: { fontSize: 18, color: colors.surface, fontWeight: '700' },
});
