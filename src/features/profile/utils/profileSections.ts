/**
 * Role-aware entry points of the Perfil tab. Pure data so the grouping can be
 * tested without rendering the screen; every `href` is an existing route.
 */
import type React from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { ProviderStatus } from '@/hooks/useProviderStatus';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Extra info the screen renders next to the label. */
export type ProfileRowBadge = 'kyc' | 'favorites' | 'plans';

export interface ProfileRow {
  id: string;
  icon: IoniconName;
  label: string;
  href: string;
  badge?: ProfileRowBadge;
}

export interface ProfileSection {
  title: string;
  rows: ProfileRow[];
}

const PROVIDER_ROWS: ProfileRow[] = [
  { id: 'my-services', icon: 'construct-outline', label: 'Mis servicios', href: '/(tabs)/profile/Services' },
  { id: 'publish-service', icon: 'add-circle-outline', label: 'Publicar servicio', href: '/service-form' },
  { id: 'my-reels', icon: 'film-outline', label: 'Mis reels', href: '/(tabs)/profile/my-reels' },
  { id: 'my-reviews', icon: 'star-outline', label: 'Mis reseñas', href: '/(tabs)/profile/my-reviews' },
  { id: 'kyc', icon: 'shield-checkmark-outline', label: 'Verificación de identidad', href: '/(tabs)/profile/kyc', badge: 'kyc' },
  { id: 'background-check', icon: 'document-text-outline', label: 'Antecedentes penales', href: '/(tabs)/profile/background-check' },
  { id: 'plan', icon: 'diamond-outline', label: 'Plan', href: '/(tabs)/profile/plans', badge: 'plans' },
];

const CLIENT_ROWS: ProfileRow[] = [
  { id: 'favorites', icon: 'heart-outline', label: 'Favoritos', href: '/(tabs)/profile/favorites', badge: 'favorites' },
  { id: 'become-provider', icon: 'briefcase-outline', label: 'Convertirme en proveedor', href: '/(tabs)/profile/become-provider' },
];

/**
 * Group of rows that depends on the role. Users with a verification in progress
 * get no group: the "camino a ser prestador" card above already owns that flow.
 */
export function getRoleSection(status: ProviderStatus): ProfileSection | null {
  if (status === 'provider') return { title: 'Mi negocio', rows: PROVIDER_ROWS };
  if (status === 'client') return { title: 'Mi actividad', rows: CLIENT_ROWS };
  return null;
}
