/**
 * Rebrand "Señal Nocturna" — SearchPage: misma lógica, estado y navegación que
 * el archivo original. Solo cambia el chrome: acento bordo → signal, sombras negras → glow rosa.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { safeBack } from '@/core/navigation/safeBack';
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useSearch } from "@/contexts/SearchContext";
import {
  Avatar,
  Badge,
  EmptyState,
  SPACING,
  Text,
  TOKENS,
  useIsDark,
  useThemeColors,
  withAlpha,
  formatServicePrice,
} from "@/core/design-system";
import type { Category } from "@/interfaces/category";
import type { SearchProvider } from "@/interfaces/search";
import type { ServiceSummary } from "@/types/services";
import { getProviderRouteId } from "@/features/servicesUser/services/catalog";
import { FONT_FAMILY } from '@/core/design-system';

type ResultItem =
  | { key: string; type: "category"; data: Category }
  | { key: string; type: "provider"; data: SearchProvider }
  | { key: string; type: "service"; data: ServiceSummary };

export const SearchPage = () => {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const SIGNAL = tc.signal;
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
    results.categories.forEach((c) => list.push({ key: `cat-${c.id}`, type: "category", data: c }));
    results.providers.forEach((p) => list.push({ key: `prov-${p.id}`, type: "provider", data: p }));
    results.services.forEach((s) => list.push({ key: `svc-${s.id}`, type: "service", data: s }));
    return list;
  }, [results, debouncedValue]);

  const handleSubmit = () => {
    const q = value.trim();
    Keyboard.dismiss();
    if (q) runSearch(q).catch(() => {});
  };

  const renderItem = ({ item }: { item: ResultItem }) => {
    if (item.type === "category") {
      return (
        <Pressable
          onPress={() => router.push({ pathname: "/(tabs)/services/category/[id]", params: { id: item.data.id, from: "search" } })}
          accessibilityRole="button"
          accessibilityLabel={`Categoría ${item.data.name}`}
          style={[s.card, { backgroundColor: tc.card, borderColor: tc.border }]}
        >
          <View style={[s.categoryAccent, { backgroundColor: SIGNAL }]} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="subtitle" color={tc.text}>{item.data.name}</Text>
            {item.data.description ? (
              <Text variant="bodySmall" color={tc.textSub} numberOfLines={1}>{item.data.description}</Text>
            ) : null}
          </View>
          <Badge label="Categoría" tone="brand" size="sm" />
        </Pressable>
      );
    }

    if (item.type === "provider") {
      return (
        <Pressable
          onPress={() => router.push({ pathname: "/(tabs)/services/provider/[id]", params: { id: item.data.id, from: "search" } })}
          accessibilityRole="button"
          accessibilityLabel={`Profesional ${item.data.name}`}
          style={[s.card, { backgroundColor: tc.card, borderColor: tc.border }]}
        >
          <Avatar uri={item.data.avatar} name={item.data.name} size={44} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text variant="subtitle" color={tc.text}>{item.data.name}</Text>
            {item.data.title ? (
              <Text variant="bodySmall" color={tc.textSub} numberOfLines={1}>{item.data.title}</Text>
            ) : null}
            {item.data.rating != null ? (
              <View style={s.ratingRow}>
                <Ionicons name="star" size={11} color={TOKENS.color.rating} />
                <Text variant="caption" weight="700" color={TOKENS.color.rating}>{Number(item.data.rating).toFixed(1)}</Text>
                {item.data.location ? (
                  <>
                    <Text variant="caption" weight="700" color={tc.border}>·</Text>
                    <Text variant="bodySmall" color={tc.textSub} numberOfLines={1}>{item.data.location}</Text>
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
      const providerId = getProviderRouteId(item.data);
      return (
        <Pressable
          disabled={!providerId}
          onPress={() => {
            if (providerId) router.push({ pathname: "/(tabs)/services/provider/[id]", params: { id: providerId, from: "search" } });
          }}
          accessibilityRole="button"
          accessibilityState={{ disabled: !providerId }}
          accessibilityLabel={`Servicio ${item.data.title}`}
          style={[s.card, { backgroundColor: tc.card, borderColor: tc.border }]}
        >
          <View style={[s.serviceIcon, { backgroundColor: withAlpha(SIGNAL, 0.13) }]}>
            <Ionicons name="briefcase-outline" size={20} color={SIGNAL} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text variant="subtitle" color={tc.text}>{item.data.title}</Text>
            {item.data.summary ? (
              <Text variant="bodySmall" color={tc.textSub} numberOfLines={2}>{item.data.summary}</Text>
            ) : null}
            <View style={s.ratingRow}>
              {item.data.categoryName ? (
                <Badge label={item.data.categoryName} tone="brand" size="sm" />
              ) : null}
              {item.data.rate.amount > 0 ? (
                <Text variant="bodySmall" weight="700" color={SIGNAL}>
                  Desde {formatServicePrice(item.data.rate)}
                </Text>
              ) : (
                <Text variant="bodySmall" color={tc.textSub}>Consultar precio</Text>
              )}
            </View>
          </View>
          {providerId ? <Ionicons name="chevron-forward" size={16} color={tc.border} /> : null}
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
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: tc.border }]}>
          <Pressable
            onPress={() => safeBack(router, '/(tabs)')}
            hitSlop={10}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={22} color={tc.text} />
          </Pressable>
          <View style={[
            s.inputWrap,
            { backgroundColor: tc.card, borderColor: focused ? SIGNAL : tc.border },
            focused && [s.inputWrapFocused, { shadowColor: SIGNAL }],
          ]}>
            <Ionicons name="search-outline" size={17} color={focused ? SIGNAL : tc.textSub} />
            <TextInput
              ref={inputRef}
              style={[s.input, { color: tc.text }]}
              placeholder="Buscar servicios, profesionales…"
              placeholderTextColor={tc.textSub}
              selectionColor={SIGNAL}
              value={value}
              onChangeText={setValue}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Buscar servicios y profesionales"
            />
            {value.length > 0 && (
              <Pressable
                onPress={() => setValue("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Borrar búsqueda"
              >
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
          <EmptyState
            icon="alert-circle-outline"
            title="No pudimos buscar"
            subtitle={error}
            cta={{ label: "Reintentar", onPress: () => { runSearch(lastQuery || value).catch(() => {}); } }}
          />
        )}

        {/* Empty result */}
        {showEmpty && (
          <EmptyState
            icon="search-outline"
            title="Sin resultados"
            subtitle={`No encontramos nada para "${lastQuery}"`}
          />
        )}

        {/* Initial state */}
        {showInitial && (
          <EmptyState
            icon="search-outline"
            title="¿Qué estás buscando?"
            subtitle="Buscá servicios, profesionales o categorías"
          />
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
    gap: SPACING.sm,
    borderRadius: TOKENS.radius.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
  },
  // Focus glow on iOS only. Android `elevation` under the translucent (glass) card color drew a
  // square shadow visible through the input; there the colored border marks the focus.
  inputWrapFocused: Platform.select({
    ios: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 4,
    },
    default: {},
  }),
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
    padding: 0,
  },
  loaderWrap: {
    paddingTop: 32,
    alignItems: "center",
  },
  list: {
    padding: SPACING.lg,
    gap: 10,
    paddingBottom: SPACING.huge,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderRadius: TOKENS.radius.md,
    padding: 14,
    borderWidth: 1,
    ...TOKENS.shadow.soft,
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
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
});
