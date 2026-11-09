import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  EmptyState,
  ScreenHeader,
  Skeleton,
  SPACING,
  TOKENS,
  dialog,
  toast,
  useThemeColors,
} from '@/core/design-system';
import { safeBack } from '@/core/navigation/safeBack';
import { flattenUniqueById } from '@/core/api/collections';
import { useRequireProviderStatus } from '@/hooks/useRequireProviderStatus';
import { useMyServices } from '@/hooks/queries/useMarketplaceQuery';
import {
  useCreateWork,
  useDeleteWork,
  useServicesWorks,
  useUpdateWork,
} from '@/hooks/queries/useWorksQuery';
import { WorkFormSheet } from '../components/WorkFormSheet';
import { WorksMasonry } from '../components/WorksMasonry';
import { WORKS_LIMIT_PER_PROVIDER } from '../constants';
import type { WorkImageFile, WorkPhoto } from '../types';
import { WORK_LIMIT_MESSAGE, getWorkErrorMessage } from '../utils/workErrors';
import { runWithRetry } from '@/lib/runWithRetry';
import { prepareWorkImage } from '../utils/workImage';
import { WORK_HIDDEN_LABEL, isWorkHidden, workLabel } from '../utils/workStatus';

type OwnService = { id: string; title: string };
type Draft = { service: OwnService; file: WorkImageFile };

