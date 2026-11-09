import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import {
  Avatar,
  Button,
  EmptyState,
  ListRow,
  ScreenHeader,
  SkeletonList,
  SPACING,
  toast,
  useIsDark,
  useThemeColors,
} from '@/core/design-system';
import { getUserErrorMessage } from '@/lib/errors';
import { useBlockedUsersQuery, flattenBlockedUsers } from '@/hooks/queries/useBlockedUsersQuery';
import { useUnblockUser } from '@/hooks/mutations/useBlockMutations';
import type { BlockedUser } from '../services/users';

const fullName = (u: BlockedUser) => `${u.firstName} ${u.lastName ?? ''}`.trim();

/** Perfil > Usuarios bloqueados: list with an optimistic "Desbloquear" per row. */
export function BlockedUsersScreen() {
  const tc = useThemeColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const query = useBlockedUsersQuery();
  const { mutate: unblock } = useUnblockUser();
  const users = flattenBlockedUsers(query.data?.pages);

  const handleUnblock = useCallback(
    (user: BlockedUser) => {
      unblock(user.id, {
        // The hook already put the row back; only tell the user.
        onError: (err) => toast.error('No se pudo desbloquear', getUserErrorMessage(err)),
      });
    },
    [unblock],
  );

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [query]);

  const showSkeleton = query.isPending;
  const showError = query.isError && users.length === 0;
  const showEmpty = !query.isPending && !query.isError && users.length === 0;

  return (
    <View style={[s.root, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <AnimatedBackground variant="minimal" />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={tc.bg} />
      <View style={s.header}>
        <ScreenHeader title="Usuarios bloqueados" onBack={() => safeBack(router, '/(tabs)/profile')} />
      </View>

      {showSkeleton ? (
        <SkeletonList />
      ) : showError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar la lista"
          subtitle="Revisa tu conexión e intenta de nuevo."
          cta={{ label: 'Reintentar', onPress: () => void query.refetch() }}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <View style={s.row}>
              <Avatar uri={item.avatarUrl} name={fullName(item)} size={44} />
              <ListRow
                label={fullName(item) || 'Usuario'}
                style={s.rowBody}
                right={
                  <Button
                    label="Desbloquear"
                    variant="outline"
                    size="sm"
                    onPress={() => handleUnblock(item)}
                    accessibilityLabel={`Desbloquear a ${fullName(item)}`}
                  />
                }
              />
            </View>
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          contentContainerStyle={[
            s.list,
            { paddingBottom: insets.bottom + SPACING.xxxl },
            showEmpty && s.listEmpty,
          ]}
          ListEmptyComponent={
            showEmpty ? (
              <EmptyState
                icon="ban-outline"
                title="No has bloqueado a nadie"
                subtitle="Si bloqueas a alguien desde un chat, aparecerá aquí y podrás desbloquearlo cuando quieras."
              />
            ) : null
          }
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={tc.signal} style={s.footer} /> : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  list: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  listEmpty: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  rowBody: { flex: 1 },
  footer: { paddingVertical: SPACING.lg },
});
