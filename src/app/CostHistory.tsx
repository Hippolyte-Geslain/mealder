import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCostHistory,
  listCostSummaries,
  type CostHistoryEntry,
  type IngredientCostSummary,
} from '../db/ingredientLibrary';
import { fr } from '../i18n/fr';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { formatEUR } from '../utils/money';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

function DeltaArrow({ current, previous }: { current: number; previous: number | null }) {
  if (previous == null || current === previous) return null;
  const up = current > previous;
  return (
    <Text style={[styles.delta, { color: up ? colors.danger : colors.success }]}>
      {up ? '▲' : '▼'}
    </Text>
  );
}

function HistoryRows({ normalizedName }: { normalizedName: string }) {
  const [entries, setEntries] = useState<CostHistoryEntry[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getCostHistory(normalizedName).then((h) => {
        if (alive) setEntries(h);
      });
      return () => {
        alive = false;
      };
    }, [normalizedName])
  );

  if (entries === null) {
    return <ActivityIndicator color={colors.primary} style={styles.historyLoading} />;
  }
  if (entries.length === 0) {
    return <Text style={styles.noHistory}>{fr.costHistory.noHistory}</Text>;
  }
  return (
    <View style={styles.history}>
      {entries.map((e, i) => {
        const previous = entries[i + 1]?.cost ?? null;
        return (
          <View key={`${e.recordedAt}-${i}`} style={styles.historyRow}>
            <Text style={styles.historyDate}>{dateFmt.format(new Date(e.recordedAt))}</Text>
            <View style={styles.historyCostWrap}>
              <DeltaArrow current={e.cost} previous={previous} />
              <Text style={styles.historyCost}>
                {formatEUR(e.cost)}
                {e.unit ? ` / ${e.unit}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function CostHistory() {
  const [summaries, setSummaries] = useState<IngredientCostSummary[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listCostSummaries().then((s) => {
        if (alive) setSummaries(s);
      });
      return () => {
        alive = false;
      };
    }, [])
  );

  if (summaries === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (summaries.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.empty}>{fr.costHistory.empty}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={summaries}
      keyExtractor={(item) => item.normalizedName}
      ListHeaderComponent={<Text style={styles.help}>{fr.costHistory.help}</Text>}
      renderItem={({ item }) => {
        const isOpen = expanded === item.normalizedName;
        return (
          <View style={styles.card}>
            <Pressable
              style={styles.cardHeader}
              onPress={() => setExpanded(isOpen ? null : item.normalizedName)}
            >
              <View style={styles.nameWrap}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>{fr.costHistory.changes(item.changeCount)}</Text>
              </View>
              <Text style={styles.cost}>
                {formatEUR(item.currentCost)}
                {item.defaultUnit ? ` / ${item.defaultUnit}` : ''}
              </Text>
              <Text style={styles.chevron}>{isOpen ? '▾' : '▸'}</Text>
            </Pressable>
            {isOpen && <HistoryRows normalizedName={item.normalizedName} />}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 48, gap: 10 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', padding: 24 },
  help: { ...typography.caption, color: colors.textMuted, lineHeight: 18, marginBottom: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  nameWrap: { flex: 1 },
  name: { ...typography.subtitle, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cost: { ...typography.subtitle, color: colors.primary, fontWeight: '700' },
  chevron: { fontSize: 14, color: colors.textMuted, width: 14, textAlign: 'center' },
  history: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  historyLoading: { paddingVertical: 10 },
  noHistory: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  historyDate: { ...typography.caption, color: colors.textMuted },
  historyCostWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  delta: { fontSize: 11, fontWeight: '700' },
  historyCost: { ...typography.body, color: colors.text, fontWeight: '600' },
});