/** Mis trabajos: photos of the provider's single service (one list, one global x/30 counter). */
export default function MyWorksScreen() {
  useRequireProviderStatus('provider');
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();

  const servicesQuery = useMyServices();
  const services = useMemo<OwnService[]>(
    () =>
      flattenUniqueById(
        (servicesQuery.data?.pages ?? []).map((page) => ({
          data: page.data.filter((s) => !!s.id).map((s) => ({ id: s.id as string, title: s.title })),
        })),
      ),
    [servicesQuery.data],
  );
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = servicesQuery;
  // A provider can have more than one page of services: load them all so every one is selectable.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const loadingMoreServices = !!hasNextPage || isFetchingNextPage;

  const worksQueries = useServicesWorks(services.map((s) => s.id));
  // v1: one service per provider. If legacy data has more, they share one list and one counter.
  const service = services[0] ?? null;
  const photos = useMemo<WorkPhoto[]>(() => worksQueries.flatMap((q) => q?.data ?? []), [worksQueries]);
  const count = photos.length;
  const countReady = services.length > 0 && worksQueries.every((q) => q?.data !== undefined);
  const atLimit = count >= WORKS_LIMIT_PER_PROVIDER;
  // The limit is enforced client-side, so the count has to be known before offering an upload.
  const uploadDisabled = !service || !countReady || atLimit;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<WorkPhoto | null>(null);
  const { mutateAsync: create, isPending: creating } = useCreateWork();
  const { mutateAsync: update, isPending: updating } = useUpdateWork();
  const { mutateAsync: remove, isPending: deleting } = useDeleteWork();

  const picking = useRef(false);
  const pickImage = useCallback(async (service: OwnService) => {
    if (picking.current) return;
    picking.current = true;
    try {
      // The system picker needs no library permission (expo-image-picker >= 14 on both platforms).
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode?.Compatible,
      });
      if (result.canceled || !result.assets[0]) return;
      const check = await prepareWorkImage(result.assets[0]);
      if (!check.ok) {
        toast.error(check.title, check.message);
        return;
      }
      setDraft({ service, file: check.file });
    } finally {
      picking.current = false;
    }
  }, []);

  const startUpload = useCallback(() => {
    if (!service) return;
    if (atLimit) {
      toast.error('Fotos completas', WORK_LIMIT_MESSAGE);
      return;
    }
    pickImage(service);
  }, [service, atLimit, pickImage]);

  const publish = useCallback(
    async (description: string) => {
      if (!draft) return;
      const result = await runWithRetry(
        () => create({ serviceId: draft.service.id, file: draft.file, description }),
        {
          title: 'No se pudo subir la foto',
          networkMessage: (err) => getWorkErrorMessage(err, { upload: true }),
          onError: (err) => toast.error('No se pudo subir la foto', getWorkErrorMessage(err, { upload: true })),
        },
      );
      if (result.ok) {
        toast.success('Foto publicada');
        setDraft(null);
      }
    },
    [draft, create],
  );

  const saveEdit = useCallback(
    async (description: string) => {
      if (!editing) return;
      const result = await runWithRetry(() => update({ postId: editing.id, description }), {
        title: 'No se pudo guardar',
        onError: (err) => toast.error('No se pudo guardar', getWorkErrorMessage(err)),
      });
      if (result.ok) {
        toast.success('Descripción actualizada');
        setEditing(null);
      }
    },
    [editing, update],
  );

  const deletePhoto = useCallback(
    async (photo: WorkPhoto) => {
      const ok = await dialog.confirm({
        title: 'Eliminar foto',
        message: '¿Seguro que quieres eliminarla? No se puede deshacer.',
        confirmLabel: 'Eliminar',
        destructive: true,
      });
      if (!ok) return;
      const result = await runWithRetry(() => remove(photo.id), {
        title: 'No se pudo eliminar',
        onError: (err) => toast.error('No se pudo eliminar', getWorkErrorMessage(err)),
      });
      if (result.ok) {
        toast.success('Foto eliminada');
        setEditing(null);
      }
    },
    [remove],
  );
  const confirmDelete = useCallback(async () => {
    if (editing) await deletePhoto(editing);
  }, [editing, deletePhoto]);

  // Hidden photos (3 reports, pending admin review) are not editable; deleting stays allowed.
  const onPressPhoto = useCallback(
    (photo: WorkPhoto) => {
      if (isWorkHidden(photo)) {
        deletePhoto(photo);
        return;
      }
      setEditing(photo);
    },
    [deletePhoto],
  );

  const loading = servicesQuery.isPending || loadingMoreServices || worksQueries.some((q) => q?.isPending);
  const failedStates = worksQueries.filter((q) => q?.isError && q.data === undefined);
  const worksError = !loading && failedStates.length > 0;
  const counter = countReady ? `${count}/${WORKS_LIMIT_PER_PROVIDER}` : null;

  return (
    <View style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <ScreenHeader
        variant="large"
        title="Mis trabajos"
        subtitle="Muestra tus trabajos terminados"
        onBack={() => safeBack(router, '/(tabs)/profile')}
        style={styles.header}
      />

      {servicesQuery.isError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar tus servicios"
          subtitle="Revisa tu conexión e intenta de nuevo."
          cta={{ label: 'Reintentar', onPress: () => servicesQuery.refetch() }}
        />
      ) : !servicesQuery.isPending && services.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          title="Primero publica un servicio"
          subtitle="Las fotos se suben a tu servicio."
          cta={{ label: 'Publicar servicio', onPress: () => router.push('/service-form') }}
        />
      ) : (
        <>
          <View style={styles.toolbar}>
            {counter ? <Badge label={`${counter} fotos`} tone={atLimit ? 'cancelled' : 'brand'} size="sm" /> : <View />}
            <Button
              label="Subir foto"
              size="sm"
              icon={<Ionicons name="add" size={18} color={TOKENS.color.onPrimary} />}
              disabled={uploadDisabled}
              onPress={startUpload}
            />
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xxxl }]}
            showsVerticalScrollIndicator={false}
          >
            {worksError ? (
              <EmptyState
                icon="cloud-offline-outline"
                title="No pudimos cargar tus fotos"
                subtitle="Revisa tu conexión e intenta de nuevo."
                cta={{ label: 'Reintentar', onPress: () => failedStates.forEach((q) => q?.refetch()) }}
              />
            ) : loading ? (
              <View accessible accessibilityRole="progressbar" accessibilityLabel="Cargando fotos" style={styles.skeleton}>
                <Skeleton height={160} radius={TOKENS.radius.md} />
                <Skeleton height={160} radius={TOKENS.radius.md} />
              </View>
            ) : photos.length === 0 ? (
              <EmptyState
                icon="images-outline"
                title="Todavía no subiste fotos"
                subtitle={'Toca "Subir foto" y suma tus trabajos terminados para que los clientes confíen en ti.'}
              />
            ) : (
              <WorksMasonry
                items={photos}
                onPressItem={onPressPhoto}
                labelFor={workLabel}
                overlayFor={(p) =>
                  isWorkHidden(p) ? (
                    <View style={styles.hiddenBadge}>
                      <Badge label={WORK_HIDDEN_LABEL} tone="pending" size="sm" />
                    </View>
                  ) : null
                }
              />
            )}
          </ScrollView>
        </>
      )}

      <WorkFormSheet
        visible={!!draft}
        mode="create"
        imageUri={draft?.file.uri ?? null}
        serviceTitle={draft?.service.title}
        submitting={creating}
        onSubmit={publish}
        onClose={() => setDraft(null)}
      />
      <WorkFormSheet
        visible={!!editing}
        mode="edit"
        imageUri={editing ? editing.thumbnailUrl ?? editing.imageUrl : null}
        initialDescription={editing?.description}
        submitting={updating}
        deleting={deleting}
        onSubmit={saveEdit}
        onDelete={confirmDelete}
        onClose={() => setEditing(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  hiddenBadge: { position: 'absolute', left: SPACING.sm, bottom: SPACING.sm, right: SPACING.sm, alignItems: 'flex-start' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  content: { paddingHorizontal: SPACING.lg },
  skeleton: { gap: SPACING.sm },
});
