import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  OptionSheet,
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
import { WORKS_LIMIT_PER_SERVICE } from '../constants';
import type { WorkImageFile, WorkPhoto } from '../types';
import { WORK_LIMIT_MESSAGE, getWorkErrorMessage } from '../utils/workErrors';
import { prepareWorkImage } from '../utils/workImage';

type OwnService = { id: string; title: string };
type Draft = { service: OwnService; file: WorkImageFile };

/** Mis trabajos: a provider's photos per service, with upload, edit and delete. */
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
  const stateOf = useCallback(
    (id: string) => worksQueries[services.findIndex((s) => s.id === id)],
    [worksQueries, services],
  );
  const countOf = useCallback((id: string) => stateOf(id)?.data?.length ?? 0, [stateOf]);
  const isCountReady = useCallback((id: string) => stateOf(id)?.data !== undefined, [stateOf]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = services.find((s) => s.id === selectedId) ?? null;
  const photos = useMemo<WorkPhoto[]>(
    () => (selected ? [selected] : services).flatMap((s) => stateOf(s.id)?.data ?? []),
    [selected, services, stateOf],
  );

  const [chooserOpen, setChooserOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<WorkPhoto | null>(null);
  const { mutateAsync: create, isPending: creating } = useCreateWork();
  const { mutateAsync: update, isPending: updating } = useUpdateWork();
  const { mutateAsync: remove, isPending: deleting } = useDeleteWork();

  const allReady = services.every((s) => isCountReady(s.id));
  const allFull = services.length > 0 && services.every((s) => countOf(s.id) >= WORKS_LIMIT_PER_SERVICE);
  // The limit is enforced client-side, so a service's count has to be known before offering an upload to it.
  const uploadDisabled = selected
    ? !isCountReady(selected.id) || countOf(selected.id) >= WORKS_LIMIT_PER_SERVICE
    : !allReady || allFull;

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

  const chooseTarget = useCallback(
    (service: OwnService) => {
      if (countOf(service.id) >= WORKS_LIMIT_PER_SERVICE) {
        toast.error('Servicio completo', WORK_LIMIT_MESSAGE);
        return;
      }
      pickImage(service);
    },
    [countOf, pickImage],
  );

  const startUpload = useCallback(() => {
    if (selected) return chooseTarget(selected);
    if (services.length === 1) return chooseTarget(services[0]);
    setChooserOpen(true);
  }, [selected, services, chooseTarget]);

  const publish = useCallback(
    async (description: string) => {
      if (!draft) return;
      try {
        await create({ serviceId: draft.service.id, file: draft.file, description });
        toast.success('Foto publicada');
        setDraft(null);
      } catch (err) {
        toast.error('No se pudo subir la foto', getWorkErrorMessage(err, { upload: true }));
      }
    },
    [draft, create],
  );

  const saveEdit = useCallback(
    async (description: string) => {
      if (!editing) return;
      try {
        await update({ postId: editing.id, description });
        toast.success('Descripción actualizada');
        setEditing(null);
      } catch (err) {
        toast.error('No se pudo guardar', getWorkErrorMessage(err));
      }
    },
    [editing, update],
  );

  const confirmDelete = useCallback(async () => {
    if (!editing) return;
    const ok = await dialog.confirm({
      title: 'Eliminar foto',
      message: '¿Seguro que querés eliminarla? No se puede deshacer.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove(editing.id);
      toast.success('Foto eliminada');
      setEditing(null);
    } catch (err) {
      toast.error('No se pudo eliminar', getWorkErrorMessage(err));
    }
  }, [editing, remove]);

  const selectedStates = (selected ? [selected] : services).map((s) => stateOf(s.id));
  const loading = servicesQuery.isPending || loadingMoreServices || selectedStates.some((q) => q?.isPending);
  const failedStates = selectedStates.filter((q) => q?.isError && q.data === undefined);
  const worksError = !loading && failedStates.length > 0;
  const counter = selected ? `${countOf(selected.id)}/${WORKS_LIMIT_PER_SERVICE}` : null;

  return (
    <View style={[styles.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <ScreenHeader
        variant="large"
        title="Mis trabajos"
        subtitle="Mostrá tus trabajos terminados"
        onBack={() => safeBack(router, '/(tabs)/profile')}
        style={styles.header}
      />

      {servicesQuery.isError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar tus servicios"
          subtitle="Revisá tu conexión e intentá de nuevo."
          cta={{ label: 'Reintentar', onPress: () => servicesQuery.refetch() }}
        />
      ) : !servicesQuery.isPending && services.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          title="Primero publicá un servicio"
          subtitle="Las fotos se suben a uno de tus servicios."
          cta={{ label: 'Publicar servicio', onPress: () => router.push('/service-form') }}
        />
      ) : (
        <>
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              accessibilityLabel="Filtrar por servicio"
            >
              <Chip label="Todos" selected={selectedId === null} onPress={() => setSelectedId(null)} />
              {services.map((s) => (
                <Chip
                  key={s.id}
                  label={s.title}
                  selected={selectedId === s.id}
                  onPress={() => setSelectedId(s.id)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.toolbar}>
            {counter ? <Badge label={`${counter} fotos`} tone={uploadDisabled ? 'cancelled' : 'brand'} size="sm" /> : <View />}
            <Button
              label="Subir foto"
              size="sm"
              icon={<Ionicons name="add" size={18} color={TOKENS.color.onPrimary} />}
              disabled={uploadDisabled || services.length === 0}
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
                subtitle="Revisá tu conexión e intentá de nuevo."
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
                subtitle={'Tocá "Subir foto" y sumá tus trabajos terminados para que los clientes confíen en vos.'}
              />
            ) : (
              <WorksMasonry
                items={photos}
                onPressItem={setEditing}
                labelFor={(p) => (p.description ? `Editar foto: ${p.description}` : 'Editar foto')}
              />
            )}
          </ScrollView>
        </>
      )}

      <OptionSheet
        visible={chooserOpen}
        title="¿En qué servicio la subís?"
        options={services.map((s) => ({
          id: s.id,
          label: s.title,
          description: `${countOf(s.id)}/${WORKS_LIMIT_PER_SERVICE} fotos`,
        }))}
        onCancel={() => setChooserOpen(false)}
        onSelect={(id) => {
          setChooserOpen(false);
          const service = services.find((s) => s.id === id);
          if (service) chooseTarget(service);
        }}
      />

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
  chips: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.sm },
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
