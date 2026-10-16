import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { Button, EmptyState, GRADIENTS, TOKENS, toast, useThemeColors, dialog, FONT_FAMILY } from '@/core/design-system';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useMyReels, useUpdateReel, useDeleteReel } from '@/hooks/queries/useReelsQuery';
import { getUserErrorMessage } from '@/lib/errors';
import type { Reel } from '@/features/reels/services/reels.service';

const { width: W } = Dimensions.get('window');
const GAP = 10;
const COLS = 2;
const TILE_W = (W - 20 * 2 - GAP * (COLS - 1)) / COLS;
const MAX_TAGS = 8;

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Grid tile ────────────────────────────────────────────────────────────────
function ReelTile({ reel, onPress }: { reel: Reel; onPress: () => void }) {
  const tc = useThemeColors();
  const thumb = reel.type === 'before_after' ? reel.afterImageUrl : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Editar reel, ${reel.likes ?? 0} me gusta, ${reel.comments ?? 0} comentarios`}
      style={[styles.tile, { backgroundColor: tc.surface, borderColor: tc.cardBorder }]}
    >
      {thumb ? (
        <Image source={{ uri: thumb }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.tilePlaceholder, { backgroundColor: tc.surface2 }]}>
          <Ionicons name="play" size={28} color={tc.textMuted} />
        </View>
      )}
      <LinearGradient
        colors={GRADIENTS.overlayFadeDown}
        style={styles.tileGrad}
        pointerEvents="none"
      />
      <View style={styles.tileStats} pointerEvents="none">
        <View style={styles.tileStat}>
          <Ionicons name="heart" size={13} color={TOKENS.onMedia.icon} />
          <Text style={styles.tileStatText}>{fmtNum(reel.likes ?? 0)}</Text>
        </View>
        <View style={styles.tileStat}>
          <Ionicons name="chatbubble" size={12} color={TOKENS.onMedia.icon} />
          <Text style={styles.tileStatText}>{fmtNum(reel.comments ?? 0)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Edit / delete sheet ───────────────────────────────────────────────────────
function EditReelSheet({
  reel,
  onClose,
}: {
  reel: Reel;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const { mutateAsync: updateReel, isPending: saving } = useUpdateReel();
  const { mutateAsync: deleteReel, isPending: deleting } = useDeleteReel();

  const [description, setDescription] = useState(reel.description ?? '');
  const [tags, setTags] = useState<string[]>(reel.tags ?? []);
  const [tagInput, setTagInput] = useState('');

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().replace(/^#/, '').toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    setTags((prev) => [...prev, tag]);
    setTagInput('');
  }, [tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleSave = async () => {
    try {
      await updateReel({ reelId: reel.id, payload: { description: description.trim(), tags } });
      toast.success('Reel actualizado');
      onClose();
    } catch (err) {
      toast.error('No se pudo guardar', getUserErrorMessage(err));
    }
  };

  const handleDelete = () => {
    dialog.fromAlert('Eliminar reel', '¿Seguro que querés eliminarlo? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReel(reel.id);
            toast.success('Reel eliminado');
            onClose();
          } catch (err) {
            toast.error('No se pudo eliminar', getUserErrorMessage(err));
          }
        },
      },
    ]);
  };

  const busy = saving || deleting;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable style={[StyleSheet.absoluteFill, styles.backdrop]} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24, backgroundColor: tc.surface }]}>
          <View style={[styles.handle, { backgroundColor: tc.border }]} />
          <Text style={[styles.sheetTitle, { color: tc.text }]}>Editar reel</Text>

          <Text style={[styles.fieldLabel, { color: tc.textSub }]}>Descripción</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: tc.surface2, borderColor: tc.border, color: tc.text }]}
            placeholder="Contá qué muestra este reel..."
            placeholderTextColor={tc.textMuted}
            multiline
            maxLength={300}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />

          <Text style={[styles.fieldLabel, { color: tc.textSub }]}>Tags</Text>
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[styles.tagChip, { backgroundColor: tc.accent }]}
                  onPress={() => removeTag(tag)}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar tag ${tag}`}
                >
                  <Text style={[styles.tagChipText, { color: tc.text }]}>#{tag}</Text>
                  <MaterialIcons name="close" size={13} color={tc.textSub} />
                </Pressable>
              ))}
            </View>
          )}
          {tags.length < MAX_TAGS && (
            <TextInput
              style={[styles.tagInput, { backgroundColor: tc.surface2, borderColor: tc.border, color: tc.text }]}
              placeholder="Agregá un tag y presioná espacio"
              placeholderTextColor={tc.textMuted}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={() => addTag(tagInput)}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          )}

          <View style={styles.sheetActions}>
            <Button
              variant="dangerOutline"
              label="Eliminar"
              icon={<Ionicons name="trash-outline" size={16} color={TOKENS.color.error} />}
              loading={deleting}
              disabled={busy}
              onPress={handleDelete}
            />
            <Button
              label="Guardar cambios"
              loading={saving}
              disabled={busy}
              onPress={handleSave}
              style={styles.saveBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function MyReelsScreen() {
  useRequireProviderStatus('provider');
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const { data: reels = [], isLoading, isError, isFetching, refetch } = useMyReels();
  const [editingReel, setEditingReel] = useState<Reel | null>(null);

  const totalLikes = reels.reduce((acc, r) => acc + (r.likes ?? 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />

      <View style={styles.headerRow}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: tc.surface }]}
          onPress={() => safeBack(router, '/(tabs)/profile')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={tc.text} />
        </Pressable>
        <Text style={[styles.header, { color: tc.text }]}>Mis reels</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Publicar reel" onPress={() => router.push('/(tabs)/profile/upload-reel')} hitSlop={12}>
          <Ionicons name="add" size={26} color={tc.text} />
        </Pressable>
      </View>

      {reels.length > 0 && (
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, { color: tc.textSub }]}>
            {reels.length} {reels.length === 1 ? 'reel' : 'reels'} · {fmtNum(totalLikes)} me gusta en total
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={tc.textSub} />
        </View>
      ) : isError && reels.length === 0 ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar tus reels"
          subtitle="Hubo un problema de conexión. Probá de nuevo en unos segundos."
          cta={{ label: 'Reintentar', onPress: () => { refetch(); } }}
        />
      ) : reels.length === 0 ? (
        <EmptyState
          icon="film-outline"
          title="Todavía no subiste reels"
          subtitle="Mostrá tu trabajo en video y llegá a más clientes."
          cta={{ label: 'Publicar un reel', onPress: () => router.push('/(tabs)/profile/upload-reel') }}
        />
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ReelTile reel={item} onPress={() => setEditingReel(item)} />
          )}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
        />
      )}

      {editingReel && (
        <EditReelSheet reel={editingReel} onClose={() => setEditingReel(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { fontSize: 18, fontFamily: FONT_FAMILY.heading },
  summaryRow: { paddingBottom: 12 },
  summaryText: { fontSize: 13, fontFamily: FONT_FAMILY.bodyMedium },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { gap: GAP, paddingBottom: 32 },

  // ── Tile ──────────────────────────────────────────────────────────────────
  tile: {
    width: TILE_W,
    height: TILE_W * 1.5,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tilePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  tileGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  tileStats: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    gap: 10,
  },
  tileStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tileStatText: { color: TOKENS.onMedia.text, fontSize: 12, fontFamily: FONT_FAMILY.heading },

  // ── Edit sheet ────────────────────────────────────────────────────────────
  backdrop: { backgroundColor: TOKENS.scrim.medium },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontSize: 15, fontFamily: FONT_FAMILY.heading, textAlign: 'center', marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontFamily: FONT_FAMILY.heading, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 },
  textarea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    fontFamily: FONT_FAMILY.body,
    minHeight: 90,
    lineHeight: 21,
    marginBottom: 16,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagChipText: { fontSize: 13, fontFamily: FONT_FAMILY.headingMedium },
  tagInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    marginBottom: 4,
  },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  saveBtn: { flex: 1 },
});
