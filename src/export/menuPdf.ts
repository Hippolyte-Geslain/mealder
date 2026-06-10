import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { fr } from '../i18n/fr';
import { formatEUR } from '../utils/money';
import { COURSES, type MenuWithCourses } from '../db/types';
import { FLAVOR_AXES, type FlavorAxis, type FlavorProfile } from '../flavor/types';

/** 'client' : sans aucun coût. 'kitchen' : coûts détaillés + radar de saveurs (D10). */
export type PdfVariant = 'client' | 'kitchen';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function menuFlavorAverage(menu: MenuWithCourses): Record<FlavorAxis, number> | null {
  const profiles = menu.courses
    .map((c) => c.recipe.flavor)
    .filter((p): p is FlavorProfile => p != null);
  if (profiles.length === 0) return null;
  const avg = {} as Record<FlavorAxis, number>;
  for (const axis of FLAVOR_AXES) {
    avg[axis] = profiles.reduce((s, p) => s + p.axes[axis], 0) / profiles.length;
  }
  return avg;
}

// Même géométrie que src/components/FlavorRadar.tsx, rendue en SVG inline
// (le composant React Native n'est pas utilisable dans le HTML d'expo-print).
function buildRadarSvg(values: Record<FlavorAxis, number>): string {
  const size = 220;
  const labelSpace = 28;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - labelSpace;
  const angle = (i: number) => ((-90 + (i * 360) / FLAVOR_AXES.length) * Math.PI) / 180;
  const pt = (i: number, frac: number) =>
    `${(cx + r * frac * Math.cos(angle(i))).toFixed(1)},${(cy + r * frac * Math.sin(angle(i))).toFixed(1)}`;
  const ring = (frac: number) => FLAVOR_AXES.map((_, i) => pt(i, frac)).join(' ');
  const valuePoints = FLAVOR_AXES.map((axis, i) =>
    pt(i, Math.min(1, Math.max(0, values[axis])))
  ).join(' ');
  const grid = [1 / 3, 2 / 3, 1]
    .map((f) => `<polygon points="${ring(f)}" fill="none" stroke="#D6CDB7" stroke-width="1"/>`)
    .join('');
  const spokes = FLAVOR_AXES.map((_, i) => {
    const [x, y] = pt(i, 1).split(',');
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#D6CDB7" stroke-width="1"/>`;
  }).join('');
  const labels = FLAVOR_AXES.map((axis, i) => {
    const a = angle(i);
    const lx = (cx + (r + 12) * Math.cos(a)).toFixed(1);
    const ly = (cy + (r + 12) * Math.sin(a) + 3.5).toFixed(1);
    const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
    return `<text x="${lx}" y="${ly}" font-size="11" fill="#6B6B6B" text-anchor="${anchor}" font-family="Georgia, serif">${escapeHtml(fr.flavor.axes[axis])}</text>`;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${grid}${spokes}
    <polygon points="${valuePoints}" fill="#4A6B3F" fill-opacity="0.3" stroke="#4A6B3F" stroke-width="2"/>
    ${labels}
  </svg>`;
}

function buildHtml(menu: MenuWithCourses, variant: PdfVariant): string {
  const byCourse = Object.fromEntries(menu.courses.map((c) => [c.course, c.recipe]));
  const dateStr = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(menu.createdAt));

  const courseSections = COURSES.map((c) => {
    const r = byCourse[c];
    const courseLabel = escapeHtml(fr.course[c]);
    const dishName = r ? escapeHtml(r.name) : '&mdash;';
    const costLine =
      variant === 'kitchen' && r
        ? `<div class="dish-cost">${escapeHtml(formatEUR(r.totalCostPerPortion))} / couvert</div>`
        : '';
    return `
      <section class="course">
        <div class="course-label">${courseLabel}</div>
        <div class="dish-name">${dishName}</div>
        ${costLine}
      </section>
    `;
  }).join('\n');

  const flavorAverage = variant === 'kitchen' ? menuFlavorAverage(menu) : null;
  const kitchenSections =
    variant === 'kitchen'
      ? `
    <hr class="divider" />
    <table class="costs">
      <tr><td>${escapeHtml(fr.menuSummary.total)}</td><td>${escapeHtml(formatEUR(menu.totalCostPerPortion))}</td></tr>
      <tr><td>${escapeHtml(fr.menuSummary.couverts)}</td><td>${menu.couverts}</td></tr>
      <tr class="grand"><td>${escapeHtml(fr.menuSummary.grandTotal(menu.couverts))}</td><td>${escapeHtml(formatEUR(menu.totalCostPerPortion * menu.couverts))}</td></tr>
    </table>
    ${
      flavorAverage
        ? `<div class="flavor"><div class="course-label">${escapeHtml(fr.flavor.menuMixTitle)}</div>${buildRadarSvg(flavorAverage)}</div>`
        : ''
    }`
      : '';

  const footer =
    variant === 'kitchen'
      ? `<div class="footer">${escapeHtml(fr.export.kitchenFooter)}</div>`
      : '';

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(menu.title)}</title>
<style>
  @page { size: A4; margin: 40mm 32mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    color: #2A2A2A;
    background: #F7F1E3;
    margin: 0;
    padding: 0;
  }
  .frame {
    border: 2px solid #4A6B3F;
    padding: 48px 36px;
    background: #FFFDF5;
  }
  .title {
    text-align: center;
    font-size: 36pt;
    color: #4A6B3F;
    letter-spacing: 0.02em;
    margin: 0 0 8px;
  }
  .date {
    text-align: center;
    font-size: 12pt;
    color: #6B6B6B;
    margin-bottom: 36px;
    font-style: italic;
  }
  .course {
    text-align: center;
    margin: 28px 0;
  }
  .course-label {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #4A6B3F;
    margin-bottom: 6px;
  }
  .dish-name {
    font-size: 20pt;
    color: #2A2A2A;
  }
  .dish-cost {
    font-size: 11pt;
    color: #6B6B6B;
    margin-top: 4px;
  }
  .costs {
    margin: 0 auto;
    border-collapse: collapse;
    font-size: 12pt;
  }
  .costs td {
    padding: 4px 14px;
  }
  .costs td:last-child {
    text-align: right;
    color: #4A6B3F;
  }
  .costs tr.grand td {
    font-weight: bold;
    border-top: 1px solid #D6CDB7;
  }
  .flavor {
    text-align: center;
    margin-top: 28px;
  }
  .flavor svg {
    margin-top: 8px;
  }
  .divider {
    border: none;
    border-top: 1px solid #D6CDB7;
    width: 30%;
    margin: 28px auto;
  }
  .footer {
    text-align: center;
    font-size: 10pt;
    color: #6B6B6B;
    margin-top: 36px;
    letter-spacing: 0.1em;
  }
</style>
</head>
<body>
  <div class="frame">
    <h1 class="title">${escapeHtml(menu.title)}</h1>
    <div class="date">${dateStr}</div>
    ${courseSections}
    ${kitchenSections}
    ${footer}
  </div>
</body>
</html>`;
}

export async function exportMenuPdf(menu: MenuWithCourses, variant: PdfVariant): Promise<void> {
  const html = buildHtml(menu, variant);
  // Web : printToFileAsync ne retourne pas de fichier et le partage est
  // indisponible ; on ouvre le dialogue d'impression du navigateur
  // ("Enregistrer en PDF").
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: menu.title });
  }
}
