import type { FlavorAxis } from './types';

/** Couleur de tracé par axe sensoriel (radar non concerné : une seule série). */
export const FLAVOR_AXIS_COLORS: Record<FlavorAxis, string> = {
  sucre: '#C2679B',
  sale: '#4A7BB5',
  umami: '#8A5A44',
  gras: '#C9A227',
  piquant: '#B33A3A',
  acide: '#6F9E3C',
};
