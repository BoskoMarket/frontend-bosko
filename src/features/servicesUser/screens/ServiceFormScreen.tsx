/**
 * Rebrand "Señal Nocturna" — ServiceFormScreen (Publicar servicio): misma lógica, estado y navegación que
 * el archivo original. Mismo formulario de alta/edición, carga de imágenes y validación — la constante BRAND hardcodeada pasa de bordo plano a signal.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { safeBack } from '@/core/navigation/safeBack';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Service, ServicePayload } from "@/features/servicesUser/services/service";
import { uploadServiceImages } from "@/features/servicesUser/services/service";
import { useCategories, useMyServices, useUpdateService } from "@/hooks/queries/useMarketplaceQuery";
import { useAddServiceWithPlanLimit } from "@/features/servicesUser/hooks/useAddServiceWithPlanLimit";
import { fetchServiceById } from "../services/services";
import { TOKENS } from '@/core/design-system/tokens';
import { GRADIENTS } from '@/core/design-system/gradients';
import { useThemeColors } from '@/stores/theme.store';
import { getUserErrorMessage } from '@/lib/errors';
import { toast } from '@/core/components/Toast';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const BRAND = TOKENS.color.signal;
const MIN_DESCRIPTION = 20;

type FormState = {
  title: string;
  description: string;
  price: string;
  categoryId?: string;
  image?: string | null;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  price: "",
  categoryId: undefined,
  image: undefined,
};

function extractPrice(price: any): string {
  if (price == null) return '';
  if (typeof price === 'object') return price.amount != null ? String(price.amount) : '';
  return price ? String(price) : '';
}

export default function ServiceFormScreen() {
  useRequireProviderStatus('provider');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const params = useLocalSearchParams<{ serviceId?: string }>();
  const myServicesQuery = useMyServices();
  const myServices = myServicesQuery.data ?? [];
  const addServiceM = useAddServiceWithPlanLimit();
  const updateServiceM = useUpdateService();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];
  const categoriesLoading = categoriesQuery.isLoading;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const isEditing = !!selectedService;

  useEffect(() => {
    if (!params.serviceId) {
      setSelectedService(null);
      setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id });
      setImageUri(undefined);
      return;
    }

    const found = myServices.find((s) => s.id === params.serviceId);
    if (found) {
      const catId =
        typeof found.category === "object" ? found.category?.id : found.category;
      setSelectedService(found);
      setForm({
        title: found.title ?? "",
        description: found.description ?? "",
        price: extractPrice(found.price),
        categoryId: catId ?? categories[0]?.id,
        image: found.image,
      });
      setImageUri(found.image ?? undefined);
    } else {
      fetchServiceById(params.serviceId)
        .then((svc) => {
          if (!svc) return;
          const catId =
            typeof svc.category === "object" ? svc.category?.id : svc.category;
          setSelectedService(svc);
          setForm({
            title: svc.title ?? "",
            description: svc.description ?? "",
            price: extractPrice(svc.price),
            categoryId: catId ?? categories[0]?.id,
            image: svc.image,
          });
          setImageUri(svc.image ?? undefined);
        })
        .catch((err) => console.error(err));
    }
  }, [params.serviceId, myServices, categories]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      setError("El título es obligatorio.");
      return false;
    }
    if (form.description.trim().length < MIN_DESCRIPTION) {
      setError(`La descripción debe tener al menos ${MIN_DESCRIPTION} caracteres.`);
      return false;
    }
    if (form.price.trim() !== "") {
      const priceNumber = Number(form.price.replace(",", "."));
      if (Number.isNaN(priceNumber) || priceNumber <= 0) {
        setError("El precio debe ser un número mayor a 0.");
        return false;
      }
    }
    if (!form.categoryId) {
      setError("Seleccioná una categoría.");
      return false;
    }
    setError(null);
    return true;
  };

  const buildPayload = async (): Promise<ServicePayload> => {
    const priceNum = form.price.trim() ? Number(form.price.replace(",", ".")) : undefined;
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      price: priceNum,
      categoryId: form.categoryId ?? "",
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = await buildPayload();
      if (isEditing && selectedService?.id) {
        const { categoryId: _cat, ...editPayload } = payload;
        await updateServiceM.mutateAsync({ id: selectedService.id, payload: editPayload });
        if (imageUri?.startsWith("file")) {
          try {
            await uploadServiceImages(selectedService.id, [imageUri]);
          } catch {
            // Upload fallback — la edición ya fue guardada, el proveedor puede reintentar la foto después
          }
        }
        toast.success("Servicio actualizado", "Los cambios fueron guardados.");
      } else {
        const service = await addServiceM.mutateAsync(payload);
        // Upload main photo if selected
        if (service.id && imageUri) {
          try {
            const imageUris = [imageUri];
            await uploadServiceImages(service.id, imageUris);
          } catch {
            // Upload fallback — el servicio ya fue creado, el proveedor puede subir la foto después
          }
        }
        // Upload gallery if any
        if (service.id && galleryImages.length > 0) {
          try {
            await uploadServiceImages(service.id, galleryImages);
          } catch {
            // Ídem — galería no es bloqueante para la creación del servicio
          }
        }
        toast.success("¡Publicado!", "Tu servicio ya está disponible.");
      }
      safeBack(router, '/(tabs)/profile');
    } catch (err: any) {
      if (err?.code === "SERVICE_LIMIT_REACHED" || err?.response?.data?.code === "SERVICE_LIMIT_REACHED") {
        toast.warning("Límite de tu plan", "Actualizá a plan Plus para publicar más servicios.");
      } else {
        toast.error("Error", getUserErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />

      {/* Header */}
      <LinearGradient colors={GRADIENTS.brandDeep} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => safeBack(router, '/(tabs)/profile')} hitSlop={10}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? "Editar servicio" : "Publicar servicio"}
        </Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Datos principales */}
        <View style={[styles.card, { backgroundColor: tc.card }]}>
          <Text style={[styles.cardTitle, { color: tc.text }]}>Información del servicio</Text>

          <Text style={[styles.label, { color: tc.textSub }]}>Título *</Text>
          <TextInput
            style={[styles.input, { color: tc.text, borderColor: tc.border, backgroundColor: tc.surface2 }]}
            placeholder="Ej: Plomería de urgencia"
            placeholderTextColor={tc.textMuted}
            value={form.title}
            onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
          />

          <Text style={[styles.label, { color: tc.textSub }]}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: tc.text, borderColor: tc.border, backgroundColor: tc.surface2 }]}
            placeholder="Contá qué incluye tu servicio, cuánto tardás, qué materiales usás…"
            placeholderTextColor={tc.textMuted}
            value={form.description}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
          />
          <Text style={[styles.hint, { color: tc.textMuted }]}>
            {form.description.trim().length}/{MIN_DESCRIPTION} caracteres mínimos
          </Text>
        </View>

        {/* Precio */}
        <View style={[styles.card, { backgroundColor: tc.card }]}>
          <Text style={[styles.cardTitle, { color: tc.text }]}>Precio</Text>
          <Text style={[styles.cardSubtitle, { color: tc.textSub }]}>
            Podés dejar el precio en blanco si preferís cotizar por chat.
          </Text>
          <TextInput
            style={[styles.input, { color: tc.text, borderColor: tc.border, backgroundColor: tc.surface2 }]}
            placeholder="Ej: 5000 (opcional)"
            placeholderTextColor={tc.textMuted}
            keyboardType="numeric"
            value={form.price}
            onChangeText={(t) => setForm((p) => ({ ...p, price: t.replace(/[^0-9.,]/g, "") }))}
          />
        </View>

        {/* Categoría */}
        <View style={[styles.card, { backgroundColor: tc.card }]}>
          <Text style={[styles.cardTitle, { color: tc.text }]}>Categoría *</Text>
          {categoriesLoading ? (
            <ActivityIndicator color={BRAND} style={{ marginVertical: 8 }} />
          ) : (
            <View style={styles.chipsWrap}>
              {categories.map((cat) => {
                const selected = form.categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[styles.chip, selected && styles.chipSelected, !selected && { backgroundColor: tc.card, borderColor: tc.border }]}
                    onPress={() => setForm((p) => ({ ...p, categoryId: cat.id }))}
                  >
                    {cat.icon ? (
                      <Text style={styles.chipIcon}>{cat.icon}</Text>
                    ) : null}
                    <Text style={[styles.chipText, selected && styles.chipTextSelected, !selected && { color: tc.textSub }]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Imagen principal */}
        <View style={[styles.card, { backgroundColor: tc.card }]}>
          <Text style={[styles.cardTitle, { color: tc.text }]}>Foto principal</Text>
          <Text style={[styles.cardSubtitle, { color: tc.textSub }]}>Una imagen que represente tu servicio.</Text>
          <Pressable style={[styles.imagePicker, { backgroundColor: tc.surface2 }]} onPress={handlePickImage}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>Cambiar foto</Text>
                </View>
              </>
            ) : (
              <View style={[styles.imagePlaceholder, { borderColor: tc.border }]}>
                <Text style={styles.imagePlaceholderIcon}>📷</Text>
                <Text style={[styles.imagePlaceholderText, { color: tc.textMuted }]}>Tocá para agregar una foto</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Galería */}
        <View style={[styles.card, { backgroundColor: tc.card }]}>
          <Text style={[styles.cardTitle, { color: tc.text }]}>Galería de trabajos</Text>
          <Text style={[styles.cardSubtitle, { color: tc.textSub }]}>Subí hasta 5 fotos mostrando tus trabajos anteriores.</Text>

          <View style={styles.galleryGrid}>
            {galleryImages.map((uri, i) => (
              <View key={i} style={styles.galleryThumbWrap}>
                <Image source={{ uri }} style={[styles.galleryThumb, { backgroundColor: tc.surface2 }]} />
                <Pressable
                  style={styles.galleryRemove}
                  onPress={() => setGalleryImages((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.galleryRemoveText}>✕</Text>
                </Pressable>
              </View>
            ))}
            {galleryImages.length < 5 && (
              <Pressable
                style={[styles.galleryAdd, { backgroundColor: tc.surface2, borderColor: tc.border }]}
                onPress={async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.7,
                    allowsMultipleSelection: true,
                    selectionLimit: 5 - galleryImages.length,
                  });
                  if (!result.canceled) {
                    const uris = result.assets.map((a) => a.uri);
                    setGalleryImages((prev) => [...prev, ...uris].slice(0, 5));
                  }
                }}
              >
                <Text style={[styles.galleryAddIcon, { color: tc.textSub }]}>+</Text>
                <Text style={[styles.galleryAddLabel, { color: tc.textSub }]}>Agregar</Text>
              </Pressable>
            )}
          </View>

          {galleryImages.length > 0 && isEditing && selectedService?.id && (
            <Pressable
              style={[styles.outlineBtn, uploadingImages && { opacity: 0.5 }]}
              onPress={async () => {
                if (!selectedService?.id || uploadingImages) return;
                setUploadingImages(true);
                try {
                  await uploadServiceImages(selectedService.id, galleryImages);
                  Alert.alert("Imágenes subidas", "Las fotos se agregaron al servicio.");
                  setGalleryImages([]);
                } catch (err: any) {
                  Alert.alert("Error", getUserErrorMessage(err));
                } finally {
                  setUploadingImages(false);
                }
              }}
              disabled={uploadingImages}
            >
              {uploadingImages ? (
                <ActivityIndicator color={BRAND} size="small" />
              ) : (
                <Text style={styles.outlineBtnText}>
                  Subir {galleryImages.length} imagen{galleryImages.length !== 1 ? "es" : ""}
                </Text>
              )}
            </Pressable>
          )}
          {galleryImages.length > 0 && !isEditing && (
            <Text style={[styles.hint, { color: tc.textMuted }]}>
              Las fotos de la galería se podrán subir luego de publicar el servicio.
            </Text>
          )}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: TOKENS.status.cancelled.bg, borderColor: TOKENS.status.cancelled.fg }]}>
            <Text style={[styles.errorText, { color: TOKENS.status.cancelled.fg }]}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting || categoriesLoading}
          style={(submitting || categoriesLoading) && styles.submitBtnDisabled}
        >
          <LinearGradient colors={GRADIENTS.brand} style={styles.submitBtn}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEditing ? "Guardar cambios" : "Publicar servicio"}
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 28,
    color: "#fff",
    lineHeight: 32,
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: -4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FAFAFA",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: -4,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  imagePicker: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 180,
    backgroundColor: "#F3F4F6",
  },
  imagePreview: {
    width: "100%",
    height: 200,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 8,
    alignItems: "center",
  },
  imageOverlayText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  imagePlaceholder: {
    flex: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    gap: 8,
  },
  imagePlaceholderIcon: {
    fontSize: 36,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  galleryThumbWrap: {
    position: "relative",
  },
  galleryThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  galleryRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: TOKENS.status.cancelled.fg,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryRemoveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  galleryAdd: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    gap: 2,
  },
  galleryAddIcon: {
    fontSize: 24,
    color: "#6B7280",
    lineHeight: 28,
  },
  galleryAddLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: BRAND,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  outlineBtnText: {
    color: BRAND,
    fontWeight: "600",
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  submitBtn: {
    backgroundColor: BRAND,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: BRAND,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
