import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { CourseChip } from '../components/CourseChip';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { formatEUR } from '../utils/money';
import { pickAndStoreRecipePhoto } from '../utils/photos';
import { uuid } from '../utils/uuid';
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  RecipeInUseError,
  updateRecipe,
} from '../db/recipes';
import { searchLibrary, type LibraryEntry } from '../db/ingredientLibrary';
import { COURSES, type Course } from '../db/types';
import { OcrError, runRecipeOcr, type RecipeDraft } from '../ocr/claude';
import type { RecipeFormProps } from '../navigation/types';

type IngredientDraft = {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  costPerPortion: string;
};

function emptyIngredient(): IngredientDraft {
  return { key: uuid(), name: '', quantity: '', unit: '', costPerPortion: '' };
}

function parseNumberOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseCost(s: string): number {
  return parseNumberOrNull(s) ?? 0;
}

function draftToIngredients(items: RecipeDraft['ingredients']): IngredientDraft[] {
  if (items.length === 0) return [emptyIngredient()];
  return items.map((i) => ({
    key: uuid(),
    name: i.name,
    quantity: i.quantity != null ? String(i.quantity) : '',
    unit: i.unit ?? '',
    costPerPortion: '',
  }));
}

function ocrErrorMessage(err: OcrError): string {
  let head: string;
  switch (err.kind) {
    case 'AUTH':
      head = 'Clé API invalide. Vérifiez-la dans Réglages.';
      break;
    case 'RATE_LIMIT':
      head = 'Limite de requêtes atteinte. Réessayez dans un instant.';
      break;
    case 'NETWORK':
      head = 'Pas de réseau. Vérifiez votre connexion.';
      break;
    case 'SERVER':
      head = "Serveur Anthropic indisponible. Réessayez plus tard.";
      break;
    case 'PARSE':
    case 'UNKNOWN':
    default:
      head = fr.ocr.failed;
  }
  const detail = err.message && err.message !== err.kind ? `\n\n[${err.kind}] ${err.message}` : `\n\n[${err.kind}]`;
  return head + detail;
}

