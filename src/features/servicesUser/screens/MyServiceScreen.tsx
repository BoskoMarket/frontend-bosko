import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useServices } from "@/features/servicesUser/state/ServicesContext";
import type { Service } from "@/features/servicesUser/services/service";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}) {
  const categoryLabel =
    service.categoryName ?? service.categoryId ?? "Sin categoría";
  const priceValue = service.price ?? 0;
  return (
    <View style={styles.card}>
      {service.image ? (
        <Image source={{ uri: service.image }} style={styles.cardImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{service.title}</Text>
        <Text style={styles.cardDescription}>{service.description}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardCategory}>{categoryLabel}</Text>
          <Text style={styles.cardPrice}>
            {currencyFormatter.format(priceValue)}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable style={styles.editButton} onPress={() => onEdit(service)}>
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={() => onDelete(service)}
          >
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MyServiceScreen() {
  const router = useRouter();
  const { services, loading, loadServices, removeService } = useServices();

  const handleEdit = (service: Service) => {
    router.push({
      pathname: "/(tabs)/profile/AddServices",
      params: { serviceId: service.id },
    });
  };

  const handleDelete = (service: Service) => {
    Alert.alert(
      "Eliminar servicio",
      "¿Estás seguro de eliminar este servicio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (service.id) {
                await removeService(service.id);
                Alert.alert("Servicio eliminado", "Se eliminó correctamente.");
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  "No se pudo eliminar el servicio"
              );
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadServices().catch((err) => console.error(err));
    }, [loadServices])
  );

  const renderService = ({ item }: { item: Service }) => (
    <ServiceCard service={item} onEdit={handleEdit} onDelete={handleDelete} />
  );

  const planMessage =
    services.length === 0
      ? "Crea tu primer servicio para comenzar a recibir solicitudes."
      : "Administra y actualiza tus servicios publicados.";

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis servicios</Text>
      <Text style={styles.planMessage}>{planMessage}</Text>

      {loading && services.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      ) : null}

      {services.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aún no has publicado servicios</Text>
          <Text style={styles.emptyDescription}>
            Publica tu primer servicio para que los clientes puedan encontrarte.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/(tabs)/profile/AddServices")}
          >
            <Text style={styles.primaryButtonText}>Publicar servicio</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item, index) => item.id ?? `service-${index}`}
          renderItem={renderService}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() =>
                loadServices().catch((err) => console.error(err))
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  planMessage: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 16,
  },
  loader: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyDescription: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  imagePlaceholder: {
    width: "100%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  imagePlaceholderText: {
    color: "#6B7280",
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardDescription: {
    fontSize: 14,
    color: "#4B5563",
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCategory: {
    fontSize: 13,
    color: "#1D4ED8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  editButtonText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  deleteButtonText: {
    color: "#DC2626",
    fontWeight: "600",
  },
});
