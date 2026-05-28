import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { fr } from '../i18n/fr';
import { formatEUR } from '../utils/money';
import { COURSES, type MenuWithCourses } from '../db/types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(menu: MenuWithCourses): string {
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
    return `
      <section class="course">
        <div class="course-label">${courseLabel}</div>
        <div class="dish-name">${dishName}</div>
      </section>
    `;
  }).join('\n');

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
    <hr class="divider" />
    <div class="footer">${escapeHtml(formatEUR(menu.totalCostPerPortion * menu.couverts))} — ${menu.couverts} couvert${menu.couverts > 1 ? 's' : ''}</div>
  </div>
</body>
</html>`;
}

export async function exportMenuPdf(menu: MenuWithCourses): Promise<void> {
  const html = buildHtml(menu);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: menu.title });
  }
}
