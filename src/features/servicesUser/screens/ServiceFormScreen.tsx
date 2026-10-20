/**
 * Rebrand "Señal Nocturna" — ServiceFormScreen (Publicar servicio): misma lógica, estado y navegación que
 * el archivo original. Mismo formulario de alta/edición, carga de imágenes y validación — la constante BRAND hardcodeada pasa de bordo plano a signal.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
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
import { Button, Card, Chip, GRADIENTS, Input, ScreenHeader, SPACING, Text, TOKENS, useThemeColors, dialog, FONT_FAMILY } from '@/core/design-system';
import { getUserErrorMessage } from '@/lib/errors';
import { toast } from '@/core/components/Toast';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { AnimatedBackground } from '@/components/AnimatedBackground';

import { DESCRIPTION_MIN as MIN_DESCRIPTION, TITLE_MAX, TITLE_MIN, validateServiceFields } from '@/features/servicesUser/utils/serviceFormRules';

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

/** Titled surface used by every block of the form. */
function FormCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const tc = useThemeColors();
  return (
    <Card>
      <View style={styles.cardBody}>
        <Text variant="subtitle" color={tc.text}>{title}</Text>
        {subtitle ? <Text variant="bodySmall" color={tc.textSub} style={styles.cardSubtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </Card>
  );
}

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
  // Memoized: a new array each render would re-run the prefill effect below in a loop.
  const myServices = useMemo(
    () => myServicesQuery.data?.pages.flatMap(page => page.data) ?? [],
    [myServicesQuery.data],
  );
  const addServiceM = useAddServiceWithPlanLimit();
  const updateServiceM = useUpdateService();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];
  const categoriesLoading = categoriesQuery.isLoading;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
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
      dialog.fromAlert("Permiso requerido", "Necesitamos acceso a tus fotos.");
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

  // A title already published (possibly shorter than today's minimum) is kept and not re-sent.
  const titleUnchanged = isEditing && form.title.trim() === (selectedService?.title ?? '').trim();
  const fieldErrors = validateServiceFields({ title: form.title, description: form.description });
  if (titleUnchanged) delete fieldErrors.title;
  const titleError = (submitAttempted || form.title.length > 0) ? fieldErrors.title : undefined;
  const descriptionError = (submitAttempted || form.description.length > 0) ? fieldErrors.description : undefined;

  const validateForm = () => {
    setSubmitAttempted(true);
    const firstFieldError = fieldErrors.title ?? fieldErrors.description;
    if (firstFieldError) {
      setError(firstFieldError);
      return false;
    }
    if (form.price.trim() !== "") {
      const priceNumber = Number(form.price.replace(",", "."));
      if (Number.isNaN(priceNumber) || priceNumber <= 0) {
        setError("El precio debe ser un número mayor a 0.");
        return false;
      }
    }
    // Category cannot change after publishing, so it is only required when creating.
    if (!isEditing && !form.categoryId) {
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
        const { categoryId: _cat, title, ...rest } = payload;
        const editPayload = titleUnchanged ? rest : { ...rest, title };
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
        <ScreenHeader
          tone="onBrand"
          title={isEditing ? "Editar servicio" : "Publicar servicio"}
          onBack={() => safeBack(router, '/(tabs)/profile')}
        />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Datos principales */}
        <FormCard title="Información del servicio">
          <Input
            label="Título *"
            placeholder="Ej: Plomería de urgencia"
            value={form.title}
            maxLength={TITLE_MAX}
            error={titleError}
            onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
          />
          <Text variant="caption" color={tc.textMuted}>
            {form.title.length}/{TITLE_MAX} caracteres (mínimo {TITLE_MIN})
          </Text>

          <Input
            label="Descripción *"
            placeholder="Contá qué incluye tu servicio, cuánto tardás, qué materiales usás…"
            value={form.description}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            error={descriptionError}
            onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
          />
          <Text variant="caption" color={tc.textMuted}>
            {form.description.trim().length}/{MIN_DESCRIPTION} caracteres mínimos
          </Text>
        </FormCard>

        {/* Precio */}
        <FormCard
          title="Precio"
          subtitle="Podés dejar el precio en blanco si preferís cotizar por chat."
        >
          <Input
            placeholder="Ej: 5000 (opcional)"
            keyboardType="numeric"
            value={form.price}
            onChangeText={(t) => setForm((p) => ({ ...p, price: t.replace(/[^0-9.,]/g, "") }))}
          />
        </FormCard>

        {/* Categoría */}
        <FormCard
          title="Categoría *"
          subtitle={isEditing ? "La categoría no se puede cambiar después de publicar." : undefined}
        >
          {categoriesLoading ? (
            <ActivityIndicator color={TOKENS.color.signal} style={{ marginVertical: SPACING.sm }} />
          ) : (
            <View style={styles.chipsWrap}>
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                  selected={form.categoryId === cat.id}
                  disabled={isEditing}
                  onPress={() => setForm((p) => ({ ...p, categoryId: cat.id }))}
                />
              ))}
            </View>
          )}
        </FormCard>

        {/* Imagen principal */}
        <FormCard title="Foto principal" subtitle="Una imagen que represente tu servicio.">
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
                <Text variant="body" weight="500" color={tc.textMuted}>Tocá para agregar una foto</Text>
              </View>
            )}
          </Pressable>
        </FormCard>

        {/* Galería */}
        <FormCard title="Galería de trabajos" subtitle="Subí hasta 5 fotos mostrando tus trabajos anteriores.">
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
            <Button
              variant="outline"
              size="sm"
              fullWidth
              label={`Subir ${galleryImages.length} imagen${galleryImages.length !== 1 ? "es" : ""}`}
              loading={uploadingImages}
              disabled={uploadingImages}
              onPress={async () => {
                if (!selectedService?.id || uploadingImages) return;
                setUploadingImages(true);
                try {
                  await uploadServiceImages(selectedService.id, galleryImages);
                  dialog.fromAlert("Imágenes subidas", "Las fotos se agregaron al servicio.");
                  setGalleryImages([]);
                } catch (err: any) {
                  dialog.fromAlert("Error", getUserErrorMessage(err));
                } finally {
                  setUploadingImages(false);
                }
              }}
            />
          )}
          {galleryImages.length > 0 && !isEditing && (
            <Text variant="caption" color={tc.textMuted}>
              Las fotos de la galería se podrán subir luego de publicar el servicio.
            </Text>
          )}
        </FormCard>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: TOKENS.status.cancelled.bg, borderColor: TOKENS.status.cancelled.fg }]}>
            <Text style={[styles.errorText, { color: TOKENS.status.cancelled.fg }]}>{error}</Text>
          </View>
        ) : null}

        <Button
          size="lg"
          fullWidth
          label={isEditing ? "Guardar cambios" : "Publicar servicio"}
          loading={submitting}
          disabled={categoriesLoading}
          onPress={handleSubmit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  cardBody: {
    gap: SPACING.sm + 2,
  },
  cardSubtitle: {
    marginTop: -SPACING.xs,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  imagePicker: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 180,
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
    backgroundColor: TOKENS.scrim.light,
    paddingVertical: 8,
    alignItems: "center",
  },
  imageOverlayText: {
    color: TOKENS.onMedia.text,
    fontSize: 14,
    fontFamily: FONT_FAMILY.headingMedium,
  },
  imagePlaceholder: {
    flex: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    gap: 8,
  },
  imagePlaceholderIcon: {
    fontSize: 36,
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
    color: TOKENS.color.onPrimary,
    fontSize: 11,
    fontFamily: FONT_FAMILY.heading,
  },
  galleryAdd: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  galleryAddIcon: {
    fontSize: 24,
    lineHeight: 28,
  },
  galleryAddLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.headingMedium,
  },
  errorBox: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
});
