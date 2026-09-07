# Compétences & connaissances — mealder

> Journal des sujets abordés sur ce projet. Règles : `../Competences/REFERENTIEL.md`.
> Exhaustif et append-only : tout sujet abordé figure ici, même effleuré.

**Projet** : MealMatch (`mealder`) — application mobile Expo / React Native, en français, qui permet à un chef de gérer une bibliothèque de recettes (avec coût matière), de composer des menus entrée/plat/dessert par swipe, d'importer des recettes par CSV ou par OCR Claude (photo et PDF) et d'exporter un menu en PDF, le tout en local sur l'appareil, sans backend.
**Rôle** : seul sur le projet — je définis le besoin, l'architecture et les arbitrages (pas de serveur, distribution APK à coût nul), je pilote Claude Code pour la production du code, je relis et je valide ; je gère le dépôt Git et la chaîne de build/publication Android.
**Période** : 2026-05 → 2026-06
**Stack principale** : Expo SDK 54 / React Native 0.81, TypeScript strict, expo-sqlite, Zustand, React Navigation, EAS Build / EAS Update
**Dernière mise à jour du journal** : 2026-09-07

---

## Index

| Sujet | Cat. | Niv. | Co-réal. | 1re fois | Dernière | Fiche |
|---|---|---|---|---|---|---|
| React Native (Expo SDK 54) | framework | N2 | copilote | 2026-05-14 | 2026-06-03 | [↓](#react-native-expo-sdk-54) |
| TypeScript (mode strict) | langage | N2 | copilote | 2026-05-14 | 2026-06-03 | — |
| React 19 (hooks, composition) | framework | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| React Navigation (drawer, onglets, stacks) | framework | N2 | copilote | 2026-05-28 | 2026-05-29 | [↓](#react-navigation-drawer-onglets-stacks) |
| Zustand (état client) | framework | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| expo-sqlite (base locale) | framework | N2 | copilote | 2026-05-28 | 2026-06-03 | [↓](#expo-sqlite-base-locale) |
| SQL (DDL, contraintes, index) | langage | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Migrations de schéma versionnées | archi | N2 | copilote | 2026-05-28 | 2026-06-03 | [↓](#migrations-de-schéma-versionnées) |
| Architecture local-first (sans backend) | archi | N2 | copilote | 2026-05-29 | 2026-06-03 | [↓](#architecture-local-first-sans-backend) |
| Secret stocké sur l'appareil (expo-secure-store, BYOK) | archi | N2 | copilote | 2026-05-28 | 2026-06-02 | — |
| API Anthropic Messages (tool use) | data-ia | N2 | copilote | 2026-05-28 | 2026-06-03 | [↓](#api-anthropic-messages-tool-use) |
| Prompt système contraint (français, anti-invention) | data-ia | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| OCR de recettes par LLM (photo et PDF) | data-ia | N2 | copilote | 2026-05-28 | 2026-06-03 | [↓](#ocr-de-recettes-par-llm-photo-et-pdf) |
| Taxonomie d'erreurs d'appel LLM | archi | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Redimensionnement d'image avant envoi au modèle | outil | N1 | copilote | 2026-05-28 | 2026-06-03 | — |
| EAS Build (APK Android) | infra | N2 | copilote | 2026-06-02 | 2026-06-03 | [↓](#eas-build-apk-android) |
| Signature Android et sauvegarde de keystore | infra | N2 | copilote | 2026-06-02 | 2026-06-03 | [↓](#signature-android-et-sauvegarde-de-keystore) |
| EAS Update (OTA, canaux) | infra | N2 | copilote | 2026-06-03 | 2026-06-03 | — |
| Versionnement Android (versionCode, runtimeVersion) | infra | N1 | copilote | 2026-06-02 | 2026-06-03 | — |
| Git / GitHub (branche de travail, dépôt distant) | outil | N2 | moi | 2026-05-14 | 2026-06-03 | — |
| react-native-reanimated / worklets (plugin Babel) | framework | N1 | claude | 2026-05-28 | 2026-06-03 | — |
| Interaction par swipe (deck-swiper, gesture-handler) | framework | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Centralisation des chaînes françaises (i18n) | archi | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Tokens de thème (couleurs, typographie) | archi | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Accessibilité mobile (cibles tactiles, labels) | archi | N2 | copilote | 2026-05-29 | 2026-05-29 | — |
| Export PDF via HTML (expo-print, expo-sharing) | framework | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Parseur CSV maison (guillemets, décimales FR) | archi | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Autocomplétion sur bibliothèque d'ingrédients (normalisation, LIKE) | archi | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Coût matière par portion et couverts | metier | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Structure de menu à la française (entrée/plat/dessert) | metier | N2 | copilote | 2026-05-28 | 2026-06-03 | — |
| Embeddings d'ingrédients (recherche Epicure) | metier | N1 | claude | 2026-05-29 | 2026-05-29 | — |
| Compatibilité web d'une app React Native (étude) | archi | N1 | claude | 2026-05-29 | 2026-05-29 | — |
| Spécification par user stories | methode | N2 | copilote | 2026-05-29 | 2026-05-29 | — |
| Pilotage d'agent de code | methode | N3 | copilote | 2026-05-29 | 2026-06-03 | [↓](#pilotage-dagent-de-code) |
| Métrique north star (cadrage produit) | methode | N2 | copilote | 2026-06-02 | 2026-06-02 | — |
| Arbitrage de coûts de distribution mobile | methode | N2 | moi | 2026-05-29 | 2026-05-29 | — |

Légende : catégories, niveaux N1→N4 et part de co-réalisation définis dans le référentiel.

---

## Fiches

### React Native (Expo SDK 54)
`framework` · `N2` · `copilote` · première fois 2026-05-14 · dernière 2026-06-03
*Alias : RN, Expo, React Native 0.81*

**Contexte** — Je voulais une application mobile utilisable par un chef sur son téléphone, sans serveur à héberger ni à payer. J'ai choisi Expo pour éviter d'entretenir des projets natifs iOS/Android.

**Ce que j'ai fait**
- J'ai initialisé le projet sur Expo SDK 54 / React Native 0.81 / React 19, en TypeScript strict, et j'ai maintenu la même base pendant les 11 commits (2026-05-14 → 2026-06-03).
- J'ai fait poser la racine de l'app avec les providers nécessaires dans le bon ordre : `GestureHandlerRootView` > `SafeAreaProvider` > `KeyboardProvider` > navigateur (`App.tsx`).
- J'ai laissé les dossiers natifs `/ios` et `/android` hors du dépôt (`.gitignore`) pour rester en workflow managé et faire générer le natif au moment du build.
- J'ai activé la nouvelle architecture (`newArchEnabled: true`) et l'affichage bord à bord Android dans `app.json`.

**Difficulté rencontrée** — L'application dépend du serveur de développement Metro tant qu'elle n'est pas buildée : tant qu'on reste en dev, un PC doit tourner. C'est ce constat, écrit dans `CLAUDE.md`, qui a déclenché tout le travail de packaging APK — le dev server n'est pas un mode de livraison.

**Preuve** — `App.tsx`, `app.json`, `package.json`, `CLAUDE.md` (section « Architecture facts that matter »)

**Justification du niveau** — N2 et pas N3 : j'ai dirigé la structure et les arbitrages, mais le code des écrans a été produit par Claude sous instruction ; je ne saurais pas encore recréer seul cette base sans assistance.

**Formulation CV** — Conception et pilotage d'une application mobile Expo / React Native (SDK 54, TypeScript strict), du prototype à un APK Android distribuable.

**À creuser** — Les modules natifs et le workflow « bare » ; les tests (aucun test automatisé sur le projet à ce jour).

---

### React Navigation (drawer, onglets, stacks)
`framework` · `N2` · `copilote` · première fois 2026-05-28 · dernière 2026-05-29
*Alias : react-navigation, bottom tabs, drawer*

**Contexte** — L'application compte 10 écrans (Accueil, Bibliothèque, Fiche recette, Compose, Récapitulatif, Menus enregistrés, Détail menu, Import, Revue d'import, Réglages) qu'il fallait organiser sans noyer l'utilisateur.

**Ce que j'ai fait**
- J'ai fait mettre en place une navigation à trois niveaux : drawer racine (`RootNavigator.tsx`) > onglets bas (`MainTabs.tsx`) > stacks natives par section (`HomeStack`, `LibraryStack`, `ComposeStack`, `MenusStack`, `ImportStack`, `SettingsStack`).
- J'ai typé toutes les routes et leurs paramètres (`src/navigation/types.ts`) pour que la navigation soit vérifiée à la compilation.
- J'ai arbitré un changement de navigation en cours de route : passage de la navigation principale du drawer aux onglets bas (commit du 2026-05-29, 9 fichiers touchés), en gardant le drawer pour les sections secondaires.

**Difficulté rencontrée** — La première mouture mettait toute la navigation dans le drawer : les fonctions les plus utilisées demandaient deux gestes. J'ai tranché pour les onglets bas sur les trois parcours principaux et j'ai profité du même commit pour agrandir les zones tactiles trop petites.

**Preuve** — `src/navigation/RootNavigator.tsx`, `src/navigation/MainTabs.tsx`, `src/navigation/types.ts`, commit 2026-05-29 « Move primary nav to bottom tabs and pad small tap targets »

**Justification du niveau** — N2 : j'ai décidé de l'arborescence et de la refonte, mais l'imbrication drawer/tabs/stacks et le typage ont été écrits sous ma direction, pas par moi.

**Formulation CV** — Structuration de la navigation d'une app mobile à 10 écrans (drawer + onglets + stacks typées) et refonte du parcours principal après relecture ergonomique.

**À creuser** — Le deep linking et la restauration d'état de navigation, non abordés.

---

### expo-sqlite (base locale)
`framework` · `N2` · `copilote` · première fois 2026-05-28 · dernière 2026-06-03
*Alias : SQLite, sqlite embarqué*

**Contexte** — Le parti pris est « local-first » : aucune donnée du chef ne sort de son téléphone. Il fallait donc une vraie base relationnelle embarquée plutôt qu'un stockage clé-valeur.

**Ce que j'ai fait**
- J'ai fait modéliser le domaine en 5 tables (`recipe`, `ingredient`, `menu`, `menu_course`, `ingredient_library`) avec clés étrangères, `ON DELETE CASCADE` sur les ingrédients et `ON DELETE RESTRICT` pour empêcher de supprimer une recette utilisée dans un menu.
- J'ai fait ouvrir la base via un singleton asynchrone qui active `PRAGMA foreign_keys = ON` et lance les migrations avant de rendre la main (`src/db/client.ts`).
- J'ai fait ajouter des index sur les accès réels : `recipe(owner_id, course)`, `menu(owner_id, created_at DESC)`, `ingredient_library(owner_id, normalized_name)`.
- J'ai fait isoler l'accès aux données dans `src/db/` (recipes, menus, ingredientLibrary, owner), les écrans ne parlant jamais SQL directement.

**Difficulté rencontrée** — Les contraintes d'intégrité ne servent à rien si `foreign_keys` n'est pas activé à chaque ouverture de connexion : SQLite les ignore silencieusement par défaut. C'est fait dans le seul point d'entrée de la base pour qu'on ne puisse pas l'oublier.

**Preuve** — `src/db/client.ts`, `src/db/schema.ts`, `src/db/recipes.ts`, `src/db/ingredientLibrary.ts`

**Justification du niveau** — N2 : j'ai validé le modèle de données et les règles de suppression, mais je n'ai pas écrit les requêtes ni optimisé de plan d'exécution.

**Formulation CV** — Mise en œuvre d'une persistance locale SQLite (5 tables, contraintes d'intégrité, index) dans une application mobile sans backend.

**À creuser** — Les transactions concurrentes, l'analyse de plan (`EXPLAIN QUERY PLAN`), et la sauvegarde/restauration de la base côté utilisateur.

---

### Migrations de schéma versionnées
`archi` · `N2` · `copilote` · première fois 2026-05-28 · dernière 2026-06-03
*Alias : migrations, user_version, évolution de schéma*

**Contexte** — L'application tourne sur le téléphone de l'utilisateur : chaque évolution du modèle doit passer sur une base qui contient déjà ses recettes, sans réinstallation.

**Ce que j'ai fait**
- J'ai fait mettre en place un tableau de migrations séquentielles appliquées d'après `PRAGMA user_version`, exécutées au premier accès à la base (`src/db/schema.ts`).
- J'ai fait écrire 4 migrations successives : schéma initial, ajout de `couverts` sur `menu`, création de la bibliothèque d'ingrédients, puis ajout de `description` / `tags` sur `recipe`.
- J'ai fait traiter le cas où SQLite ne sait pas modifier une clé primaire en place : recréation de `menu_course` avec une nouvelle PK `(menu_id, position)`, recopie des données existantes en mappant entrée/plat/dessert sur les positions 0/1/2, suppression puis renommage de la table.

**Difficulté rencontrée** — Passer d'« un plat par service et par menu » à « plusieurs plats par service » changeait la clé primaire. Sans migration de recopie, les menus déjà enregistrés par l'utilisateur auraient été perdus ; c'est précisément ce que la migration 4 évite.

**Preuve** — `src/db/schema.ts` (migration 4 : `menu_course_new`, `INSERT ... SELECT`, `DROP`, `RENAME`), commit 2026-06-03 « WIP: compose overhaul - schema, store, hub/deck, scrollable card »

**Justification du niveau** — N2 : j'ai posé l'exigence (ne rien perdre côté utilisateur) et validé la stratégie, mais le SQL de recopie a été écrit sous ma direction. La migration n'a pas encore été vérifiée sur une base réelle installée depuis plusieurs versions.

**Formulation CV** — Conception d'un mécanisme de migrations de base embarquée versionnées, incluant une reprise de données lors d'un changement de clé primaire.

**À creuser** — Tester la chaîne complète de migrations sur une installation ancienne ; prévoir un chemin de retour arrière (rollback) qui n'existe pas aujourd'hui.

---

### Architecture local-first (sans backend)
`archi` · `N2` · `copilote` · première fois 2026-05-29 · dernière 2026-06-03
*Alias : offline-first, BYOK, sans serveur*

**Contexte** — Objectif explicite : livrer l'application à un utilisateur sans rien héberger, sans coût récurrent, et sans détenir ses données ni sa clé d'API.

**Ce que j'ai fait**
- J'ai arrêté et documenté le principe : toutes les données dans SQLite sur l'appareil, aucun serveur, aucune base distante, rien à héberger (`CLAUDE.md`).
- J'ai retenu le modèle « clé apportée par l'utilisateur » (BYOK) : la clé d'API Anthropic est saisie dans l'écran Réglages, stockée via `expo-secure-store` (Keystore Android) et jamais versionnée ; le champ de saisie est masqué et un bouton permet de l'effacer.
- J'ai fait appeler l'API du modèle directement depuis l'appareil, sans proxy intermédiaire, ce qui évite d'exploiter un serveur uniquement pour relayer des requêtes.
- J'ai fait générer un identifiant propriétaire local (`src/db/owner.ts`) pour que le schéma soit déjà multi-propriétaire si un jour la synchronisation devient nécessaire.
- J'ai vérifié la conséquence fonctionnelle : en mode avion l'application s'ouvre et affiche les recettes existantes ; seul l'OCR nécessite le réseau (checklist `APK_BUILD.md`).

**Difficulté rencontrée** — Le compromis assumé : sans backend, la clé d'API vit sur l'appareil et est liée à la signature de l'application. Un changement de keystore rend la clé enregistrée illisible et oblige l'utilisateur à la ressaisir — c'est documenté comme risque plutôt que corrigé.

**Preuve** — `CLAUDE.md`, `src/utils/apiKey.ts`, `src/app/Settings.tsx`, `src/db/owner.ts`, `.gitignore`

**Justification du niveau** — N2 : l'arbitrage architectural est le mien et il est documenté, mais je n'ai pas éprouvé cette architecture au-delà d'un utilisateur ni traité la synchronisation multi-appareils.

**Formulation CV** — Conception d'une application mobile local-first sans backend (données sur l'appareil, clé d'API apportée par l'utilisateur), à coût d'exploitation nul.

**À creuser** — Le chiffrement et l'export de la base, et ce que coûterait une synchronisation multi-appareils si le besoin apparaît.

---

### API Anthropic Messages (tool use)
`data-ia` · `N2` · `copilote` · première fois 2026-05-28 · dernière 2026-06-03
*Alias : Claude API, tool use, sortie structurée*

**Contexte** — L'import de recettes par photo ou PDF doit produire un objet exploitable par la base (nom, service, ingrédients, quantités, unités), pas un texte libre à re-parser.

**Ce que j'ai fait**
- J'ai fait appeler directement `https://api.anthropic.com/v1/messages` depuis l'appareil, avec en-tête de version d'API, modèle et clé lus au moment de l'appel.
- J'ai fait forcer la sortie structurée par un outil déclaré (`record_recipe` pour une photo, `record_recipes` pour un PDF multi-recettes) dont le `input_schema` JSON contraint le champ `course` à l'énumération `entree` / `plat` / `dessert` — exactement les valeurs acceptées par la contrainte `CHECK` de la base.
- J'ai fait rendre les champs incertains optionnels (quantité, unité, description, tags) pour que le modèle omette plutôt que d'inventer.
- J'ai fait prévoir le cas « ce document n'est pas une recette » comme réponse valide plutôt que comme erreur.

**Difficulté rencontrée** — Il fallait que le schéma de l'outil et le schéma SQL ne puissent pas diverger : une valeur de `course` hors énumération aurait été rejetée par SQLite au moment de l'insertion, après l'appel payant. Les deux énumérations sont donc alignées mot pour mot.

**Preuve** — `src/ocr/claude.ts` (`RECIPE_TOOL`), `src/ocr/claudePdf.ts` (`RECIPES_TOOL`), `src/db/schema.ts` (`CHECK (course IN ('entree','plat','dessert'))`)

**Justification du niveau** — N2 : j'ai défini le contrat de sortie et validé les résultats sur des cas réels, mais je n'ai ni mesuré la qualité d'extraction sur un jeu d'essai, ni traité le coût par appel.

**Formulation CV** — Intégration de l'API Claude en sortie structurée (tool use) pour extraire des recettes depuis des documents, avec un schéma d'outil aligné sur le schéma de base.

**À creuser** — Évaluer l'extraction sur un corpus de test, gérer le streaming, et mesurer coût et latence par import.

---

### OCR de recettes par LLM (photo et PDF)
`data-ia` · `N2` · `copilote` · première fois 2026-05-28 · dernière 2026-06-03
*Alias : OCR, extraction documentaire, import photo*

**Contexte** — Le chef possède des fiches recettes manuscrites et imprimées, parfois un livre entier en PDF. Les ressaisir à la main était le principal frein à l'adoption.

**Ce que j'ai fait**
- J'ai fait construire deux chemins d'import : image (`src/ocr/claude.ts`) et PDF multi-recettes (`src/ocr/claudePdf.ts`), tous deux en base64 depuis le système de fichiers de l'appareil.
- J'ai fait redimensionner les images à 1568 px maximum avant envoi (`expo-image-manipulator`), pour rester dans les tailles utiles au modèle.
- J'ai fait rédiger les prompts système en français avec des règles explicites : ne jamais inventer d'ingrédient absent du document, une entrée par ligne visible, aucun prix (les coûts restent saisis par le chef), une recette par page ou par section pour le PDF.
- J'ai fait typer les échecs plutôt que de les fondre en une erreur unique : `NO_API_KEY`, `NETWORK`, `AUTH`, `RATE_LIMIT`, `SERVER`, `PARSE`, `UNKNOWN` (classe `OcrError`).
- J'ai fait passer le résultat par un écran de revue (`ImportReview.tsx`) avant écriture en base : rien n'est enregistré sans validation humaine.
- J'ai posé un plafond de taille sur le PDF (~30 Mo) pour échouer proprement plutôt que dans l'appel réseau.

**Difficulté rencontrée** — Un import automatique est acceptable seulement si l'erreur est visible et corrigeable. D'où deux décisions : les erreurs sont catégorisées pour afficher un message utile (clé absente, clé refusée, quota), et l'extraction passe systématiquement par une revue éditable avant d'entrer en base.

**Preuve** — `src/ocr/claude.ts`, `src/ocr/claudePdf.ts`, `src/app/ImportPicker.tsx`, `src/app/ImportReview.tsx`, `APK_BUILD.md` (métrique north star)

**Justification du niveau** — N2 : j'ai conçu le parcours et les garde-fous et je l'ai éprouvé sur mes propres documents, mais l'exactitude d'extraction n'a pas été mesurée et le chemin PDF n'a pas encore été validé par l'utilisateur final.

**Formulation CV** — Mise en place d'un import de documents par OCR LLM (photo et PDF) avec sortie structurée, erreurs typées et validation humaine avant enregistrement.

**À creuser** — Mesurer le taux d'erreur sur un corpus réel, gérer les PDF longs par lots, et permettre la reprise d'un import interrompu.

---

### EAS Build (APK Android)
`infra` · `N2` · `copilote` · première fois 2026-06-02 · dernière 2026-06-03
*Alias : eas build, expo application services, apk*

**Contexte** — Faire passer l'application du serveur de développement à un fichier installable que l'utilisateur reçoit et ouvre seul, sans PC allumé et sans budget.

**Ce que j'ai fait**
- J'ai créé `eas.json` avec deux profils : `preview` (APK, `distribution: internal`, `gradleCommand: :app:assembleRelease`, canal `preview`) et `production` (APK, canal `production`, `autoIncrement: true`).
- J'ai fixé l'identifiant de package `com.mealder.app` dans `app.json` en sachant qu'il est définitif : le changer après installation crée une autre application, pas une mise à jour.
- J'ai arbitré APK contre AAB : l'AAB est un format de store, seul l'APK s'installe par transfert direct.
- J'ai rédigé `APK_BUILD.md` : prérequis, configuration, versionnement, permissions, taille de bundle, pièges propres à ce dépôt et checklist de vérification avant envoi (installation à froid, migrations, clé persistée après redémarrage, OCR photo et PDF, export PDF, mode avion).
- J'ai branché ensuite EAS Update sur le canal `preview` (`runtimeVersion` en politique `appVersion`) pour pousser des correctifs JS sans rebâtir un APK, puis nettoyé la configuration générée automatiquement dans `app.json`.

**Difficulté rencontrée** — Deux pièges identifiés avant le premier build plutôt qu'après : le plugin Babel `react-native-worklets/plugin` doit être le dernier, sinon les animations cassent silencieusement en build release ; et `newArchEnabled: true` peut faire échouer le build sur un module natif incompatible — la piste de repli est écrite dans le guide.

**Preuve** — `eas.json`, `app.json`, `APK_BUILD.md`, `babel.config.js`, commits 2026-06-02 « Add EAS APK build config (com.mealder.app) » et 2026-06-03 « Wire up EAS Update (channel: preview) »

**Justification du niveau** — N2 : j'ai piloté la configuration et documenté la chaîne, mais je ne suis pas encore allé déboguer un échec de build natif et je n'ai pas mis en place d'intégration continue.

**Formulation CV** — Mise en place de la chaîne de build et de livraison Android d'une app Expo (EAS Build APK, EAS Update OTA, profils preview/production) à coût nul.

**À creuser** — Le débogage d'un build natif en échec (Fabric / TurboModules), le découpage par ABI, et l'automatisation des builds.

---

### Signature Android et sauvegarde de keystore
`infra` · `N2` · `copilote` · première fois 2026-06-02 · dernière 2026-06-03
*Alias : keystore, signature d'application, sideload*

**Contexte** — Un APK installé hors store doit être signé, et toutes les versions suivantes doivent l'être avec la même clé, sinon l'utilisateur doit désinstaller l'application et perd ses données.

**Ce que j'ai fait**
- J'ai laissé EAS générer et héberger les identifiants de signature, puis j'ai récupéré et conservé une sauvegarde hors ligne du keystore dans un dossier séparé du dépôt (un seul fichier `.jks`, jamais versionné).
- J'ai fait exclure du dépôt tous les formats de secret de signature (`*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`, `.env`) dans `.gitignore`.
- J'ai documenté la règle de versionnement : `expo.version` monté à chaque livraison visible, `versionCode` incrémenté par EAS (`autoIncrement`), Android refusant d'installer un `versionCode` inférieur à celui déjà présent.
- J'ai documenté le parcours d'installation par transfert direct : lien de build EAS, téléchargement, autorisation « source inconnue », installation.
- J'ai posé une revue des permissions du manifeste dans le guide : toute permission non utilisée doit être retirée avant diffusion.

**Difficulté rencontrée** — La perte du keystore est irrattrapable et son remplacement a un effet caché : la clé d'API stockée par `expo-secure-store` est liée à la signature de l'application, donc un changement de clé de signature rend la clé de l'utilisateur illisible. C'est la raison qui a motivé la sauvegarde hors ligne.

**Preuve** — `APK_BUILD.md` (sections « Signing », « Versioning », « Delivery »), `eas.json`, `.gitignore` ; sauvegarde du keystore conservée hors dépôt (contenu, alias et mots de passe non consignés ici)

**Justification du niveau** — N2 : j'ai suivi et documenté la procédure de signature gérée par EAS, avec une compréhension des conséquences ; je n'ai pas généré ni fait tourner un keystore à la main, ni géré de rotation de clé.

**Formulation CV** — Prise en charge de la signature et de la distribution hors store d'une application Android (keystore géré et sauvegardé, versionnement, checklist de livraison).

**À creuser** — La rotation de clé et Play App Signing ; la génération manuelle d'un keystore avec `keytool`.

---

### Pilotage d'agent de code
`methode` · `N3` · `copilote` · première fois 2026-05-29 · dernière 2026-06-03
*Alias : Claude Code, CLAUDE.md, documentation de contexte*

**Contexte** — Tout le code de ce projet est produit par un agent sous ma direction. Ma valeur n'est pas la frappe du code : c'est le cadrage, le contexte fourni à l'agent, les arbitrages et la relecture.

**Ce que j'ai fait**
- J'ai écrit et maintenu un `CLAUDE.md` qui ne redit pas le code mais consigne ce qu'on ne peut pas en déduire : le principe local-first, l'appel direct à l'API depuis l'appareil, le fait que le serveur Metro est un outil de développement, la décision de distribution datée du 2026-05-29 avec son tableau de coûts, et les conventions du projet (chaînes en français centralisées, thème par tokens, état Zustand, persistance SQLite).
- J'ai produit une documentation de décision plutôt que descriptive : `APK_BUILD.md` (procédure de livraison, pièges du dépôt, checklist) et `SCREENS.md` (carte des écrans et user stories numérotées US-H1, US-L1…).
- J'ai formulé une métrique north star vérifiable pour trancher ce qu'est « livrer » : l'utilisateur importe une recette par OCR sur son propre téléphone, sans que j'aie touché l'appareil.
- J'ai fait cadrer une étude de faisabilité web « découverte seulement, aucun code modifié », dont le résultat est une liste de blocages classés par gravité — la conclusion étant de ne pas se lancer.
- J'ai isolé le travail risqué sur une branche dédiée (`wip/compose-overhaul`) avant de refondre le parcours de composition.

**Difficulté rencontrée** — La tentation, avec un agent, est de le laisser produire du code là où il fallait d'abord une décision. Les deux moments où j'ai imposé « étude d'abord, code ensuite » (compatibilité web, chaîne de livraison Android) sont ceux qui ont évité le plus de travail inutile : l'étude web a conclu à ne rien faire, l'étude de distribution a supprimé toute dépense.

**Preuve** — `CLAUDE.md`, `APK_BUILD.md`, `SCREENS.md`, `EPICURE_RESEARCH.md`, branche `wip/compose-overhaul`, commit 2026-05-29 « added claude.md with discovery about possible web implementation »

**Justification du niveau** — N3 et pas N4 : je pilote de façon autonome — je cadre, je documente le contexte, j'arbitre et je relis — et je saurais refaire cette méthode seul sur un autre projet ; je n'ai pas encore de recul sur un travail à plusieurs personnes ni sur la transmission de cette méthode.

**Formulation CV** — Pilotage d'un développement assisté par agent IA : cadrage, documentation de contexte et de décision, arbitrages techniques et relecture, du prototype à la livraison.

**À creuser** — La revue systématique de code produit par l'agent (aucun test automatisé sur ce projet), et la façon de faire tenir cette méthode dans une équipe.

---

## Sujets explorés, non retenus

| Sujet | Date | Pourquoi écarté | Ce que j'en retiens |
|---|---|---|---|
| Publication sur Google Play | 2026-05-29 | 25 $ de frais d'inscription et processus de revue, pour un seul utilisateur | Le transfert direct d'APK couvre le besoin à 0 $ ; le store se justifie à partir d'une diffusion large |
| Version iOS / TestFlight | 2026-05-29 | Compte développeur Apple à 99 $/an, cible Android uniquement | Le coût d'entrée iOS est un arbitrage produit, pas une contrainte technique |
| Format AAB | 2026-06-02 | Format réservé au Play Store, non installable par transfert direct | APK pour le sideload, AAB pour le store |
| Build web statique (`expo start --web`) | 2026-05-29 | Étude seulement, aucun code modifié : `expo-secure-store` sans support web, `expo-file-system/legacy` inutilisable, appel API bloqué par CORS, `expo-print` sans retour de fichier | Une app React Native sans aucun branchement `Platform.OS` n'est pas portable gratuitement ; la liste des blocages est écrite et chiffrée en gravité |
| Fonctionnalités Epicure (profil de saveurs, substitutions, équilibre de menu) | 2026-05-29 | Poids et code du modèle non publiés à la date de la recherche (mai 2026) | Trois pistes produit documentées avec leur point d'intégration, réactivables si le modèle sort |
| Intégration continue des builds | 2026-06-02 | Un seul utilisateur et des builds occasionnels : `eas build` manuel suffit | À reprendre quand la fréquence de livraison le justifiera |
| Télémétrie et remontée de crash | 2026-06-02 | Choix assumé de ne rien collecter sur une application local-first | Sans outil de crash, le seul canal de remontée est l'utilisateur ; à compenser par un bouton d'envoi de logs si besoin |
| Permission Android `RECORD_AUDIO` | 2026-06-02 | Déclarée dans `app.json`, aucun code audio dans `src/` | À retirer avant diffusion : une permission inutile est un coût de confiance, conformément à la revue de permissions de `APK_BUILD.md` |
