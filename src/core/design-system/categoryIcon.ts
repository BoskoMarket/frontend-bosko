import type React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type CategoryIconName = React.ComponentProps<typeof Ionicons>['name'];

export const DEFAULT_CATEGORY_ICON: CategoryIconName = 'construct-outline';

/** Ionicons name only: unknown names (including backend emoji) fall back to the default glyph. */
export function resolveCategoryIcon(raw?: string): CategoryIconName {
  if (raw && Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, raw)) {
    return raw as CategoryIconName;
  }
  return DEFAULT_CATEGORY_ICON;
}
