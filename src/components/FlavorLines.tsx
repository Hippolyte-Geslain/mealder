import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Polyline, Text as SvgText, Line } from 'react-native-svg';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { fr } from '../i18n/fr';
import { COURSES, type Course } from '../db/types';
import { FLAVOR_AXES, type FlavorAxis, type FlavorProfile } from '../flavor/types';
import { FLAVOR_AXIS_COLORS } from '../flavor/display';

const VW = 300;
const PAD_X = 26;
const PAD_TOP = 10;
const PAD_BOTTOM = 22;

type Props = {
  profiles: Partial<Record<Course, FlavorProfile | null>>;
  height?: number;
  showLegend?: boolean;
};

/**
 * Courbes de progression : une ligne par axe sensoriel à travers les plats
 * (Entrée → Plat → Dessert). Les plats sans profil sont simplement omis.
 */
export function FlavorLines({ profiles, height = 150, showLegend = true }: Props) {
  const slotX = (i: number) => PAD_X + (i * (VW - 2 * PAD_X)) / (COURSES.length - 1);
  const valueY = (v: number) =>
    PAD_TOP + (1 - Math.min(1, Math.max(0, v))) * (height - PAD_TOP - PAD_BOTTOM);

  const available = COURSES.map((course, i) => ({ course, i, profile: profiles[course] })).filter(
    (e): e is { course: Course; i: number; profile: FlavorProfile } => e.profile != null
  );

  function linePoints(axis: FlavorAxis): string {
    return available.map((e) => `${slotX(e.i)},${valueY(e.profile.axes[axis])}`).join(' ');
  }

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VW} ${height}`}>
        <Line
          x1={PAD_X}
          y1={height - PAD_BOTTOM}
          x2={VW - PAD_X}
          y2={height - PAD_BOTTOM}
          stroke={colors.border}
          strokeWidth={1}
        />
        {COURSES.map((course, i) => (
          <SvgText
            key={course}
            x={slotX(i)}
            y={height - 7}
            fontSize={11}
            fill={profiles[course] ? colors.text : colors.textMuted}
            textAnchor="middle"
          >
            {fr.course[course]}
          </SvgText>
        ))}
        {FLAVOR_AXES.map((axis) => (
          <Polyline
            key={axis}
            points={linePoints(axis)}
            fill="none"
            stroke={FLAVOR_AXIS_COLORS[axis]}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
        {FLAVOR_AXES.map((axis) =>
          available.map((e) => (
            <Circle
              key={`${axis}-${e.course}`}
              cx={slotX(e.i)}
              cy={valueY(e.profile.axes[axis])}
              r={3}
              fill={FLAVOR_AXIS_COLORS[axis]}
            />
          ))
        )}
      </Svg>
      {showLegend && (
        <View style={styles.legend}>
          {FLAVOR_AXES.map((axis) => (
            <View key={axis} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: FLAVOR_AXIS_COLORS[axis] }]} />
              <Text style={styles.legendText}>{fr.flavor.axes[axis]}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 12,
    rowGap: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption, color: colors.textMuted },
});
