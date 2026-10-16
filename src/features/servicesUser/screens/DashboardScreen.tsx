/**
 * DashboardScreen — Home entry. Providers get a work-focused home
 * (ProviderHome); everyone else gets the explainer home (ClientHome).
 * While the role is still unknown (cold start, profile loading) it shows a
 * loader, so a provider never flashes the client home (and its queries/modal).
 */
import React from 'react';
import { ScreenLoader } from '@/core/design-system';
import { useProviderRole } from '@/hooks/queries/useProfileQuery';
import ClientHome from '@/features/servicesUser/screens/ClientHome';
import ProviderHome from '@/features/servicesUser/screens/ProviderHome';

export default function DashboardScreen() {
  const { isProvider, isResolving } = useProviderRole();
  if (isResolving) return <ScreenLoader variant="plain" />;
  return isProvider ? <ProviderHome /> : <ClientHome />;
}
