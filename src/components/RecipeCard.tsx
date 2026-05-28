import { View, Text, Image, StyleSheet } from 'react-native';
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
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {recipe.name}
        </Text>
        <Text style={styles.course}>{fr.course[recipe.course]}</Text>
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
      </View>
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
  photoWrap: { width: '100%', height: '45%', backgroundColor: colors.surfaceAlt },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 56, color: colors.primary, fontWeight: '700' },
  body: { flex: 1, padding: 18, gap: 6 },
  name: { ...typography.title, color: colors.text },
  course: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  ingredients: { marginTop: 8, gap: 4 },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  ingName: { ...typography.body, color: colors.text, flex: 1 },
  ingCost: { ...typography.body, color: colors.textMuted },
  totalRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { ...typography.subtitle, color: colors.text },
  totalValue: { ...typography.subtitle, color: colors.primary, fontWeight: '700' },
});
