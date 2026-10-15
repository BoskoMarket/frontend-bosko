import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCategories, useProviderProfile } from "@/hooks/queries/useMarketplaceQuery";
import type { Rate } from "@/types/services";
import { TOKENS, useThemeColors } from "@/core/design-system";
import type { ThemeColors } from "@/core/design-system";
import { PremiumButton } from "@/components/PremiumButton";
import { FONT_FAMILY } from '@/core/design-system';

const formatRate = (rate: Rate) => {
  const symbol = rate.currency === "ARS" ? "$" : rate.currency === "USD" ? "US$" : `${rate.currency} `;
  return `${symbol}${rate.amount} / ${rate.unit}`;
};

interface ProviderProfileProps {
  providerId: string;
  onBack?: () => void;
  onRequestQuote?: () => void;
}

const ProviderProfile: React.FC<ProviderProfileProps> = ({
  providerId,
  onBack,
  onRequestQuote,
}) => {
  const tc = useThemeColors();
  const styles = useMemo(() => createStyles(tc), [tc]);
  const categoriesQuery = useCategories();
  const providerQuery = useProviderProfile(providerId);

  const provider = providerQuery.data;
  const rating = {
    averageRating: provider?.averageRating ?? 0,
    reviewsCount: provider?.reviewsCount ?? 0,
  };

  const categoryAccent = useMemo(() => {
    const category = (categoriesQuery.data ?? []).find((item) => item.id === provider?.categoryId);
    return category?.accent ?? tc.surface2;
  }, [categoriesQuery.data, provider?.categoryId, tc.surface2]);

  if (!provider && providerQuery.isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.emptyState}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : null}
        <Text style={styles.emptyTitle}>No encontramos este profesional</Text>
        <Text style={styles.emptySubtitle}>
          Volvé a la lista y elegí otro servicio disponible.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.heroCard}>
        <ImageBackground
          source={{ uri: provider.heroImage }}
          style={styles.heroBackground}
          imageStyle={styles.heroBackgroundImage}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Image
              source={{ uri: provider.avatar }}
              style={[styles.heroAvatar, { borderColor: categoryAccent }]}
            />
            <Text style={styles.heroName}>{provider.name}</Text>
            <Text style={styles.heroTitle}>{provider.title}</Text>
            <Text style={styles.heroSummary}>{provider.summary}</Text>
            <View style={styles.heroStats}>
              <Text style={styles.heroRating}>★ {rating.averageRating ? Number(rating.averageRating).toFixed(1) : '0.0'}</Text>
              <View style={styles.dot} />
              <Text style={styles.heroReviews}>{rating.reviewsCount} reseñas</Text>
            </View>
            <Text style={styles.heroLocation}>{provider.location}</Text>
            <View style={styles.heroActions}>
              <PremiumButton
                title="Cotizar servicio"
                onPress={() => onRequestQuote && onRequestQuote()}
                size="small"
                style={{ backgroundColor: categoryAccent, borderRadius: TOKENS.radius.lg }}
                textStyle={{ color: tc.text }}
              />
            </View>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre el servicio</Text>
        <Text style={styles.sectionBody}>{provider.bio}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Especialidades</Text>
        <View style={styles.tagsRow}>
          {provider.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: categoryAccent }]}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trabajos recientes</Text>
        <View style={styles.worksList}>
          {provider.recentWorks.map((work) => (
            <View key={work.id} style={styles.workCard}>
              <Image source={{ uri: work.image }} style={styles.workImage} />
              <View style={styles.workInfo}>
                <Text style={styles.workTitle}>{work.title}</Text>
                <Text style={styles.workTime}>{work.timeAgo}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default ProviderProfile;

const createStyles = (tc: ThemeColors) => StyleSheet.create({
  wrapper: {
    gap: 20,
  },
  loader: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyState: {
    gap: 16,
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.headingMedium,
    color: tc.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    color: tc.textSub,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: tc.surface,
    alignItems: "center",
    justifyContent: "center",
    ...TOKENS.shadow.soft,
  },
  backIcon: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.body,
    color: tc.text,
  },
  heroCard: {
    borderRadius: TOKENS.radius.xl,
    overflow: "hidden",
    ...TOKENS.shadow.soft,
  },
  heroBackground: {
    width: "100%",
  },
  heroBackgroundImage: {
    width: "100%",
    minHeight: 320,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.scrim.medium,
  },
  heroContent: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 4,
  },
  heroName: {
    fontSize: 22,
    fontFamily: FONT_FAMILY.heading,
    color: TOKENS.onMedia.text,
  },
  heroTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.body,
    color: TOKENS.onMedia.text,
  },
  heroSummary: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    color: TOKENS.onMedia.textSub,
    textAlign: "center",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroRating: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.headingMedium,
    color: TOKENS.color.rating,
  },
  heroReviews: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    color: TOKENS.onMedia.text,
  },
  heroLocation: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    color: TOKENS.onMedia.textSub,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroRate: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.headingMedium,
    color: TOKENS.onMedia.text,
  },

  section: {
    gap: 12,
    backgroundColor: tc.card,
    padding: 20,
    borderRadius: TOKENS.radius.lg,
    ...TOKENS.shadow.soft,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.heading,
    color: tc.text,
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.body,
    color: tc.textSub,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TOKENS.radius.lg,
  },
  tagText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    color: tc.text,
  },
  worksList: {
    gap: 12,
  },
  workCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  workImage: {
    width: 64,
    height: 64,
    borderRadius: TOKENS.radius.md,
  },
  workInfo: {
    flex: 1,
    gap: 4,
  },
  workTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.headingMedium,
    color: tc.text,
  },
  workTime: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.body,
    color: tc.textSub,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: TOKENS.onMedia.textMuted,
  },
});
