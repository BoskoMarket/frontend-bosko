import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  fetchReviewsByService,
  createReview,
  Review,
} from "@/src/ticketing/services/reviews";

/**
 * ReviewsContext
 *
 * Provides state and functions for managing reviews associated with a
 * single service. This context can be scoped at the service detail
 * level; however, it can also live globally if multiple components
 * need access to the same set of reviews. For simplicity, the
 * provider accepts a `serviceId` prop to know which reviews to
 * load.
 */

interface ReviewsState {
  reviews: Review[];
  loading: boolean;
  loadReviews: () => Promise<void>;
  addReview: (rating: number, comment: string) => Promise<Review>;
}

const ReviewsContext = createContext<ReviewsState | undefined>(undefined);

export const ReviewsProvider = ({
  children,
  serviceId,
}: {
  children: ReactNode;
  serviceId: string;
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await fetchReviewsByService(serviceId);
      setReviews(data);
    } finally {
      setLoading(false);
    }
  };

  const addReview = async (rating: number, comment: string) => {
    const newReview = await createReview(serviceId, { rating, comment });
    setReviews((prev) => [...prev, newReview]);
    return newReview;
  };

  // useEffect(() => {
  //   loadReviews().catch((err) => console.error(err));
  // }, [serviceId]);

  const value: ReviewsState = {
    reviews,
    loading,
    loadReviews,
    addReview,
  };

  return (
    <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (context === undefined) {
    throw new Error("useReviews must be used within a ReviewsProvider");
  }
  return context;
};
