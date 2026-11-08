/**
 * useRequireProviderStatus — guard para pantallas exclusivas de prestador.
 * Si el usuario no llega al status mínimo pedido, lo manda a BecomeProviderScreen
 * (que muestra su progreso real) en vez de dejarlo entrar por un deep link/notificación.
 *
 * Con `{ requirePublish: true }` además exige poder publicar (KYC aprobado Y
 * teléfono verificado) y redirige al paso pendiente (checklist o verificar teléfono).
 *
 * Espera a que profile + KYC terminen de cargar antes de decidir — evita un
 * redirect falso-positivo mientras `status` todavía vale 'client' por defecto.
 */

import { useEffect } from 'react';
import { router } from 'expo-router';
import { useProviderStatus, type ProviderStatus } from '@/hooks/useProviderStatus';
import { resolveGateRedirect } from '@/features/kyc/utils/providerReadiness';

export function useRequireProviderStatus(min: ProviderStatus, opts?: { requirePublish?: boolean }) {
  const { status, canPublish, nextStep, isLoading } = useProviderStatus();
  const requirePublish = opts?.requirePublish === true;

  useEffect(() => {
    if (isLoading) return;
    const target = resolveGateRedirect({ status, canPublish, nextStep }, min, requirePublish);
    if (target) router.replace(target as never);
  }, [status, canPublish, nextStep, isLoading, min, requirePublish]);
}
