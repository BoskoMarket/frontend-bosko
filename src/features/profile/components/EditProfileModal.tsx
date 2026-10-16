import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { TextInput } from "react-native-paper";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { UpdateProfilePayload, uploadAvatar } from "@/features/profile/services/profile";
import { TOKENS, usePremiumColors } from "@/core/design-system";
import type { PremiumColors } from "@/core/design-system";
import { useProfile } from "../state/ProfileContext";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: UpdateProfilePayload) => Promise<void>;
  initialData: {
    firstName: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  };
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  const { refreshProfile } = useProfile();
  const pc = usePremiumColors();
  const styles = useMemo(() => createStyles(pc), [pc]);
  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["95%"], []);

  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(initialData.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (visible) {
      setFormData(initialData);
      setAvatarUri(initialData.avatarUrl);
      setErrors({});
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleChange = (field: keyof UpdateProfilePayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para cambiar la foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;

    const raw = result.assets[0].uri;
    const compressed = await ImageManipulator.manipulateAsync(
      raw,
      [{ resize: { width: 800 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
    ).catch(() => ({ uri: raw }));
    const uri = compressed.uri;
    setAvatarUri(uri);
    setUploadingAvatar(true);
    try {
      await uploadAvatar(uri);
      await refreshProfile();
    } catch {
      Alert.alert("Error", "No se pudo subir la foto. Intentá de nuevo.");
      setAvatarUri(initialData.avatarUrl);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName?.trim())
      newErrors.firstName = "El nombre es obligatorio";
    if (formData.bio && formData.bio.length > 200)
      newErrors.bio = "La biografía no puede exceder 200 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      sheetRef.current?.dismiss();
    } catch {
      // toast shown by caller
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestClose = () => {
    sheetRef.current?.dismiss();
  };

  // Se dispara al cerrar por cualquier vía: swipe, tap en backdrop, botón X o dismiss() programático.
  const handleDismiss = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    onClose();
  }, [initialData, onClose]);

  const handleChangePassword = () => {
    handleRequestClose();
    router.push("/(tabs)/profile/ChangePassword");
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.8}
        pressBehavior="close"
      />
    ),
    [],
  );

  const initial = (formData.firstName?.[0] ?? formData.lastName?.[0] ?? 'U').toUpperCase();

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={0}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Editar Perfil</Text>
        <Pressable onPress={handleRequestClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color={pc.textPrimary} />
        </Pressable>
      </View>

      <BottomSheetScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Avatar picker ─────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <Pressable onPress={handlePickAvatar} style={styles.avatarWrap} disabled={uploadingAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color={TOKENS.color.onPrimary} />
                : <Ionicons name="camera" size={14} color={TOKENS.color.onPrimary} />
              }
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Tocá para cambiar la foto</Text>
        </View>

        {/* ── Datos personales ──────────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <View style={styles.inputGroup}>
            <TextInput
              label="Nombre"
              mode="flat"
              value={formData.firstName}
              onChangeText={(v) => handleChange("firstName", v)}
              style={styles.input}
              textColor={pc.textPrimary}
              theme={{ colors: { onSurfaceVariant: pc.textSecondary } }}
              underlineColor={pc.primary}
              activeUnderlineColor={pc.primary}
              error={!!errors.firstName}
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              label="Apellido"
              mode="flat"
              value={formData.lastName}
              onChangeText={(v) => handleChange("lastName", v)}
              style={styles.input}
              textColor={pc.textPrimary}
              theme={{ colors: { onSurfaceVariant: pc.textSecondary } }}
              underlineColor={pc.primary}
              activeUnderlineColor={pc.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              label="Biografía"
              mode="flat"
              value={formData.bio}
              onChangeText={(v) => handleChange("bio", v)}
              style={[styles.input, styles.bioInput]}
              textColor={pc.textPrimary}
              theme={{ colors: { onSurfaceVariant: pc.textSecondary } }}
              underlineColor={pc.primary}
              activeUnderlineColor={pc.primary}
              multiline
              numberOfLines={4}
              maxLength={200}
              error={!!errors.bio}
            />
            <Text style={styles.charCount}>{formData.bio?.length ?? 0}/200</Text>
            {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
          </View>
        </View>

        {/* ── Seguridad ─────────────────────────────────────────── */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="security" size={20} color={pc.primary} />
            <Text style={styles.sectionTitle}>Seguridad</Text>
          </View>
          <Pressable onPress={handleChangePassword} style={styles.passwordBtn}>
            <View style={styles.passwordBtnLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={pc.primary} />
              <Text style={styles.passwordBtnText}>Cambiar contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={pc.textSecondary} />
          </Pressable>
        </View>

      </BottomSheetScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.cancelButton} onPress={handleRequestClose}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? <ActivityIndicator color={TOKENS.color.onPrimary} />
            : <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          }
        </Pressable>
      </View>
    </BottomSheetModal>
  );
};

const createStyles = (pc: PremiumColors) => StyleSheet.create({
  sheetBackground: {
    backgroundColor: pc.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: pc.borderSubtle,
    width: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: pc.borderSubtle,
  },
  title: { fontSize: 24, fontWeight: "bold", color: pc.primary },
  closeButton: {
    padding: 8,
    backgroundColor: pc.borderSubtle,
    borderRadius: 20,
  },
  content: { flex: 1, padding: 20 },

  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
    gap: 8,
  },
  avatarWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: pc.primary,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: pc.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: pc.primary,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: "700",
    color: TOKENS.color.onPrimary,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: pc.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: pc.background,
  },
  avatarHint: {
    fontSize: 12,
    color: pc.textSecondary,
  },

  // Form
  formSection: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    color: pc.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputGroup: { marginBottom: 16 },
  input: { backgroundColor: pc.inputBackground, fontSize: 16 },
  bioInput: { minHeight: 100 },
  charCount: {
    alignSelf: "flex-end",
    color: pc.textTertiary,
    fontSize: 12,
    marginTop: 4,
  },
  errorText: { color: TOKENS.color.error, fontSize: 12, marginTop: 4 },

  // Password button
  passwordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: pc.inputBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: pc.borderSubtle,
  },
  passwordBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  passwordBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: pc.textPrimary,
  },

  // Footer
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: pc.borderSubtle,
    backgroundColor: pc.footerBackground,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: pc.borderSubtle,
    alignItems: "center",
  },
  cancelButtonText: { color: pc.textPrimary, fontWeight: "600" },
  saveButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: pc.primary,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    color: TOKENS.color.onPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
});
