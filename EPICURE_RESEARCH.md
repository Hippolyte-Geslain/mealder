# Epicure — Research Summary & MealMatch Opportunities

> Based on two companion papers published May 2026:
> - *Epicure: Multidimensional Flavor Structure in Food Ingredient Embeddings* (arXiv 2604.22776)
> - *Epicure: Navigating the Emergent Geometry of Food Ingredient Embeddings* (arXiv 2605.22391)

---

## Paper Summary

Epicure is a family of ingredient embedding models that compress culinary knowledge into a compact, navigable vector space. The team trained three sibling models — **Cooc** (recipe co-occurrence), **Core** (recipe + chemistry blend), and **Chem** (aroma chemistry) — on **4.14 million multilingual recipes** across 7 languages, normalized to **1,790 canonical ingredients**. The total model size is ~2 MB.

The core idea: by training on millions of recipe pairings and chemical compound relationships, the model learns a 300-dimensional space where **culinary meaning becomes geometric direction**. You can navigate from one ingredient toward a cuisine, a flavor profile, or a texture — using simple vector arithmetic.

### What it recovers

| Dimension type | Examples | Best correlation |
|---|---|---|
| Sensory (taste) | Sweetness, saltiness, umami, heat (Scoville) | ρ = 0.37–0.76 |
| Macronutrients | Fat, protein, carbs | ρ = 0.44–0.47 |
| Cultural clustering | Japanese, Mediterranean, South Asian | 6.2× lift over baseline |
| Emergent clusters | "South Asian whole spice blends", 150–200 per model | — |

### Method in brief

1. Raw FlavorGraph (6,653 noisy ingredients) cleaned via LLM-augmented pipeline → 1,032 canonical entries.
2. Retrained from scratch on 4.14M multilingual recipes → 1,790 canonical ingredients.
3. Two navigation operators: **nearest-neighbour pairing** (ingredient companions) and **SLERP rotation** (continuous morphing along a culinary axis — e.g. nudge tomatoes "toward Japanese cuisine").

### Status

Code and weights are **not yet publicly released** as of publication (May 2026). The authors explicitly flag the gap between the research artifact and "tools the hospitality industry can actually use."

---

## 3 Use Cases for Professional Chefs

### 1. Cross-cuisine ingredient substitution
A chef running out of a key ingredient can query Epicure's nearest-neighbour operator to find the closest substitute *in the same flavor dimension* — respecting the texture, fat content, or cultural profile of the original. E.g. "What replaces miso in a French bistro context?" returns ingredients with matching umami score but a European cuisine vector.

### 2. Menu cohesion check
Before printing a seasonal menu, a chef can verify that the chosen dishes form a coherent flavor arc. Epicure's 150–200 emergent clusters make it possible to check whether starters, mains and desserts belong to overlapping or complementary sensory clusters — flagging jarring combinations before service.

### 3. Creativity / new dish ideation
Using the SLERP rotation operator, a chef can input a signature dish's ingredient set and ask: "What does this dish look like if I slide it 40% toward North African cuisine?" The model returns ingredient swaps sorted by directional distance — a structured creative brief rather than a blank page.

---

## Features for MealMatch

### Main feature — Flavor-profile card on each recipe

**What:** Display a compact flavor fingerprint on every recipe in the library — a small radar or pill-row showing the dominant dimensions recovered by Epicure: sweetness, saltiness, umami, fat richness, heat, and the top cultural cluster.

**Why it fits MealMatch:** Chefs already enter ingredients with quantities and costs. Epicure needs only the ingredient *names* to produce the embedding. The 2 MB model can run client-side or via a tiny serverless call, keeping the app local-first. The card gives chefs an at-a-glance sensory read without any manual tagging effort.

**Integration point:** `src/db/recipes.ts` — compute and cache the profile when a recipe is created or updated. Display in `RecipeCard.tsx` and `RecipeForm.tsx`.

---

### Secondary features

#### A. Smart ingredient substitution suggestions
When a chef removes an ingredient from a recipe form and the field is left empty, offer a "suggest a substitute" button. It queries the Epicure nearest-neighbour space filtered by the recipe's current cultural cluster, returning 3 ranked alternatives with matching texture and flavor dimension scores.

#### B. Menu flavor balance indicator on Compose
In the Compose screen, after each course is picked, show a cumulative flavor bar (e.g. "your menu is heavy on fat and umami — consider a lighter dessert"). The signal is the vector sum of the three selected recipes' embeddings projected onto the 7 sensory axes. The indicator updates live as courses are swiped.

#### C. Cross-cuisine variation mode in Compose
Add an optional "Explore" toggle in Compose. When enabled, the swipe deck is reordered using SLERP rotation toward a cuisine the chef selects (French, Japanese, Mediterranean…). Recipes closest to that directional target bubble to the top — turning a random swipe session into a guided culinary journey.

---

## Sources

- [arXiv 2605.22391 — Epicure: Navigating the Emergent Geometry of Food Ingredient Embeddings](https://arxiv.org/abs/2605.22391)
- [arXiv 2604.22776 — Epicure: Multidimensional Flavor Structure in Food Ingredient Embeddings](https://arxiv.org/abs/2604.22776)
- [Hugging Face paper page](https://huggingface.co/papers/2605.22391)
- [AI Hospitality Alliance write-up](https://aihospitalityalliance.com/research/epicure-multidimensional-flavor-structure-food-ingredient-embeddings)
- [Mervin Praison — Epicure Food AI overview](https://mer.vin/2026/05/epicure-food-ai-4-million-recipes-compressed-into-a-2mb-ingredient-map/)
