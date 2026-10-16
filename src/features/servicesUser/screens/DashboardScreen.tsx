/**
 * DashboardScreen — Home entry. Providers get a work-focused home
 * (ProviderHome); everyone else gets the explainer home (ClientHome).
 */
import React from 'react';
import { useIsProvider } from '@/hooks/queries/useProfileQuery';
import ClientHome from '@/features/servicesUser/screens/ClientHome';
import ProviderHome from '@/features/servicesUser/screens/ProviderHome';

export default function DashboardScreen() {
  const isProvider = useIsProvider();
  return isProvider ? <ProviderHome /> : <ClientHome />;
}
