/**
 * Rebrand "Señal Nocturna" — SearchPage: misma lógica, estado y navegación que
 * el archivo original. Solo cambia el chrome: acento bordo → signal, sombras negras → glow rosa.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { safeBack } from '@/core/navigation/safeBack';
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useSearch } from "@/contexts/SearchContext";
import { TOKENS } from "@/core/design-system/tokens";
const SIGNAL = TOKENS.color.signal;
import { useThemeColors } from "@/stores/theme.store";
import type { Category } from "@/interfaces/category";
import type { Provider } from "@/interfaces/provider";
import type { Service } from "@/interfaces/service";

type ResultItem =
  | { key: string; type: "category"; data: Category }
  | { key: string; type: "provider"; data: Provider }
  | { key: string; type: "service"; data: Service };

const isServiceArray = (value: unknown): value is Service[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === "object" && item !== null && "id" in item);

export const SearchPage = () => {
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const debouncedValue = useDebouncedValue(value, 320);
  const { results, loading, error, runSearch, lastQuery } = useSearch();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (!debouncedValue.trim()) return;
    runSearch(debouncedValue).catch(() => {});
  }, [debouncedValue, runSearch]);

  const items = useMemo<ResultItem[]>(() => {
    if (!results || !debouncedValue.trim()) return [];
    const list: ResultItem[] = [];
    if (isServiceArray(results)) {
      results.forEach((s) => list.push({ key: `svc-${s.id}`, type: "service", data: s }));
      return list;
    }
    results.categories?.forEach((c) => list.push({ key: `cat-${c.id}`, type: "category", data: c }));
    results.providers?.forEach((p) => list.push({ key: `prov-${p.id}`, type: "provider", data: p }));
    results.services?.forEach((s) => list.push({ key: `svc-${s.id}`, type: "service", data: s }));
    return list;
  }, [results, debouncedValue]);

  const renderItem = ({ item }: { item: ResultItem }) => {
    if (item.type === "category") {
      return (
        <Pressable
          onPress={() => router.push({ pathname: "/(tabs)/services/category/[id]", params: { id: item.data.id, from: "search" } })}
          style={[s.card, { backgroundColor: tc.card, borderColor: tc.border }]}
        >
          <View style={[s.categoryAccent, { backgroundColor: SIGNAL }]} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[s.cardTitle, { color: tc.text }]}>{item.data.name}</Text>
            {item.data.description ? (
              <Text style={[s.cardSub, { color: tc.textSub }]} numberOfLines={1}>{item.data.description}</Text>
            ) : null}
          </View>
          <View style={s.pill}>
            <Text style={s.pillText}>Categoría</Text>
          </View>
        </Pressable>
      );
    }

    if (item.type === "provider") {
      const initial = (item.data.name?.[0] ?? "?").toUpperCase();
      return (
        <Pressable
          onPress={() => router.push({ pathname: "/(tabs)/services/provider/[id]", params: { id: item.data.id as string, from: "search" } })}
          style={[s.card, { backgroundColor: tc.card, borderColor: tc.border }]}
        >
          {item.data.avatar ? (
            <Image source={{ uri: item.data.avatar }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatarFallback, { backgroundColor: SIGNAL + "22" }]}>
              <Text style={[s.avatarInitial, { color: SIGNAL }]}>{initial}</Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[s.cardTitle, { color: tc.text }]}>{item.data.name}</Text>
            {item.data.title ? (
              <Text style={[s.cardSub, { color: tc.textSub }]} numberOfLines={1}>{item.data.title}</Text>
            ) : null}
            {item.data.rating != null ? (
              <View style={s.ratingRow}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={s.ratingText}>{Number(item.data.rating).toFixed(1)}</Text>
                {item.data.location ? (
                  <>
                    <Text style={[s.dot, { color: tc.border }]}>·</Text>
                    <Text style={[s.cardSub, { color: tc.textSub }]} numberOfLines={1}>{item.data.location}</Text>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={16} color={tc.border} />
        </Pressable>
      );
    }

    if (item.type === "service") {
      return (
        <Pressable
          onPress={() => router.push({ pathname: "/(tabs)/services/provider/[id]", params: { id: item.data.providerId ?? item.data.userId ?? "", from: "search" } })}
          style={[s.card, { backgroundColor: tc.card, borderColor: tc.border }]}
        >
          <View style={[s.serviceIcon, { backgroundColor: SIGNAL + "15" }]}>
            <Ionicons name="briefcase-outline" size={20} color={SIGNAL} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[s.cardTitle, { color: tc.text }]}>{item.data.title}</Text>
            {item.data.description ? (
              <Text style={[s.cardSub, { color: tc.textSub }]} numberOfLines={2}>{item.data.description}</Text>
            ) : null}
            <View style={s.ratingRow}>
              {item.data.categoryName ? (
                <View style={s.pill}>
                  <Text style={s.pillText}>{item.data.categoryName}</Text>
                </View>
              ) : null}
              {item.data.price ? (
                <Text style={[s.priceText, { color: SIGNAL }]}>
                  Desde ${item.data.price}
                </Text>
              ) : (
                <Text style={[s.cardSub, { color: tc.textSub }]}>Consultar precio</Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={tc.border} />
        </Pressable>
      );
    }

    return null;
  };

  const showEmpty = !loading && debouncedValue.trim().length > 0 && items.length === 0 && !error;
  const showInitial = !debouncedValue.trim() && !loading;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[s.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
        <StatusBar barStyle={tc.bg === '#F7F5FB' ? 'dark-content' : 'light-content'} />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: tc.border }]}>
          <Pressable onPress={() => safeBack(router, '/(tabs)')} hitSlop={10} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={tc.text} />
          </Pressable>
          <View style={[
            s.inputWrap,
            { backgroundColor: tc.card, borderColor: focused ? SIGNAL : tc.border },
            focused && s.inputWrapFocused,
          ]}>
            <Ionicons name="search-outline" size={17} color={focused ? SIGNAL : tc.textSub} />
            <TextInput
              ref={inputRef}
              style={[s.input, { color: tc.text }]}
              placeholder="Buscar servicios, profesionales…"
              placeholderTextColor={tc.textSub}
              value={value}
              onChangeText={setValue}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {value.length > 0 && (
              <Pressable onPress={() => setValue("")} hitSlop={8}>
                <Ionicons name="close-circle" size={17} color={tc.textSub} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Loading */}
        {loading && (
          <View style={s.loaderWrap}>
            <ActivityIndicator color={SIGNAL} />
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={s.centered}>
            <Ionicons name="alert-circle-outline" size={36} color={tc.textSub} />
            <Text style={[s.feedbackText, { color: tc.textSub }]}>{error}</Text>
          </View>
        )}

        {/* Empty result */}
        {showEmpty && (
          <View style={s.centered}>
            <Ionicons name="search-outline" size={42} color={tc.textSub} />
            <Text style={[s.feedbackTitle, { color: tc.text }]}>Sin resultados</Text>
            <Text style={[s.feedbackText, { color: tc.textSub }]}>
              No encontramos nada para "{lastQuery}"
            </Text>
          </View>
        )}

        {/* Initial state */}
        {showInitial && (
          <View style={s.centered}>
            <Ionicons name="search-outline" size={42} color={tc.textSub} />
            <Text style={[s.feedbackTitle, { color: tc.text }]}>¿Qué estás buscando?</Text>
            <Text style={[s.feedbackText, { color: tc.textSub }]}>
              Buscá servicios, profesionales o categorías
            </Text>
          </View>
        )}

        {/* Results */}
        {items.length > 0 && (
          <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            contentContainerStyle={s.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  inputWrapFocused: {
    shadowColor: SIGNAL,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  loaderWrap: {
    paddingTop: 32,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  feedbackText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryAccent: {
    width: 4,
    height: 36,
    borderRadius: 4,
    opacity: 0.85,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 17,
    fontWeight: "700",
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardSub: {
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
  },
  dot: {
    fontSize: 12,
    fontWeight: "700",
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: SIGNAL + "15",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    color: SIGNAL,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
