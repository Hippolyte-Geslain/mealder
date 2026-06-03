import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { fr } from '../i18n/fr';
import { formatEUR } from '../utils/money';
import type { RecipeWithIngredients } from '../db/types';

export function RecipeCard({ recipe }: { recipe: RecipeWithIngredients }) {
  return (
    <View style={styles.card}>
      <View style={styles.photoWrap}>
        {recipe.photoUri ? (
          <Image source={{ uri: recipe.photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoPlaceholderText}>{fr.course[recipe.course].charAt(0)}</Text>
          </View>
        )}
      </View>
      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.body}
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        <Text style={styles.name} numberOfLines={2}>
          {recipe.name}
        </Text>
        <Text style={styles.course}>{fr.course[recipe.course]}</Text>

        {recipe.tags.length > 0 && (
          <View style={styles.tagRow}>
            {recipe.tags.map((t) => (
              <View key={t} style={styles.tagChip}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.description && (
          <Text style={styles.description}>{recipe.description}</Text>
        )}

        <View style={styles.ingredients}>
          {recipe.ingredients.map((ing) => (
            <View key={ing.id} style={styles.ingRow}>
              <Text style={styles.ingName} numberOfLines={1}>
                · {ing.name}
                {ing.quantity != null
                  ? ` — ${ing.quantity}${ing.unit ? ' ' + ing.unit : ''}`
                  : ''}
              </Text>
              <Text style={styles.ingCost}>{formatEUR(ing.costPerPortion)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{fr.recipeForm.total}</Text>
          <Text style={styles.totalValue}>{formatEUR(recipe.totalCostPerPortion)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  photoWrap: { width: '100%', height: 220, backgroundColor: colors.surfaceAlt },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 56, color: colors.primary, fontWeight: '700' },
  bodyScroll: { flex: 1 },
  body: { padding: 18, gap: 6, paddingBottom: 140 },
  name: { ...typography.title, color: colors.text },
  course: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tagChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { ...typography.caption, color: colors.text },
  description: { ...typography.body, color: colors.textMuted, marginTop: 6 },
  ingredients: { marginTop: 12, gap: 4 },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  ingName: { ...typography.body, color: colors.text, flex: 1 },
  ingCost: { ...typography.body, color: colors.textMuted },
  totalRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { ...typography.subtitle, color: colors.text },
  totalValue: { ...typography.subtitle, color: colors.primary, fontWeight: '700' },
});
