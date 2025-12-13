import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { useDebouncedValue } from "@/src/shared/hooks/useDebouncedValue";
import { useSearch } from "@/src/contexts/SearchContext";
import { SearchBar } from "@/src/shared/ui/SearchBar";
import { Category } from "@/src/interfaces/category";
import { Provider } from "@/src/interfaces/provider";
import { Service } from "@/src/interfaces/service";
import { TOKENS } from "@/theme/tokens";

type ResultItem =
  | { key: string; type: "category"; data: Category }
  | { key: string; type: "provider"; data: Provider }
  | { key: string; type: "service"; data: Service };

const isServiceArray = (value: unknown): value is Service[] =>
  Array.isArray(value) &&
  value.every(
    (item) => typeof item === "object" && item !== null && "id" in item
  );

export const SearchPage = () => {
  const [value, setValue] = useState("");
  const debouncedValue = useDebouncedValue(value, 320);
  const router = useRouter();
  const { results, loading, error, runSearch, lastQuery } = useSearch();

  useEffect(() => {
    if (!debouncedValue.trim()) {
      return;
    }
    runSearch(debouncedValue).catch((err) => console.error(err));
  }, [debouncedValue, runSearch]);

  const items = useMemo<ResultItem[]>(() => {
    if (!results || !debouncedValue.trim()) return [];
    const list: ResultItem[] = [];

    if (isServiceArray(results)) {
      results.forEach((service) =>
        list.push({ key: `svc-${service.id}`, type: "service", data: service })
      );
      return list;
    }

    results.categories?.forEach((category) =>
      list.push({ key: `cat-${category.id}`, type: "category", data: category })
    );
    results.providers?.forEach((provider) =>
      list.push({
        key: `prov-${provider.id}`,
        type: "provider",
        data: provider,
      })
    );
    results.services?.forEach((service) =>
      list.push({ key: `svc-${service.id}`, type: "service", data: service })
    );
    return list;
  }, [results, debouncedValue]);

  const renderItem = ({ item }: { item: ResultItem }) => {
    switch (item.type) {
      case "category":
        return (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/services/category/[id]",
                params: { id: item.data.id },
              })
            }
            style={[styles.card, styles.categoryCard]}
          >
            <View style={styles.cardRow}>
              <View style={styles.badge} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.cardTitle}>{item.data.name}</Text>
                <Text style={styles.cardSubtitle}>{item.data.description}</Text>
                <Text style={styles.pill}>Ver categoría</Text>
              </View>
            </View>
          </Pressable>
        );
      case "provider":
        return (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/services/provider/[id]",
                params: { id: item.data.id as string },
              })
            }
            style={styles.card}
          >
            <View style={[styles.row, { alignItems: "center" }]}>
              <View style={styles.avatar} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cardTitle}>{item.data.name}</Text>
                <Text style={styles.cardSubtitle}>{item.data.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaHighlight}>
                    {item.data.rating ? item.data.rating.toFixed(1) : "N/D"} ★
                  </Text>
                  <View style={styles.dot} />
                  <Text style={styles.meta}>
                    {item.data.location ?? "Sin ubicación"}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        );
      case "service":
        return (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/services/provider/[id]",
                params: { id: item.data.providerId ?? item.data.userId ?? "" },
              })
            }
            style={styles.card}
          >
            <View style={{ gap: 6, flex: 1 }}>
              <Text style={styles.cardTitle}>{item.data.title}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.data.description}
              </Text>
              <View style={styles.metaRow}>
                {item.data.categoryName ? (
                  <>
                    <Text style={styles.pill}>{item.data.categoryName}</Text>
                    <View style={styles.dot} />
                  </>
                ) : null}
                <Text style={styles.meta}>
                  {item.data.price
                    ? `Desde $${item.data.price}`
                    : "Precio a consultar"}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

  const showEmpty =
    !loading &&
    debouncedValue.trim().length > 0 &&
    items.length === 0 &&
    !error;

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <SearchBar value={value} onChange={setValue} />
        {loading ? <ActivityIndicator style={styles.loader} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {showEmpty ? (
          <Text style={styles.empty}>
            No encontramos resultados para "{lastQuery}"
          </Text>
        ) : null}
        {items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9fafb",
    gap: 12,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 32,
    gap: 12,
  },
  loader: {
    marginTop: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    ...TOKENS.shadow.soft,
    gap: 10,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
  },
  categoryCard: {
    backgroundColor: "#F8FAFF",
  },
  cardRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flex: 1,
  },
  badge: {
    width: 10,
    height: 42,
    borderRadius: 8,
    backgroundColor: TOKENS.color.primary,
    opacity: 0.85,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TOKENS.color.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: TOKENS.color.sub,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#EEF2FF",
    color: TOKENS.color.primary,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaHighlight: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.color.primary,
  },
  meta: {
    fontSize: 12,
    color: TOKENS.color.sub,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  chevron: {
    fontSize: 22,
    color: TOKENS.color.sub,
    paddingLeft: 6,
  },
  empty: {
    marginTop: 12,
    color: TOKENS.color.sub,
    textAlign: "center",
  },
  error: {
    color: "#DC2626",
    marginTop: 8,
    textAlign: "center",
  },
});
