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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { safeBack } from '@/core/navigation/safeBack';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyServices, useDeleteService } from "@/hooks/queries/useMarketplaceQuery";
import type { Service } from "@/features/servicesUser/services/service";
import { EmptyState } from '@/core/components/EmptyState';
import { getUserErrorMessage } from '@/lib/errors';
import { GRADIENTS, TOKENS, useThemeColors } from '@/core/design-system';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const SIGNAL = TOKENS.color.signal;

function formatPrice(price?: number | null | any): string {
  const n = typeof price === 'object' && price !== null ? price?.amount : price;
  if (!n) return 'A cotizar';
  return `$${new Intl.NumberFormat('es-AR').format(Number(n))}`;
}

function getCategoryLabel(category: Service['category']): string {
  if (!category) return 'Sin categoría';
  if (typeof category === 'object') return category.name ?? 'Sin categoría';
  return category;
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
  tc,
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  tc: ReturnType<typeof useThemeColors>;
}) {
  const categoryLabel = getCategoryLabel(service.category);
  return (
    <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
      {service.image ? (
        <Image source={{ uri: service.image }} style={styles.cardImage} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: tc.surface2 }]}>
          <Text style={[styles.imagePlaceholderText, { color: tc.textSub }]}>Sin imagen</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: tc.text }]}>{service.title}</Text>
        <Text style={[styles.cardDescription, { color: tc.textSub }]}>{service.description}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardCategory}>{categoryLabel}</Text>
          <Text style={[styles.cardPrice, { color: tc.text }]}>{formatPrice(service.price)}</Text>
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
  useRequireProviderStatus('provider');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const myServicesQuery = useMyServices();
  const services = myServicesQuery.data ?? [];
  const loading = myServicesQuery.isLoading;
  const deleteServiceM = useDeleteService();

  const handleEdit = (service: Service) => {
    router.push({
      pathname: "/service-form",
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
                await deleteServiceM.mutateAsync(service.id);
                Alert.alert("Servicio eliminado", "Se eliminó correctamente.");
              }
            } catch (error) {
              Alert.alert("Error", getUserErrorMessage(error));
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      myServicesQuery.refetch();
      
    }, [])
  );

  const renderService = ({ item }: { item: Service }) => (
    <ServiceCard service={item} onEdit={handleEdit} onDelete={handleDelete} tc={tc} />
  );

  const planMessage =
    services.length === 0
      ? "Crea tu primer servicio para comenzar a recibir solicitudes."
      : "Administra y actualiza tus servicios publicados.";

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />

      {/* Header con back */}
      <View style={styles.headerRow}>
        <Pressable style={[styles.backBtn, { backgroundColor: tc.surface }]} onPress={() => safeBack(router, '/(tabs)/profile')} hitSlop={10}>
          <Text style={[styles.backIcon, { color: tc.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.header, { color: tc.text }]}>Mis servicios</Text>
        <Pressable
          onPress={() => router.push('/service-form')}
          hitSlop={8}
        >
          <LinearGradient colors={GRADIENTS.brand} style={styles.addBtn}>
            <Ionicons name="add" size={15} color={TOKENS.color.onPrimary} />
            <Text style={styles.addBtnText}>Publicar</Text>
          </LinearGradient>
        </Pressable>
      </View>
      <Text style={[styles.planMessage, { color: tc.textSub }]}>{planMessage}</Text>

      {loading && services.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator />
        </View>
      ) : null}

      {services.length === 0 && !loading ? (
        <EmptyState
          icon="construct-outline"
          title="Todavía no publicaste servicios"
          subtitle="Creá tu primer servicio para que los clientes puedan encontrarte y contratarte."
          cta={{
            label: 'Publicar primer servicio',
            onPress: () => router.push("/service-form"),
          }}
        />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item, index) => item.id ?? `service-${index}`}
          renderItem={renderService}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => myServicesQuery.refetch()}
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
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -2,
  },
  header: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...TOKENS.shadow.glow,
  },
  addBtnText: {
    color: TOKENS.color.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  planMessage: {
    fontSize: 14,
    marginBottom: 16,
  },
  loader: {
    paddingVertical: 40,
    alignItems: "center",
  },
  listContent: {
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
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
  },
  imagePlaceholderText: {},
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
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCategory: {
    fontSize: 13,
    color: SIGNAL,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "700",
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
    borderColor: SIGNAL,
  },
  editButtonText: {
    color: SIGNAL,
    fontWeight: "600",
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TOKENS.status.cancelled.fg,
  },
  deleteButtonText: {
    color: TOKENS.status.cancelled.fg,
    fontWeight: "600",
  },
});
