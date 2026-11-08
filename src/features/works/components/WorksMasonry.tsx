import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SPACING, TOKENS, useThemeColors } from '@/core/design-system';
import { workRatio, splitIntoColumns } from '../utils/masonry';

export const MASONRY_COLUMNS = 2;
export const MASONRY_GAP = SPACING.sm;

interface MasonryItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
}

export interface WorksMasonryProps<T extends MasonryItem> {
  items: readonly T[];
  onPressItem: (item: T) => void;
  /** Accessibility label of one tile. */
  labelFor: (item: T) => string;
  /** Optional content drawn over a tile (e.g. a status badge). */
  overlayFor?: (item: T) => React.ReactNode;
  /** Horizontal padding of the parent, used to size the columns. */
  horizontalPadding?: number;
}

/** Two-column masonry grid; tile height comes from the photo dimensions (fixed ratio when unknown). */
export function WorksMasonry<T extends MasonryItem>({
  items,
  onPressItem,
  labelFor,
  overlayFor,
  horizontalPadding = SPACING.lg,
}: WorksMasonryProps<T>) {
  const tc = useThemeColors();
  const { width } = useWindowDimensions();
  const columnWidth = (width - horizontalPadding * 2 - MASONRY_GAP * (MASONRY_COLUMNS - 1)) / MASONRY_COLUMNS;
  const columns = useMemo(() => splitIntoColumns(items, MASONRY_COLUMNS), [items]);

  return (
    <View style={styles.row}>
      {columns.map((column, index) => (
        <View key={index} style={{ width: columnWidth, gap: MASONRY_GAP }}>
          {column.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={labelFor(item)}
              onPress={() => onPressItem(item)}
              style={[
                styles.tile,
                { width: columnWidth, aspectRatio: workRatio(item), backgroundColor: tc.surface2 },
              ]}
            >
              <Image
                source={{ uri: item.thumbnailUrl ?? item.imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={150}
                cachePolicy="memory-disk"
                recyclingKey={item.id}
              />
              {overlayFor?.(item)}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tile: { borderRadius: TOKENS.radius.md, overflow: 'hidden' },
});
