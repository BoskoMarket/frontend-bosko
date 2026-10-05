/**
 * useRequireProviderStatus — guard para pantallas exclusivas de prestador.
 * Si el usuario no llega al status mínimo pedido, lo manda a BecomeProviderScreen
 * (que muestra su progreso real) en vez de dejarlo entrar por un deep link/notificación.
 *
 * Espera a que profile + KYC terminen de cargar antes de decidir — evita un
 * redirect falso-positivo mientras `status` todavía vale 'client' por defecto.
 */

import { useEffect } from 'react';
import { router } from 'expo-router';
import { useProviderStatus, type ProviderStatus } from '@/hooks/useProviderStatus';

const RANK: Record<ProviderStatus, number> = { client: 0, pending: 1, provider: 2 };

export function useRequireProviderStatus(min: ProviderStatus) {
  const { status, isLoading } = useProviderStatus();

  useEffect(() => {
    if (isLoading) return;
    if (RANK[status] < RANK[min]) {
      router.replace('/(tabs)/profile/become-provider');
    }
  }, [status, isLoading, min]);
}
