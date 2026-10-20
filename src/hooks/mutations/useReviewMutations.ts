import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import {
  createReview,
  replyToReview,
  type ReviewPayload,
} from '@/features/reviews/services/review.service';
import { maybePromptReview } from '@/lib/reviewPrompt';
import { extractApiError } from '@/lib/errors';

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewPayload) => createReview(payload),
    onSuccess: (review, payload) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.serviceReviews(review.providerId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(payload.orderId) });
      maybePromptReview();
    },
    onError: (error, payload) => {
      if (extractApiError(error).code === 'ALREADY_REVIEWED') {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.orderById(payload.orderId) });
      }
    },
  });
}

export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      replyToReview(reviewId, reply),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.serviceReviews(updated.providerId) });
    },
  });
}
