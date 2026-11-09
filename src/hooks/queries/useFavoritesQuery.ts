import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { flattenUniqueById, nextCollectionPage, type PaginatedCollection } from '@/core/api/collections';
import { toast } from '@/core/design-system';
import { useAuth } from '@/features/auth/state/AuthContext';
import { addFavorite, fetchFavorites, removeFavorite } from '@/features/favorites/services/favorites.service';
import { getUserErrorMessage } from '@/lib/errors';
import type { ServiceSummary } from '@/types/services';

export const FAVORITES_PAGE_SIZE = 20;
const IDS_PAGE_SIZE = 100;
const IDS_MAX_PAGES = 10;

type FavoritePages = InfiniteData<PaginatedCollection<ServiceSummary>>;

/**
 * Design: favorites are server data, so they live in TanStack Query, never in Zustand.
 * Two cache entries, both emptied by the QueryClient clear on logout:
 *  - `favorites` (infinite): the full cards shown in Perfil > Favoritos, paginated.
 *  - `favoriteIds` (light): the set of favorite service ids, hydrated once by walking the list
 *    with big pages (bounded at 1000). Hearts on cards anywhere in the app read this set, so
 *    they stay correct while the user scrolls the catalog without opening Favoritos.
 * Toggles update both optimistically and roll back on error; the server wins on settle.
 */
export function useFavoritesList() {
  const { isAuthenticated } = useAuth();
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.favorites,
    queryFn: ({ pageParam }) => fetchFavorites(pageParam, FAVORITES_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextCollectionPage,
    enabled: isAuthenticated,
  });
}

export function flattenFavorites(pages: ReadonlyArray<{ data: readonly ServiceSummary[] }> | undefined): ServiceSummary[] {
  return flattenUniqueById(pages ?? []);
}

async function fetchFavoriteIds(): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 1; page <= IDS_MAX_PAGES; page++) {
    const res = await fetchFavorites(page, IDS_PAGE_SIZE);
    res.data.forEach((s) => ids.push(s.id));
    if (nextCollectionPage(res) === undefined) break;
  }
  return ids;
}

/** Ids of the account's favorites (undefined while the first load is pending). */
export function useFavoriteIds(): string[] | undefined {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.favoriteIds,
    queryFn: fetchFavoriteIds,
    enabled: isAuthenticated,
  }).data;
}

/** True when the service is a favorite. Reflects the cached id set (false while it loads). */
export function useIsFavorite(serviceId: string): boolean {
  const ids = useFavoriteIds();
  return useMemo(() => Boolean(ids?.includes(serviceId)), [ids, serviceId]);
}

interface ToggleVars { service: ServiceSummary; favorite: boolean }
interface ToggleCtx { ids?: string[]; pages?: FavoritePages }

/** Optimistic add/remove. `favorite` is the desired final state. */
export function useFavoriteMutation() {
  const qc = useQueryClient();
  return useMutation<void, unknown, ToggleVars, ToggleCtx>({
    mutationFn: ({ service, favorite }) => (favorite ? addFavorite(service.id) : removeFavorite(service.id)),
    onMutate: async ({ service, favorite }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: QUERY_KEYS.favoriteIds }),
        qc.cancelQueries({ queryKey: QUERY_KEYS.favorites }),
      ]);
      const ctx: ToggleCtx = {
        ids: qc.getQueryData<string[]>(QUERY_KEYS.favoriteIds),
        pages: qc.getQueryData<FavoritePages>(QUERY_KEYS.favorites),
      };
      const without = (list: string[] = []) => list.filter((id) => id !== service.id);
      // Only patch ids that are already cached; otherwise the settle refetch hydrates them.
      if (ctx.ids) qc.setQueryData<string[]>(QUERY_KEYS.favoriteIds, favorite ? [service.id, ...without(ctx.ids)] : without(ctx.ids));
      qc.setQueryData<FavoritePages | undefined>(QUERY_KEYS.favorites, (old) => {
        if (!old) return old;
        const already = old.pages.some((p) => p.data.some((s) => s.id === service.id));
        if (favorite) {
          if (already) return old;
          const [first, ...rest] = old.pages;
          return { ...old, pages: [{ ...first, data: [service, ...first.data], total: first.total + 1 }, ...rest] };
        }
        return {
          ...old,
          pages: old.pages.map((p) => (p.data.some((s) => s.id === service.id)
            ? { ...p, data: p.data.filter((s) => s.id !== service.id), total: Math.max(0, p.total - 1) }
            : p)),
        };
      });
      return ctx;
    },
    onError: (err, { favorite }, ctx) => {
      qc.setQueryData(QUERY_KEYS.favoriteIds, ctx?.ids);
      qc.setQueryData(QUERY_KEYS.favorites, ctx?.pages);
      toast.error(
        favorite ? 'No se pudo guardar el favorito' : 'No se pudo quitar el favorito',
        getUserErrorMessage(err),
      );
    },
    onSettled: () => { void qc.invalidateQueries({ queryKey: ['favorites'] }); },
  });
}

/** Toggle bound to the current cached state (add if not a favorite, remove otherwise). */
export function useToggleFavorite() {
  const qc = useQueryClient();
  const { mutate } = useFavoriteMutation();
  return useCallback(
    (service: ServiceSummary) => {
      const favorite = !qc.getQueryData<string[]>(QUERY_KEYS.favoriteIds)?.includes(service.id);
      mutate({ service, favorite });
    },
    [qc, mutate],
  );
}
