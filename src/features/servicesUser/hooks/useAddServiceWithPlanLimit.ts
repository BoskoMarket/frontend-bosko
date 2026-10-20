import { useAuth } from '@/features/auth/state/AuthContext';
import { useCreateService, useMyServices } from '@/hooks/queries/useMarketplaceQuery';
import type { ServicePayload } from '@/features/servicesUser/services/service';

type PlanType = 'FREE' | 'PLUS';

function normalizePlan(plan: unknown): PlanType {
  if (!plan || typeof plan !== 'string') return 'FREE';
  const v = plan.toLowerCase();
  if (v.includes('plus') || v.includes('premium') || v === 'pro') return 'PLUS';
  return 'FREE';
}

/** Plan FREE: máximo 1 servicio publicado — regla de negocio, no de cache. */
export function useAddServiceWithPlanLimit() {
  const { authState } = useAuth();
  const myServicesQuery = useMyServices();
  const createServiceM = useCreateService();

  const plan = normalizePlan(
    (authState?.user as any)?.plan ??
      (authState?.user as any)?.subscriptionPlan ??
      (authState?.user as any)?.subscription?.plan ??
      (authState?.user as any)?.membership?.name ??
      (authState?.user as any)?.planType,
  );

  return {
    ...createServiceM,
    mutateAsync: (payload: ServicePayload) => {
      const myServicesCount = myServicesQuery.data?.pages[0]?.total ?? 0;
      if (plan === 'FREE' && myServicesCount >= 1) {
        const limitError = new Error(
          'Llegaste al límite de servicios de tu plan. Mejorá tu plan para crear más.',
        ) as Error & { code: string };
        limitError.code = 'SERVICE_LIMIT_REACHED';
        return Promise.reject(limitError);
      }
      return createServiceM.mutateAsync(payload);
    },
  };
}
