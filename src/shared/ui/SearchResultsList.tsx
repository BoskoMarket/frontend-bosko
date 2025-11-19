import React from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
} from "react-native";
import { SearchResult } from "@/src/types";
import { t } from "@/src/shared/i18n";

interface Props {
  data: SearchResult[];
  status: "idle" | "typing" | "done" | "empty";
  onSelect: (userId: string) => void;
}

const renderItem: ListRenderItem<SearchResult> = ({ item }) => (
  <View style={styles.row}>
    <View style={styles.avatarPlaceholder} accessibilityLabel={item.user.name} />
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{item.user.name}</Text>
      {item.service && <Text style={styles.subtitle}>{item.service.name}</Text>}
    </View>
  </View>
);

export const SearchResultsList = ({ data, status, onSelect }: Props) => {
  if (status === "typing") {
    return <Text style={styles.meta}>{t("typing")}</Text>;
  }
  if (status === "empty") {
    return <Text style={styles.meta}>{t("noResults")}</Text>;
  }
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.user.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onSelect(item.user.id)}
          style={styles.touchable}
          accessibilityLabel={`Ver perfil de ${item.user.name}`}
        >
          {renderItem({ item, index: 0, separators: undefined as any })}
        </TouchableOpacity>
      )}
      contentContainerStyle={{ paddingVertical: 12 }}
      initialNumToRender={10}
      maxToRenderPerBatch={20}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        status === "idle" ? (
          <Text style={styles.meta}>{t("searchTitle")}</Text>
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  touchable: {
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    color: "#6b7280",
  },
  meta: {
    textAlign: "center",
    marginTop: 16,
    color: "#6b7280",
  },
});
