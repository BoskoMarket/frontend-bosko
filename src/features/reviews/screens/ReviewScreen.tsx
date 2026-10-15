/**
 * ReviewScreen — Calificar orden completada.
 * POST /reviews con star rating + comentario.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { MotiView } from '@/core/components/MotiView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/core/navigation/safeBack';
import { useCreateReview } from '@/hooks/mutations/useReviewMutations';
import { extractApiError, getUserErrorMessage } from '@/lib/errors';
import {
  TOKENS,
  GRADIENTS,
  SPACING,
  Badge,
  Button,
  Card,
  Input,
  ScreenHeader,
  Text,
  toast,
  useThemeColors,
  usePremiumColors,
} from '@/core/design-system';
import { AnimatedBackground } from '@/components/AnimatedBackground';

const LABELS = ['Pésimo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
const MAX_COMMENT = 500;

export default function ReviewScreen() {
  const tc = useThemeColors();
  const pc = usePremiumColors();
  const insets = useSafeAreaInsets();
  const { orderId, providerName, serviceName } = useLocalSearchParams<{
    orderId: string;
    providerName?: string;
    serviceName?: string;
  }>();

  const { mutateAsync: createReview, isPending: submitting } = useCreateReview();
  const inFlight = useRef(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const displayRating = hoverRating || rating;

  const handleSubmit = async () => {
    if (inFlight.current) return;
    if (rating === 0) {
      toast.warning('Calificación requerida', 'Seleccioná una cantidad de estrellas.');
      return;
    }

    inFlight.current = true;
    try {
      await createReview({ orderId: orderId!, rating, comment: comment.trim() });
      toast.success('¡Gracias!', 'Tu reseña ayuda a la comunidad.');
      safeBack(router, '/(tabs)/orders');
    } catch (err) {
      const { code } = extractApiError(err);
      if (code === 'ALREADY_REVIEWED') {
        Alert.alert('Ya calificaste esta orden', getUserErrorMessage(err), [
          { text: 'OK', onPress: () => safeBack(router, '/(tabs)/orders') },
        ]);
        return;
      }
      toast.error('No pudimos enviar tu reseña', getUserErrorMessage(err));
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <View style={[styles.bg, { paddingTop: insets.top, backgroundColor: tc.bg }]}>
      <AnimatedBackground variant="minimal" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16 }}
          style={styles.header}
        >
          <ScreenHeader title="Calificar" onBack={() => safeBack(router, '/(tabs)/orders')} />
        </MotiView>

        {/* Icon */}
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 150 }}
          style={styles.iconWrap}
        >
          <LinearGradient
            colors={GRADIENTS.brandDeep}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGrad}
          >
            <MaterialIcons name="rate-review" size={40} color={pc.goldFill} />
          </LinearGradient>
        </MotiView>

        {/* Title */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 100 }}
          style={styles.titleSection}
        >
          <Text variant="h3" color={tc.text}>Calificá el servicio</Text>
          {serviceName && <Text variant="subtitle" color={tc.textSub}>{serviceName}</Text>}
          {providerName && (
            <Text variant="body" color={tc.textSub}>por {providerName}</Text>
          )}
        </MotiView>

        {/* Stars */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, delay: 200 }}
          style={styles.starsContainer}
        >
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                onPressIn={() => setHoverRating(star)}
                onPressOut={() => setHoverRating(0)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${star} ${star === 1 ? 'estrella' : 'estrellas'}: ${LABELS[star - 1]}`}
                accessibilityState={{ selected: star === rating }}
              >
                <MaterialIcons
                  name={star <= displayRating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= displayRating ? TOKENS.color.rating : tc.border}
                  style={styles.star}
                />
              </Pressable>
            ))}
          </View>
          {displayRating > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
            >
              <Badge label={LABELS[displayRating - 1]} tone="pending" />
            </MotiView>
          )}
        </MotiView>

        {/* Comment */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 300 }}
          style={styles.commentCard}
        >
          <Card radius="lg" padding="xl" contentStyle={styles.commentBody}>
            <Input
              label="Contanos tu experiencia"
              value={comment}
              onChangeText={setComment}
              placeholder="¿Qué te pareció el servicio? ¿Recomendarías al profesional?"
              multiline
              maxLength={MAX_COMMENT}
              textAlignVertical="top"
            />
            <Text variant="caption" color={tc.textMuted} style={styles.charCount}>
              {comment.length}/{MAX_COMMENT}
            </Text>
          </Card>
        </MotiView>

        {/* Submit */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 400 }}
          style={styles.submit}
        >
          <Button
            label="Enviar Reseña"
            icon={<MaterialIcons name="send" size={18} color={TOKENS.color.onPrimary} />}
            onPress={handleSubmit}
            disabled={rating === 0}
            loading={submitting}
            fullWidth
          />
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.sm,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  iconWrap: {
    marginBottom: SPACING.xl,
  },
  iconGrad: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...TOKENS.shadow.button,
    elevation: 10,
  },
  titleSection: { alignItems: 'center', marginBottom: SPACING.xxl, gap: SPACING.xs },
  starsContainer: { alignItems: 'center', gap: SPACING.md, marginBottom: 28 },
  starsRow: { flexDirection: 'row', gap: SPACING.xs },
  star: { marginHorizontal: 2 },
  commentCard: {
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  commentBody: { gap: SPACING.sm },
  charCount: { alignSelf: 'flex-end' },
  submit: { width: '100%' },
});
