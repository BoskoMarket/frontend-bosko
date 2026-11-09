import React from 'react';
import type { ServiceSummary } from '@/types/services';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/queries/useFavoritesQuery';

/** Shim kept so screens keep the same API; the data now comes from TanStack Query. */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export { useIsFavorite } from '@/hooks/queries/useFavoritesQuery';

export function useFavorites() {
  const ids = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const idSet = React.useMemo(() => new Set(ids ?? []), [ids]);
  return {
    count: ids?.length ?? 0,
    isFavorite: (serviceId: string) => idSet.has(serviceId),
    toggle: async (service: ServiceSummary) => { toggleFavorite(service); },
  };
}
