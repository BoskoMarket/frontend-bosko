import type { Href } from 'expo-router';
import type { ServiceSummary } from '@/types/services';

type QuoteService = Pick<ServiceSummary, 'id' | 'title'>;

/** Typed href to the quote request of one service (`/orders/quote`). */
export function quoteHref(service: QuoteService, providerName: string): Href {
  return {
    pathname: '/orders/quote',
    params: { serviceId: service.id, providerName, serviceTitle: service.title },
  };
}

export type QuoteTarget =
  | { kind: 'none' }
  | { kind: 'direct'; service: ServiceSummary }
  | { kind: 'choose'; services: ServiceSummary[] };

/** What "Cotizar" on a provider profile should do: nothing, quote the only service, or ask which one. */
export function resolveQuoteTarget(services: ServiceSummary[]): QuoteTarget {
  if (services.length === 0) return { kind: 'none' };
  if (services.length === 1) return { kind: 'direct', service: services[0] };
  return { kind: 'choose', services };
}