export function RecipeForm({ navigation, route }: RecipeFormProps) {
  const recipeId = route.params?.recipeId;
  const isEdit = !!recipeId;

  const [name, setName] = useState('');
  const [course, setCourse] = useState<Course>('entree');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([emptyIngredient()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<LibraryEntry[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  function scheduleSearch(query: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (query.trim() === '') {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const results = await searchLibrary(query);
      setSuggestions(results);
    }, 150);
  }

  function onNameFocus(key: string, currentValue: string) {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setActiveKey(key);
    scheduleSearch(currentValue);
  }

  function onNameBlur() {
    blurTimer.current = setTimeout(() => {
      setActiveKey(null);
      setSuggestions([]);
      blurTimer.current = null;
    }, 200);
  }

  function onNameChange(key: string, value: string) {
    updateIngredient(key, { name: value });
    if (activeKey === key) scheduleSearch(value);
  }

  function fillFromSuggestion(key: string, s: LibraryEntry) {
    setIngredients((prev) =>
      prev.map((i) =>
        i.key === key
          ? {
              ...i,
              name: s.name,
              unit: s.defaultUnit ?? '',
              costPerPortion: String(s.defaultCostPerPortion),
            }
          : i
      )
    );
    setSuggestions([]);
    setActiveKey(null);
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  }

  useEffect(() => {
    if (!recipeId) return;
    let alive = true;
    (async () => {
      const r = await getRecipe(recipeId);
      if (!alive || !r) return;
      setName(r.name);
      setCourse(r.course);
      setPhotoUri(r.photoUri);
      setIngredients(
        r.ingredients.length > 0
          ? r.ingredients.map((i) => ({
              key: i.id,
              name: i.name,
              quantity: i.quantity != null ? String(i.quantity) : '',
              unit: i.unit ?? '',
              costPerPortion: String(i.costPerPortion),
            }))
          : [emptyIngredient()]
      );
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [recipeId]);

  const total = ingredients.reduce((s, i) => s + parseCost(i.costPerPortion), 0);

  function updateIngredient(key: string, patch: Partial<IngredientDraft>) {
    setIngredients((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeIngredient(key: string) {
    setIngredients((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== key) : prev));
  }

  async function onPickPhoto() {
    const uri = await pickAndStoreRecipePhoto();
    if (uri) setPhotoUri(uri);
  }

  async function onImportPhoto() {
    if (ocrLoading) return;
    const uri = await pickAndStoreRecipePhoto();
    if (!uri) return;
    setPhotoUri(uri);
    setOcrLoading(true);
    try {
      const draft = await runRecipeOcr(uri);
      setName(draft.name);
      setCourse(draft.course);
      setIngredients(draftToIngredients(draft.ingredients));
    } catch (e) {
      if (e instanceof OcrError && e.kind === 'NO_API_KEY') {
        Alert.alert(fr.ocr.noKeyTitle, fr.ocr.noKeyMessage, [
          { text: fr.recipeForm.cancel, style: 'cancel' },
          {
            text: fr.ocr.openSettings,
            onPress: () => {
              navigation.getParent()?.getParent()?.navigate('SettingsTab' as never);
            },
          },
        ]);
      } else if (e instanceof OcrError) {
        Alert.alert(fr.common.error, ocrErrorMessage(e));
      } else {
        Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
      }
    } finally {
      setOcrLoading(false);
    }
  }

  async function onSave() {
    if (!name.trim() || saving) return;
    const cleaned = ingredients
      .filter((i) => i.name.trim() !== '' || i.costPerPortion.trim() !== '')
      .map((i) => ({
        name: i.name.trim(),
        quantity: parseNumberOrNull(i.quantity),
        unit: i.unit.trim() || null,
        costPerPortion: parseCost(i.costPerPortion),
      }));
    setSaving(true);
    try {
      const input = { name: name.trim(), course, photoUri, ingredients: cleaned };
      if (recipeId) {
        await updateRecipe(recipeId, input);
      } else {
        await createRecipe(input);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  function onDelete() {
    if (!recipeId) return;
    Alert.alert(fr.recipeForm.confirmDelete, '', [
      { text: fr.recipeForm.cancel, style: 'cancel' },
      {
        text: fr.recipeForm.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipe(recipeId);
            navigation.goBack();
          } catch (e) {
            if (e instanceof RecipeInUseError) {
              Alert.alert(fr.common.error, fr.common.errorRecipeInUse);
            } else {
              Alert.alert(fr.common.error, e instanceof Error ? e.message : String(e));
            }
          }
        },
      },
    ]);
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  const suggestionsVisible = activeKey != null && suggestions.length > 0;

  return (
    <View style={{ flex: 1 }}>
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      bottomOffset={suggestionsVisible ? 240 : 16}
    >
        <Pressable
          onPress={onImportPhoto}
          accessibilityRole="button"
          accessibilityLabel={fr.ocr.importPhoto}
          accessibilityState={{ disabled: ocrLoading, busy: ocrLoading }}
          style={[styles.importBtn, ocrLoading && styles.btnDisabled]}
          disabled={ocrLoading}
        >
          <Text style={styles.importBtnIcon}>📷</Text>
          <Text style={styles.importBtnText}>{fr.ocr.importPhoto}</Text>
        </Pressable>

        <Text style={styles.label}>{fr.recipeForm.name}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder={fr.recipeForm.name}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>{fr.recipeForm.photo}</Text>
        <Pressable onPress={onPickPhoto} style={styles.photoBox}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImg} />
          ) : (
            <Text style={styles.photoHint}>{fr.recipeForm.pickPhoto}</Text>
          )}
        </Pressable>
        {photoUri && (
          <Pressable
            onPress={onPickPhoto}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={fr.recipeForm.changePhoto}
            style={styles.linkBtn}
          >
            <Text style={styles.linkBtnText}>{fr.recipeForm.changePhoto}</Text>
          </Pressable>
        )}

        <Text style={styles.label}>{fr.recipeForm.course}</Text>
        <View style={styles.courseRow}>
          {COURSES.map((c) => (
            <CourseChip
              key={c}
              label={fr.course[c]}
              selected={course === c}
              onPress={() => setCourse(c)}
            />
          ))}
        </View>

        <View style={styles.ingredientHeader}>
          <Text style={styles.label}>{fr.recipeForm.ingredients}</Text>
          <Text style={styles.total}>{formatEUR(total)}</Text>
        </View>

        {ingredients.map((ing) => (
          <View key={ing.key} style={styles.ingredientRow}>
            <TextInput
              value={ing.name}
              onChangeText={(v) => onNameChange(ing.key, v)}
              onFocus={() => onNameFocus(ing.key, ing.name)}
              onBlur={onNameBlur}
              placeholder={fr.recipeForm.ingredientName}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.ingName]}
            />
            {activeKey === ing.key && suggestions.length > 0 && (
              <View style={styles.suggestionList}>
                {suggestions.map((s) => (
                  <Pressable
                    key={s.id}
                    style={styles.suggestionRow}
                    onPress={() => fillFromSuggestion(ing.key, s)}
                  >
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.suggestionMeta}>
                      {s.defaultUnit ?? '—'} · {formatEUR(s.defaultCostPerPortion)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.ingMetaRow}>
              <TextInput
                value={ing.quantity}
                onChangeText={(v) => updateIngredient(ing.key, { quantity: v })}
                placeholder={fr.recipeForm.quantity}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.input, styles.ingQty]}
              />
              <TextInput
                value={ing.unit}
                onChangeText={(v) => updateIngredient(ing.key, { unit: v })}
                placeholder={fr.recipeForm.unit}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.ingUnit]}
              />
              <TextInput
                value={ing.costPerPortion}
                onChangeText={(v) => updateIngredient(ing.key, { costPerPortion: v })}
                placeholder="€"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={[styles.input, styles.ingCost]}
              />
              {ingredients.length > 1 && (
                <Pressable
                  onPress={() => removeIngredient(ing.key)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={fr.recipeForm.delete}
                  style={styles.ingRemove}
                >
                  <Text style={styles.ingRemoveText}>×</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => setIngredients((prev) => [...prev, emptyIngredient()])}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={fr.recipeForm.addIngredient}
          style={styles.addIngredient}
        >
          <Text style={styles.addIngredientText}>+ {fr.recipeForm.addIngredient}</Text>
        </Pressable>

        <Pressable
          onPress={onSave}
          style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}
          disabled={!name.trim() || saving}
        >
          <Text style={styles.saveBtnText}>{fr.recipeForm.save}</Text>
        </Pressable>

        {isEdit && (
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>{fr.recipeForm.delete}</Text>
          </Pressable>
        )}
    </KeyboardAwareScrollView>
    {ocrLoading && (
      <View style={styles.overlay} pointerEvents="auto">
        <View style={styles.overlayCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.overlayText}>{fr.ocr.importing}</Text>
        </View>
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 64, gap: 8 },
  label: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    ...typography.body,
  },
  photoBox: {
    height: 180,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  photoHint: { ...typography.body, color: colors.textMuted },
  linkBtn: { alignSelf: 'flex-start', paddingVertical: 6 },
  linkBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  courseRow: { flexDirection: 'row', gap: 8 },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  total: { ...typography.subtitle, color: colors.primary, fontWeight: '700' },
  ingredientRow: { gap: 6, marginBottom: 8 },
  ingName: {},
  ingMetaRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  ingQty: { flex: 1.2 },
  ingUnit: { flex: 1 },
  ingCost: { flex: 1.2 },
  ingRemove: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  ingRemoveText: { fontSize: 20, color: colors.danger, fontWeight: '700' },
  addIngredient: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginTop: 4,
  },
  addIngredientText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { ...typography.subtitle, color: colors.surface, fontWeight: '700' },
  deleteBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  deleteBtnText: { ...typography.body, color: colors.danger, fontWeight: '600' },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  importBtnIcon: { fontSize: 18 },
  importBtnText: { ...typography.subtitle, color: colors.primaryDark, fontWeight: '700' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(42, 42, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  overlayCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 14,
    minWidth: 220,
  },
  overlayText: { ...typography.body, color: colors.text, fontWeight: '600' },
  suggestionList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginTop: -2,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  suggestionName: { ...typography.body, color: colors.text, flex: 1 },
  suggestionMeta: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
