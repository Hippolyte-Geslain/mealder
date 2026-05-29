# MealMatch — Screen Map & User Stories

---

## 1. Home

**Function:** Entry point. Shows a search shortcut, a CTA to start composing a menu, and the 5 most recent menus.

### User stories

**US-H1 — Search a recipe from home**
1. Tap the search bar.
2. Type a recipe name.
3. Tap the search key → lands on Library filtered to that query.

**US-H2 — Start composing a menu**
1. Tap "Composer un menu".
2. → Redirected to Compose (step 1).

**US-H3 — Reopen a recent menu**
1. Scroll the "Menus récents" row.
2. Tap a card.
3. → Opens Menu Detail for that menu.

---

## 2. Library

**Function:** Browse and filter the full recipe catalogue. Entry point to creating or editing a recipe.

### User stories

**US-L1 — Browse recipes**
1. Open Library from the bottom tab bar.
2. Scroll the list.

**US-L2 — Filter by course**
1. Tap "Entrée", "Plat" or "Dessert" chip.
2. List narrows to that course.
3. Tap "Tout" to reset.

**US-L3 — Search a recipe**
1. Type in the search bar.
2. List filters in real time.

**US-L4 — Create a recipe**
1. Tap the "+" FAB.
2. → Opens Recipe Form (create mode).

**US-L5 — Edit a recipe**
1. Tap a recipe row.
2. → Opens Recipe Form (edit mode).

---

## 3. Recipe Form

**Function:** Create or edit a recipe — name, course, photo, and ingredient list with quantities and cost per portion.

### User stories

**US-RF1 — Fill in a recipe manually**
1. Enter recipe name.
2. Choose course (Entrée / Plat / Dessert).
3. Optionally pick a photo.
4. Add one or more ingredients (name, quantity, unit, cost/portion).
5. Tap "Enregistrer" → returns to Library.

**US-RF2 — Import a recipe from a photo (OCR)**
1. Tap "Importer depuis une photo".
2. Pick a photo from the gallery or camera.
3. The app sends the image to Claude; a loading overlay appears.
4. Name, course and ingredient list are pre-filled.
5. Adjust if needed, then save.

**US-RF3 — Autocomplete an ingredient name**
1. Start typing in an ingredient name field.
2. Suggestion dropdown appears (from ingredient library).
3. Tap a suggestion → name, unit and default cost are filled.

**US-RF4 — Delete a recipe**
1. Open a recipe in edit mode.
2. Tap "Supprimer" at the bottom.
3. Confirm in the alert.
4. → Returns to Library.

---

## 4. Compose

**Function:** Step-by-step swipe picker to select one recipe per course (starter → main → dessert).

### User stories

**US-C1 — Compose a menu by swiping**
1. Open Compose from the bottom tab bar.
2. Swipe right (or tap ✓) on a recipe to pick it for the current course.
3. Swipe left (or tap ✗) to skip to the next card.
4. Repeat for all 3 courses.
5. → Lands on Menu Summary.

**US-C2 — Handle an empty course**
1. If no recipe exists for the current course, an empty-state message appears.
2. Tap "Aller à la bibliothèque" → Library opens to add a recipe.

---

## 5. Menu Summary

**Function:** Review the composed menu, set a title and number of covers, see the cost breakdown, then save.

### User stories

**US-MS1 — Save a composed menu**
1. Review the three selected recipes.
2. Edit the menu title if desired.
3. Adjust number of covers with the +/− stepper.
4. Tap "Enregistrer le menu" → navigates to Menu Detail.

---

## 6. Menu Detail

**Function:** View the full detail of a saved menu — recipes, cover count, per-cover cost, grand total. Export or delete.

### User stories

**US-MD1 — Adjust covers after saving**
1. Tap +/− to change the number of covers.
2. Grand total updates live; the new count is persisted.

**US-MD2 — Export as PDF**
1. Tap "Exporter en PDF".
2. The system share sheet opens with the generated PDF.

**US-MD3 — Delete a menu**
1. Tap "Supprimer le menu".
2. Confirm in the alert.
3. → Returns to the previous screen.

---

## 7. Saved Menus

**Function:** List all saved menus. Tap to open; swipe-left to delete.

### User stories

**US-SM1 — Open a saved menu**
1. Open "Mes menus" from the drawer.
2. Tap a menu row → Menu Detail.

**US-SM2 — Delete a menu by swiping**
1. Swipe a row to the left.
2. Tap the red "Supprimer" button.
3. Confirm in the alert → menu is removed.

