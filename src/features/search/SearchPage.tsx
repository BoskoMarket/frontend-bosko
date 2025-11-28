import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { SearchBar } from "@/src/shared/ui/SearchBar";
import { SearchResultsList } from "@/src/shared/ui/SearchResultsList";
import { useBoskoData } from "@/src/shared/state/DataContext";
import { useDebouncedValue } from "@/src/shared/hooks/useDebouncedValue";
import { useRouter } from "expo-router";

export const SearchPage = () => {
  const { search } = useBoskoData();
  const [value, setValue] = useState("");
  const debouncedValue = useDebouncedValue(value);
  const router = useRouter();

  useEffect(() => {
    search.runSearch(debouncedValue);
  }, [debouncedValue, search]);

  return (
    <View style={styles.container}>
      <SearchBar value={value} onChange={setValue} />
      <SearchResultsList
        status={search.status}
        data={search.results}
        onSelect={(userId) => router.push(`/(tabs)/profile/${userId}` as const)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9fafb",
  },
});
