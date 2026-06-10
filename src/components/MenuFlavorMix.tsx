import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { fr } from '../i18n/fr';
import { COURSES, type Course } from '../db/types';
import { FLAVOR_AXES, type FlavorAxis, type FlavorProfile } from '../flavor/types';
import { FlavorRadar } from './FlavorRadar';
import { FlavorLines } from './FlavorLines';

type Props = {
  profiles: Partial<Record<Course, FlavorProfile | null>>;
  /** Bandeau réduit pour l'écran Composer (radar + courbes côte à côte). */
  compact?: boolean;
};

function menuAverage(available: FlavorProfile[]): Record<FlavorAxis, number> {
  const avg = {} as Record<FlavorAxis, number>;
  for (const axis of FLAVOR_AXES) {
    avg[axis] = available.reduce((s, p) => s + p.axes[axis], 0) / available.length;
  }
  return avg;
}

/**
 * Visualisation des saveurs d'un menu — purement informative (décision D2,
 * projectlaunch.md) : aucun conseil, aucune alerte, aucun réordonnancement.
 * Rend null tant qu'aucune recette sélectionnée n'a de profil.
 */
export function MenuFlavorMix({ profiles, compact = false }: Props) {
  const available = COURSES.map((c) => profiles[c]).filter((p): p is FlavorProfile => p != null);
  if (available.length === 0) return null;
  const average = menuAverage(available);

  if (compact) {
    return (
      <View style={[styles.card, styles.compactRow]}>
        <FlavorRadar values={average} size={104} showLabels={false} />
        <View style={styles.compactLines}>
          <FlavorLines profiles={profiles} height={104} showLegend={false} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{fr.flavor.menuMixTitle}</Text>
      <View style={styles.radarWrap}>
        <FlavorRadar values={average} size={220} />
      </View>
      <FlavorLines profiles={profiles} height={150} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  title: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  radarWrap: { alignItems: 'center' },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  compactLines: { flex: 1 },
});
