import Svg, { Line, Polygon, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fr } from '../i18n/fr';
import { FLAVOR_AXES, type FlavorAxis } from '../flavor/types';

const GRID_RINGS = [1 / 3, 2 / 3, 1];

type Props = {
  values: Record<FlavorAxis, number>;
  size?: number;
  showLabels?: boolean;
};

/** Hexagone des saveurs : un polygone unique sur les 6 axes sensoriels. */
export function FlavorRadar({ values, size = 220, showLabels = true }: Props) {
  const labelSpace = showLabels ? 26 : 6;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - labelSpace;

  const angle = (i: number) => ((-90 + (i * 360) / FLAVOR_AXES.length) * Math.PI) / 180;
  const point = (i: number, frac: number) =>
    `${cx + r * frac * Math.cos(angle(i))},${cy + r * frac * Math.sin(angle(i))}`;
  const ring = (frac: number) => FLAVOR_AXES.map((_, i) => point(i, frac)).join(' ');
  const valuePoints = FLAVOR_AXES.map((axis, i) =>
    point(i, Math.min(1, Math.max(0, values[axis])))
  ).join(' ');

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {GRID_RINGS.map((frac) => (
        <Polygon key={frac} points={ring(frac)} fill="none" stroke={colors.border} strokeWidth={1} />
      ))}
      {FLAVOR_AXES.map((_, i) => {
        const [x, y] = point(i, 1).split(',').map(Number);
        return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={colors.border} strokeWidth={1} />;
      })}
      <Polygon
        points={valuePoints}
        fill={colors.primary}
        fillOpacity={0.3}
        stroke={colors.primary}
        strokeWidth={2}
      />
      {showLabels &&
        FLAVOR_AXES.map((axis, i) => {
          const a = angle(i);
          const lx = cx + (r + 12) * Math.cos(a);
          const ly = cy + (r + 12) * Math.sin(a);
          const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
          return (
            <SvgText
              key={axis}
              x={lx}
              y={ly + 3.5}
              fontSize={11}
              fill={colors.textMuted}
              textAnchor={anchor}
            >
              {fr.flavor.axes[axis]}
            </SvgText>
          );
        })}
    </Svg>
  );
}