---

## 8. Import Picker

**Function:** Choose a bulk import source — CSV file or PDF scan (OCR via Claude).

### User stories

**US-IP1 — Import recipes from a CSV**
1. Open Importer from the drawer.
2. Tap "Importer un CSV".
3. Pick a CSV file from the system picker.
4. → Proceeds to Import Review.

**US-IP2 — Import recipes from a PDF**
1. Tap "Importer un PDF".
2. Pick a PDF file.
3. The PDF is sent to Claude for extraction; a loading overlay appears.
4. → Proceeds to Import Review.

---

## 9. Import Review

**Function:** Review, rename, and validate detected recipes before bulk-inserting into the library.

### User stories

**US-IR1 — Confirm an import batch**
1. Review each detected recipe card.
2. Deselect recipes to skip (tap checkbox).
3. Edit recipe names or change course if needed.
4. Tap "Importer N recette(s)" → saved to Library; navigates there.

---

## 10. Settings

**Function:** Store the Anthropic API key needed for OCR features.

### User stories

**US-S1 — Set up the Claude API key**
1. Open Réglages from the drawer.
2. Paste the API key in the secure field.
3. Tap "Enregistrer" → key is stored encrypted on-device.

**US-S2 — Remove the API key**
1. Tap "Supprimer la clé" (visible only when a key is set).
2. Field clears; key is deleted from secure storage.

---
---

# MealMatch — Carte des écrans & User stories

---

## 1. Accueil

**Fonction :** Point d'entrée. Affiche un raccourci de recherche, un bouton pour composer un menu et les 5 menus les plus récents.

### User stories

**US-H1 — Rechercher une recette depuis l'accueil**
1. Appuyer sur la barre de recherche.
2. Saisir le nom d'une recette.
3. Valider (touche Rechercher) → arrive dans la Bibliothèque avec la requête pré-remplie.

**US-H2 — Démarrer la composition d'un menu**
1. Appuyer sur "Composer un menu".
2. → Redirigé vers Composer (étape 1).

**US-H3 — Rouvrir un menu récent**
1. Faire défiler la rangée "Menus récents".
2. Appuyer sur une carte.
3. → Ouvre le Détail de ce menu.

---

## 2. Bibliothèque

**Fonction :** Parcourir et filtrer le catalogue de recettes. Point d'entrée pour créer ou modifier une recette.

### User stories

**US-L1 — Parcourir les recettes**
1. Ouvrir la Bibliothèque via la barre d'onglets.
2. Faire défiler la liste.

**US-L2 — Filtrer par type de plat**
1. Appuyer sur "Entrée", "Plat" ou "Dessert".
2. La liste se restreint au type choisi.
3. Appuyer sur "Tout" pour réinitialiser.

**US-L3 — Rechercher une recette**
1. Saisir dans la barre de recherche.
2. La liste se filtre en temps réel.

**US-L4 — Créer une recette**
1. Appuyer sur le bouton "+" (FAB).
2. → Ouvre le Formulaire recette (mode création).

**US-L5 — Modifier une recette**
1. Appuyer sur une ligne de recette.
2. → Ouvre le Formulaire recette (mode édition).

---

## 3. Formulaire recette

**Fonction :** Créer ou modifier une recette — nom, type, photo et liste d'ingrédients avec quantités et coût par portion.

### User stories

**US-RF1 — Saisir une recette manuellement**
1. Entrer le nom de la recette.
2. Choisir le type (Entrée / Plat / Dessert).
3. Choisir une photo (optionnel).
4. Ajouter les ingrédients (nom, quantité, unité, coût/portion).
5. Appuyer sur "Enregistrer" → retour à la Bibliothèque.

**US-RF2 — Importer une recette depuis une photo (OCR)**
1. Appuyer sur "Importer depuis une photo".
2. Choisir une photo dans la galerie ou depuis l'appareil photo.
3. L'application envoie l'image à Claude ; un écran de chargement s'affiche.
4. Le nom, le type et les ingrédients sont pré-remplis.
5. Ajuster si nécessaire, puis enregistrer.

