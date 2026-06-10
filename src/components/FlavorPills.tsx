import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { fr } from '../i18n/fr';
import { FLAVOR_AXES, type FlavorProfile } from '../flavor/types';

const PILL_THRESHOLD = 0.45;
const MAX_PILLS = 3;

/**
 * Empreinte de saveurs compacte : les dimensions dominantes + le cluster
 * culturel. Rend null si la recette n'a pas (encore) de profil.
 */
export function FlavorPills({ profile }: { profile: FlavorProfile | null }) {
  if (!profile) return null;
  const dominant = FLAVOR_AXES.map((axis) => ({ axis, value: profile.axes[axis] }))
    .filter((e) => e.value >= PILL_THRESHOLD)
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_PILLS);
  if (dominant.length === 0 && !profile.cluster) return null;
  return (
    <View style={styles.row}>
      {dominant.map((e) => (
        <View key={e.axis} style={styles.pill}>
          <Text style={styles.pillText}>{fr.flavor.axes[e.axis]}</Text>
        </View>
      ))}
      {profile.cluster && (
        <View style={[styles.pill, styles.clusterPill]}>
          <Text style={[styles.pillText, styles.clusterText]} numberOfLines={1}>
            {profile.cluster}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  clusterPill: { backgroundColor: colors.accent, borderColor: colors.primary, maxWidth: 160 },
  clusterText: { color: colors.primaryDark },
});
