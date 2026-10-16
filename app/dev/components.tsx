import React from 'react';
import { Redirect } from 'expo-router';
import { ComponentShowcase } from '@/core/design-system/showcase/ComponentShowcase';

// Dev-only route: design-system component catalog.
export default function DevComponentsScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ComponentShowcase />;
}