**US-RF3 — Autocompléter un nom d'ingrédient**
1. Commencer à saisir dans un champ de nom d'ingrédient.
2. Une liste de suggestions apparaît (depuis la bibliothèque d'ingrédients).
3. Appuyer sur une suggestion → nom, unité et coût par défaut sont remplis.

**US-RF4 — Supprimer une recette**
1. Ouvrir la recette en mode édition.
2. Appuyer sur "Supprimer" en bas de l'écran.
3. Confirmer dans l'alerte.
4. → Retour à la Bibliothèque.

---

## 4. Composer

**Fonction :** Sélection par swipe, étape par étape, d'une recette par type de plat (entrée → plat → dessert).

### User stories

**US-C1 — Composer un menu par swipe**
1. Ouvrir Composer depuis la barre d'onglets.
2. Swiper à droite (ou appuyer ✓) pour choisir une recette pour le type en cours.
3. Swiper à gauche (ou appuyer ✗) pour passer à la carte suivante.
4. Répéter pour les 3 types de plat.
5. → Arrive sur le Récapitulatif du menu.

**US-C2 — Gérer un type de plat sans recette**
1. Si aucune recette n'existe pour le type en cours, un écran vide s'affiche.
2. Appuyer sur "Aller à la bibliothèque" → ouvre la Bibliothèque pour ajouter une recette.

---

## 5. Récapitulatif du menu

**Fonction :** Vérifier le menu composé, définir un titre et un nombre de couverts, consulter le coût, puis enregistrer.

### User stories

**US-MS1 — Enregistrer un menu composé**
1. Consulter les trois recettes sélectionnées.
2. Modifier le titre du menu si souhaité.
3. Ajuster le nombre de couverts avec le bouton +/−.
4. Appuyer sur "Enregistrer le menu" → navigue vers le Détail du menu.

---

## 6. Détail du menu

**Fonction :** Voir le détail complet d'un menu enregistré — recettes, couverts, coût par couvert et total général. Exporter ou supprimer.

### User stories

**US-MD1 — Ajuster les couverts après sauvegarde**
1. Appuyer sur +/− pour modifier le nombre de couverts.
2. Le total général se met à jour en direct ; la valeur est sauvegardée.

**US-MD2 — Exporter en PDF**
1. Appuyer sur "Exporter en PDF".
2. La feuille de partage système s'ouvre avec le PDF généré.

**US-MD3 — Supprimer un menu**
1. Appuyer sur "Supprimer le menu".
2. Confirmer dans l'alerte.
3. → Retour à l'écran précédent.

---

## 7. Mes menus

**Fonction :** Lister tous les menus enregistrés. Appuyer pour ouvrir ; swiper à gauche pour supprimer.

### User stories

**US-SM1 — Ouvrir un menu enregistré**
1. Ouvrir "Mes menus" depuis le menu latéral.
2. Appuyer sur une ligne → Détail du menu.

**US-SM2 — Supprimer un menu par swipe**
1. Swiper une ligne vers la gauche.
2. Appuyer sur le bouton rouge "Supprimer".
3. Confirmer dans l'alerte → le menu est supprimé.

---

## 8. Importer (sélection)

**Fonction :** Choisir la source d'import en masse — fichier CSV ou scan PDF (OCR via Claude).

### User stories

**US-IP1 — Importer des recettes depuis un CSV**
1. Ouvrir Importer depuis le menu latéral.
2. Appuyer sur "Importer un CSV".
3. Choisir un fichier CSV depuis le sélecteur système.
4. → Passe à la Revue d'import.

**US-IP2 — Importer des recettes depuis un PDF**
1. Appuyer sur "Importer un PDF".
2. Choisir un fichier PDF.
3. Le PDF est envoyé à Claude pour extraction ; un écran de chargement s'affiche.
4. → Passe à la Revue d'import.

---

## 9. Revue d'import

**Fonction :** Vérifier, renommer et valider les recettes détectées avant de les insérer en masse dans la bibliothèque.

### User stories

**US-IR1 — Confirmer un import en masse**
1. Consulter chaque carte de recette détectée.
2. Décocher les recettes à ignorer.
3. Modifier les noms ou changer le type si nécessaire.
4. Appuyer sur "Importer N recette(s)" → sauvegardées dans la Bibliothèque ; navigation vers celle-ci.

---

## 10. Réglages

**Fonction :** Stocker la clé API Anthropic nécessaire pour les fonctions OCR.

### User stories

**US-S1 — Configurer la clé API Claude**
1. Ouvrir Réglages depuis le menu latéral.
2. Coller la clé API dans le champ sécurisé.
3. Appuyer sur "Enregistrer" → clé stockée chiffrée sur l'appareil.

**US-S2 — Supprimer la clé API**
1. Appuyer sur "Supprimer la clé" (visible uniquement si une clé est enregistrée).
2. Le champ se vide ; la clé est effacée du stockage sécurisé.
