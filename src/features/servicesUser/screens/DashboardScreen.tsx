/**
 * DashboardScreen — Home. Rebrand "Señal Nocturna": misma lógica, estado,
 * fetch de categorías/servicios destacados, auto-rotate del hero y navegación
 * que el archivo original — solo cambia el chrome visual:
 *  - AnimatedBackground detrás de todo el scroll (glow rosa a la deriva).
 *  - Sombras negras → glow rosa (`TOKENS.shadow.glow`) en notifBtn, searchBar,
 *    service cards, quick-action icons.
 *  - Fallback de ícono de categoría: emoji '🔧' → Ionicons 'construct-outline'.
 *  - Gradientes del hero / CTA banner: stop bordo intermedio '#c0002f' → '#FF2D6F'.
 *  - Quick actions: chips pastel sólidos (#E8F4FD, etc) → vidrio + ícono en signal/mint.
 *  - Header/search ya eran theme-aware (`tc.*`) — heredan el look dark-first
 *    directo de los tokens nuevos, sin tocar código.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/features/auth/state/AuthContext';
import { useProfile } from '@/features/profile/state/ProfileContext';
import { useIsProvider } from '@/hooks/queries/useProfileQuery';
import { useCategories } from '@/hooks/queries/useMarketplaceQuery';
import { useNotifications } from '@/features/notifications/state/NotificationsContext';
import { openNotifications } from '@/stores/notificationsUI.store';
import { fetchFeaturedServices } from '@/features/servicesUser/services/services';
import type { ServiceSummary } from '@/types/services';
import { TOKENS } from '@/core/design-system/tokens';
import { useThemeColors, useIsDark } from '@/stores/theme.store';
import { useFavorites } from '@/features/favorites/state/FavoritesContext';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { RoleSelectionModal, ROLE_MODAL_SEEN_KEY } from '@/features/servicesUser/components/RoleSelectionModal';
import { FeaturedCard } from '@/features/servicesUser/components/FeaturedCard';
import { GRADIENTS } from '@/core/design-system';

const { width: W } = Dimensions.get('window');

type CPalette = ReturnType<typeof makeC>;
function makeC(tc: ReturnType<typeof useThemeColors>) {
  return {
    primary:   TOKENS.color.primary,
    signal:    TOKENS.color.signal,
    dark:      TOKENS.color.primaryDark,
    bg:        tc.bg,
    card:      tc.card,
    text:      tc.text,
    sub:       tc.textSub,
    border:    tc.border,
    accent:    tc.accent,
    surface2:  tc.surface2,
  };
}

const HERO_SLIDES_CLIENT = [
  {
    id: '1', title: 'Encontrá el\nprofesional ideal', subtitle: 'Miles de expertos cerca tuyo',
    cta: 'Explorar', icon: 'search' as const,
    gradient: [TOKENS.color.signal, TOKENS.color.primary, TOKENS.color.primaryDark] as const,
    route: '/(tabs)/services' as const,
  },
  {
    id: '3', title: 'Gestión de\npedidos', subtitle: 'Seguí tus órdenes en tiempo real',
    cta: 'Ver pedidos', icon: 'clipboard' as const,
    gradient: ['#2D1B69', '#11998E', '#38EF7D'] as const,
    route: '/(tabs)/orders' as const,
  },
];

const HERO_SLIDES_PROVIDER = [
  {
    id: '1', title: 'Encontrá el\nprofesional ideal', subtitle: 'Miles de expertos cerca tuyo',
    cta: 'Explorar', icon: 'search' as const,
    gradient: [TOKENS.color.signal, TOKENS.color.primary, TOKENS.color.primaryDark] as const,
    route: '/(tabs)/services' as const,
  },
  {
    id: '2', title: 'Publicá\ntu servicio', subtitle: 'Llega a nuevos clientes hoy',
    cta: 'Publicar', icon: 'add-circle' as const,
    gradient: ['#1A1A2E', '#16213E', '#0F3460'] as const,
    route: '/service-form' as const,
  },
  {
    id: '3', title: 'Gestión de\npedidos', subtitle: 'Seguí tus órdenes en tiempo real',
    cta: 'Ver pedidos', icon: 'clipboard' as const,
    gradient: ['#2D1B69', '#11998E', '#38EF7D'] as const,
    route: '/(tabs)/orders' as const,
  },
];

// Antes: pasteles sólidos (#E8F4FD + #2196F3, etc). Ahora: vidrio uniforme +
// ícono tintado en signal/mint — coherente con la superficie glass del resto.
const QUICK_ACTIONS_CLIENT = [
  { id: 'search', label: 'Buscar',   icon: 'search' as const,      iconColor: '#4C9DFF' },
  { id: 'orders', label: 'Pedidos',  icon: 'list' as const,        iconColor: '#00E5A0' },
  { id: 'chat',   label: 'Mensajes', icon: 'chatbubbles' as const, iconColor: '#FFB020' },
];

const QUICK_ACTIONS_PROVIDER = [
  { id: 'search', label: 'Buscar',   icon: 'search' as const,      iconColor: '#4C9DFF' },
  { id: 'post',   label: 'Publicar', icon: 'add-circle' as const,  iconColor: '#FF2D6F' },
  { id: 'orders', label: 'Pedidos',  icon: 'list' as const,        iconColor: '#00E5A0' },
  { id: 'chat',   label: 'Mensajes', icon: 'chatbubbles' as const, iconColor: '#FFB020' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  const tc = useThemeColors();
  return (
    <View style={ds.sectionRow}>
      <Text style={[ds.sectionTitle, { color: tc.text }]}>{title}</Text>
      {onPress && (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={[ds.sectionLink, { color: TOKENS.color.signal }]}>Ver todo</Text>
        </Pressable>
      )}
    </View>
  );
}

function resolveCategoryIcon(icon?: string): React.ComponentProps<typeof Ionicons>['name'] {
  // Fallback de ícono: antes emoji '🔧' hardcodeado — ahora Ionicons, coherente
  // con el resto del sistema (nunca emoji como icono de UI).
  if (!icon || /\p{Extended_Pictographic}/u.test(icon)) return 'construct-outline';
  return icon as React.ComponentProps<typeof Ionicons>['name'];
}

function CategoryTile({
  name, icon, count, featured, onPress, delay,
}: { name: string; icon: string; count?: number; featured?: boolean; onPress: () => void; delay: number }) {
  const tc = useThemeColors();
  const anim = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, delay, useNativeDriver: true }).start();
  }, []);

  const pressIn = () => Animated.spring(scaleA, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true }).start();
  const iconName = resolveCategoryIcon(icon);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }, { scale: scaleA }], width: '31%' }}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={[
          ds.categoryTile,
          featured
            ? { backgroundColor: tc.card, borderColor: 'rgba(255,45,111,0.45)' }
            : { backgroundColor: tc.surface2, borderColor: tc.border },
        ]}
      >
        {featured ? (
          <LinearGradient colors={GRADIENTS.brand} style={[ds.categoryIconWrap, ds.categoryIconGlow]}>
            <Ionicons name={iconName} size={18} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={[ds.categoryIconWrap, { backgroundColor: tc.accent }]}>
            <Ionicons name={iconName} size={18} color={TOKENS.color.signal} />
          </View>
        )}
        <Text style={[ds.categoryTileName, { color: tc.text }]} numberOfLines={1}>{name}</Text>
        {count != null && (
          <Text style={[ds.categoryTileCount, { color: featured ? TOKENS.color.signal : tc.textMuted }]}>{count}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function FeaturedServiceCard({ item, categoryIcon, delay }: { item: ServiceSummary; categoryIcon?: string; delay: number }) {
  const { isFavorite, toggle } = useFavorites();

  return (
    <FeaturedCard
      style={{ width: (W - 48) / 2 }}
      title={item.title || item.name}
      imageUri={item.thumbnail ?? item.images?.[0]}
      icon={resolveCategoryIcon(categoryIcon)}
      metaLabel={`${item.averageRating ? Number(item.averageRating).toFixed(1) : '—'} ★ / ${item.reviewsCount ?? 0}`}
      ctaLabel="Cotizar por chat"
      isFavorite={isFavorite(item.id)}
      onToggleFavorite={() => toggle(item)}
      onPress={() => router.push({ pathname: '/(tabs)/services/provider/[id]', params: { id: item.providerId ?? item.id, from: 'home' } })}
      delay={delay}
    />
  );
}

function QuickActionBtn({
  icon, label, iconColor, onPress, delay,
}: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; iconColor: string; onPress: () => void; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, friction: 7 }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }], flex: 1 }}>
      <Pressable
        onPressIn={() => Animated.spring(scaleA, { toValue: 0.9, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true }).start()}
        onPress={onPress}
        style={ds.qaBtn}
      >
        <Animated.View style={[ds.qaIcon, { transform: [{ scale: scaleA }] }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </Animated.View>
        <QALabel label={label} />
      </Pressable>
    </Animated.View>
  );
}

function QALabel({ label }: { label: string }) {
  const tc = useThemeColors();
  return <Text style={[ds.qaLabel, { color: tc.text }]}>{label}</Text>;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useIsDark();
  const C = useMemo(() => makeC(tc), [tc]);
  const s = useMemo(() => makeStyles(C), [C]);

  const { authState } = useAuth();
  const { profile } = useProfile();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data ?? [];

  const { unreadCount } = useNotifications();
  const isProvider = useIsProvider();
  const HERO_SLIDES = isProvider ? HERO_SLIDES_PROVIDER : HERO_SLIDES_CLIENT;
  const QUICK_ACTIONS = isProvider ? QUICK_ACTIONS_PROVIDER : QUICK_ACTIONS_CLIENT;

  const [heroIndex, setHeroIndex] = useState(0);
  const [featuredServices, setFeaturedServices] = useState<ServiceSummary[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Modal de bienvenida (cliente vs. prestador) — una sola vez, y no a alguien
  // que ya es prestador activo (ya eligió hace rato).
  useEffect(() => {
    if (isProvider) return;
    AsyncStorage.getItem(ROLE_MODAL_SEEN_KEY).then(seen => {
      if (!seen) setShowRoleModal(true);
    });
  }, [isProvider]);

  const dismissRoleModal = async () => {
    setShowRoleModal(false);
    await AsyncStorage.setItem(ROLE_MODAL_SEEN_KEY, 'true');
  };

  const handleSelectProvider = async () => {
    await dismissRoleModal();
    router.push('/(tabs)/profile/become-provider');
  };

  const sections = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(90, sections.map(v => Animated.timing(v, { toValue: 1, duration: 420, useNativeDriver: true }))).start();
  }, []);

  const sectionStyle = (i: number) => ({
    opacity: sections[i],
    transform: [{ translateY: sections[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  });

  const heroRef = useRef<FlatList>(null);
  const heroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHeroIndex(0);
    heroRef.current?.scrollToIndex({ index: 0, animated: false });
  }, [isProvider]);

  const advanceHero = useCallback(() => {
    setHeroIndex(prev => {
      const next = (prev + 1) % HERO_SLIDES.length;
      heroRef.current?.scrollToIndex({ index: next, animated: true });
      return next;
    });
  }, []);

  useEffect(() => {
    heroTimerRef.current = setInterval(advanceHero, 3600);
    return () => { if (heroTimerRef.current) clearInterval(heroTimerRef.current); };
  }, [advanceHero]);



  const loadFeatured = useCallback(() => {
    setFeaturedLoading(true);
    setFeaturedError(false);
    fetchFeaturedServices()
      .then(services => { setFeaturedServices(services.slice(0, 6)); setFeaturedLoading(false); })
      .catch(() => { setFeaturedError(true); setFeaturedLoading(false); });
  }, []);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  const displayName = profile?.firstName ?? 'Bienvenido';
  const greeting = getGreeting();

  const handleQuickAction = (id: string) => {
    if (id === 'search') router.push('/search');
    if (id === 'orders') router.push('/(tabs)/orders');
    if (id === 'chat') router.push('/(tabs)/chat');
    if (id === 'post') router.push('/service-form');
  };

  const handleCategoryPress = (catId: string) => {
    router.push({ pathname: '/(tabs)/services/category/[id]', params: { id: catId, from: 'home' } });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <AnimatedBackground variant="app" />

      <Animated.View style={[s.header, sectionStyle(0)]}>
        <View style={s.headerLeft}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={s.avatar} contentFit="cover" />
          ) : (
            <LinearGradient colors={[TOKENS.color.signal, TOKENS.color.primary]} style={s.avatarGrad}>
              <Text style={s.avatarInitial}>{(profile?.firstName?.[0] ?? 'U').toUpperCase()}</Text>
            </LinearGradient>
          )}
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.userName}>{displayName}</Text>
          </View>
        </View>

        <Pressable style={s.notifBtn} onPress={openNotifications} hitSlop={8}>
          <Ionicons name="notifications-outline" size={20} color={C.text} />
          {unreadCount > 0 && <View style={s.notifDot} />}
        </Pressable>
      </Animated.View>

      <Animated.View style={[s.searchWrap, sectionStyle(0)]}>
        <Pressable style={s.searchBar} onPress={() => router.push('/search')}>
          <Ionicons name="search-outline" size={18} color={C.sub} />
          <Text style={s.searchPlaceholder}>Buscar servicios, profesionales…</Text>
          <View style={s.searchFilter}>
            <Ionicons name="options-outline" size={16} color="#fff" />
          </View>
        </Pressable>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 90 }]}>
        <Animated.View style={[s.section, sectionStyle(1)]}>
          <SectionHeader title="Categorías" onPress={() => router.push('/(tabs)/services')} />
          {categoriesQuery.isLoading && !categories.length ? (
            <View style={s.categoryGrid}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <View key={i} style={[s.categoryTileSkeleton, { backgroundColor: C.surface2 }]} />
              ))}
            </View>
          ) : categoriesQuery.isError && !categories.length ? (
            <ErrorBanner message="No se pudieron cargar las categorías" onRetry={() => categoriesQuery.refetch()} C={C} />
          ) : (
            <View style={s.categoryGrid}>
              {categories.slice(0, 6).map((cat, idx) => (
                <CategoryTile
                  key={cat.id}
                  name={cat.name}
                  icon={cat.icon ?? ''}
                  count={cat.servicesCount}
                  featured={idx === 0}
                  onPress={() => handleCategoryPress(cat.id)}
                  delay={idx * 40}
                />
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View style={sectionStyle(2)}>
          <FlatList
            ref={heroRef}
            data={HERO_SLIDES}
            keyExtractor={i => i.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              if (heroTimerRef.current) clearInterval(heroTimerRef.current);
              const idx = Math.round(e.nativeEvent.contentOffset.x / W);
              setHeroIndex(idx);
              heroTimerRef.current = setInterval(advanceHero, 3600);
            }}
            renderItem={({ item }) => <HeroSlide slide={item} s={s} C={C} />}
          />
          <View style={s.dotsRow}>
            {HERO_SLIDES.map((_, i) => (
              <View key={i} style={[s.dot, i === heroIndex ? s.dotActive : s.dotInactive]} />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[s.section, sectionStyle(3)]}>
          <View style={s.qaRow}>
            {QUICK_ACTIONS.map((a, idx) => (
              <QuickActionBtn key={a.id} icon={a.icon} label={a.label} iconColor={a.iconColor} onPress={() => handleQuickAction(a.id)} delay={idx * 60} />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[s.section, sectionStyle(4)]}>
          <SectionHeader title="Servicios populares" onPress={() => router.push('/(tabs)/services')} />
          {featuredLoading ? (
            <SkeletonGrid s={s} C={C} />
          ) : featuredError ? (
            <ErrorBanner message="No se pudieron cargar los servicios" onRetry={loadFeatured} C={C} />
          ) : featuredServices.length > 0 ? (
            <View style={s.servicesGrid}>
              {featuredServices.map((item, idx) => (
                <FeaturedServiceCard
                  key={item.id}
                  item={item}
                  categoryIcon={categories.find(c => c.id === item.categoryId)?.icon}
                  delay={idx * 50}
                />
              ))}
            </View>
          ) : (
            <SkeletonGrid s={s} C={C} />
          )}
        </Animated.View>

        {isProvider && (
          <Animated.View style={[s.section, sectionStyle(4)]}>
            <CTABanner s={s} />
          </Animated.View>
        )}
      </ScrollView>

      <RoleSelectionModal
        visible={showRoleModal}
        onSelectClient={dismissRoleModal}
        onSelectProvider={handleSelectProvider}
      />
    </View>
  );
}

function ErrorBanner({ message, onRetry, C }: { message: string; onRetry: () => void; C: CPalette }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
      <Ionicons name="cloud-offline-outline" size={32} color={C.sub} />
      <Text style={{ color: C.sub, fontSize: 13 }}>{message}</Text>
      <Pressable onPress={onRetry} style={{ backgroundColor: C.signal, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

function HeroSlide({ slide, s, C }: { slide: typeof HERO_SLIDES_CLIENT[number] | typeof HERO_SLIDES_PROVIDER[number]; s: ReturnType<typeof makeStyles>; C: CPalette }) {
  const scaleA = useRef(new Animated.Value(1)).current;

  return (
    <View style={{ width: W, paddingHorizontal: 16 }}>
      <View style={s.heroSlide}>
        <LinearGradient colors={slide.gradient} style={s.heroGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[s.heroBubble, { width: 160, height: 160, top: -40, right: -40, opacity: 0.12 }]} />
          <View style={[s.heroBubble, { width: 100, height: 100, bottom: 20, right: 60, opacity: 0.08 }]} />

          <View style={s.heroContent}>
            <View style={s.heroIconWrap}>
              <Ionicons name={slide.icon} size={26} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={s.heroTitle}>{slide.title}</Text>
            <Text style={s.heroSubtitle}>{slide.subtitle}</Text>

            <Pressable
              onPressIn={() => Animated.spring(scaleA, { toValue: 0.94, useNativeDriver: true }).start()}
              onPressOut={() => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true }).start()}
              onPress={() => router.push(slide.route)}
            >
              <Animated.View style={[s.heroCta, { transform: [{ scale: scaleA }] }]}>
                <Text style={s.heroCtaText}>{slide.cta}</Text>
                <Ionicons name="arrow-forward" size={14} color={C.primary} />
              </Animated.View>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

function CTABanner({ s }: { s: ReturnType<typeof makeStyles> }) {
  const scaleA = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleA, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true }).start()}
      onPress={() => router.push('/(tabs)/profile')}
    >
      <Animated.View style={{ transform: [{ scale: scaleA }] }}>
        <LinearGradient colors={['#FF2D6F', '#850021', '#3C0014']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.ctaBanner}>
          <View style={s.ctaLeft}>
            <Text style={s.ctaTitle}>¿Ofrecés servicios?</Text>
            <Text style={s.ctaSub}>Publicá tu perfil y conseguí más clientes</Text>
            <View style={s.ctaBtn}>
              <Text style={s.ctaBtnText}>Empezar ahora</Text>
              <Ionicons name="arrow-forward" size={13} color={TOKENS.color.primary} />
            </View>
          </View>
          <View style={s.ctaBubble1} />
          <View style={s.ctaBubble2} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function SkeletonGrid({ s, C }: { s: ReturnType<typeof makeStyles>; C: CPalette }) {
  return (
    <View style={s.servicesGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={[s.serviceCardShadow, { width: (W - 48) / 2, backgroundColor: C.card }]}>
          <View style={[s.serviceCard, { backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }]}>
            <View style={[s.serviceThumb, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
            <View style={s.serviceInfo}>
              <View style={{ height: 12, width: '80%', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, marginBottom: 6 }} />
              <View style={{ height: 10, width: '50%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const ds = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Archivo_700Bold', letterSpacing: -0.2 },
  sectionLink: { fontSize: 13, fontWeight: '500' },
  categoryTile: { flex: 1, borderRadius: 18, borderWidth: 1.5, padding: 13, paddingHorizontal: 10, gap: 9 },
  categoryIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryIconGlow: { shadowColor: '#FF2D6F', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 4 },
  categoryTileName: { fontSize: 12, fontWeight: '700', fontFamily: 'Archivo_700Bold', lineHeight: 15 },
  categoryTileCount: { fontSize: 11, fontFamily: 'JetBrainsMono_500Medium', fontWeight: '700' },
  qaBtn: { alignItems: 'center', gap: 7 },
  qaIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  qaLabel: { fontSize: 11.5, fontWeight: '500' },
});

function makeStyles(C: CPalette) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 14, borderWidth: 2, borderColor: C.signal + '30' },
  avatarGrad: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 17, fontWeight: '700', fontFamily: 'Archivo_700Bold' },
  greeting: { fontSize: 11, fontFamily: 'JetBrainsMono_500Medium', letterSpacing: 1, textTransform: 'uppercase', color: C.sub, marginBottom: 3 },
  userName: { fontSize: 16, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: C.text },
  notifBtn: {
    width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  notifDot: { position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.signal, borderWidth: 1.5, borderColor: C.bg },

  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: C.sub },
  searchFilter: { width: 28, height: 28, borderRadius: 9, backgroundColor: C.signal, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingTop: 4 },

  heroSlide: { width: '100%', height: 224, borderRadius: 26, overflow: 'hidden' },
  heroGrad: { flex: 1, padding: 24, justifyContent: 'flex-end', overflow: 'hidden' },
  heroBubble: { position: 'absolute', borderRadius: 999, backgroundColor: '#FFFFFF' },
  heroContent: { gap: 6 },
  heroIconWrap: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', color: '#FFFFFF', lineHeight: 28, letterSpacing: -0.4 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  heroCta: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' },
  heroCtaText: { fontSize: 13, fontWeight: '700', color: C.primary },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 12, paddingBottom: 2 },
  dot: { height: 5, borderRadius: 2.5 },
  dotActive: { width: 20, backgroundColor: C.signal },
  dotInactive: { width: 5, backgroundColor: 'rgba(255,255,255,0.18)' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Archivo_700Bold', color: C.text, letterSpacing: -0.2 },
  sectionLink: { fontSize: 13, fontWeight: '500', color: C.signal },

  qaRow: { flexDirection: 'row', gap: 8 },
  qaBtn: { alignItems: 'center', gap: 7 },
  qaIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  qaLabel: { fontSize: 11.5, fontWeight: '500', color: C.text },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  categoryTileSkeleton: { width: '31%', height: 92, borderRadius: 18 },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  serviceCardShadow: { borderRadius: 22, shadowColor: '#FF2D6F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 4 },
  serviceCard: { borderRadius: 22, overflow: 'hidden' },
  serviceThumb: { width: '100%', height: 110, alignItems: 'center', justifyContent: 'center' },
  serviceInfo: { padding: 11, gap: 5 },

  ctaBanner: { borderRadius: 26, padding: 22, overflow: 'hidden', minHeight: 120 },
  ctaLeft: { flex: 1, gap: 4, zIndex: 1 },
  ctaTitle: { fontSize: 18, fontWeight: '800', fontFamily: 'Archivo_800ExtraBold', color: '#FFFFFF', letterSpacing: -0.3 },
  ctaSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 19, marginBottom: 10 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, alignSelf: 'flex-start' },
  ctaBtnText: { fontSize: 13, fontWeight: '700', color: C.primary },
  ctaBubble1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)', right: -20, top: -20 },
  ctaBubble2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', right: 50, bottom: -20 },
}); }
