import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { nextCollectionPage } from '@/core/api/collections';
import {
  fetchCategoriesService,
  fetchServicesByCategoryService,
  fetchProviderProfileService,
  fetchServiceReviewsService,
} from '@/features/servicesUser/services/catalog';
import {
  getMyServices,
  createService,
  updateService,
  deleteService,
  type ServicePayload,
} from '@/features/servicesUser/services/service';
import { fetchFeaturedServices } from '@/features/servicesUser/services/services';
import { fetchPostsByService, likePost } from '@/features/servicesUser/services/posts';

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: fetchCategoriesService,
    staleTime: 30 * 60 * 1000,
  });
}

export function useServicesByCategory(categoryId: string | null) {
  return useInfiniteQuery({
    queryKey: ['services', categoryId],
    queryFn: ({ pageParam = 1 }) =>
      fetchServicesByCategoryService(categoryId!, pageParam as number, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    enabled: !!categoryId,
  });
}

export function useProviderProfile(providerId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.providerProfile(providerId!),
    queryFn: () => fetchProviderProfileService(providerId!),
    enabled: !!providerId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useServiceReviews(serviceId: string | undefined) {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.serviceReviews(serviceId!),
    queryFn: ({ pageParam }) => fetchServiceReviewsService(serviceId!, pageParam),
    initialPageParam: 1,
    getNextPageParam: nextCollectionPage,
    enabled: !!serviceId,
  });
}

export function useFeaturedServices() {
  return useQuery({
    queryKey: QUERY_KEYS.featuredServices,
    queryFn: fetchFeaturedServices,
    staleTime: 15 * 60 * 1000,
  });
}

export function useMyServices() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.myServices,
    queryFn: ({ pageParam }) => getMyServices(pageParam),
    initialPageParam: 1,
    getNextPageParam: nextCollectionPage,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServicePayload) => createService(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myServices });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ServicePayload> }) =>
      updateService(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myServices });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.myServices });
    },
  });
}

export function useServicePosts(serviceId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.servicePosts(serviceId!),
    queryFn: () => fetchPostsByService(serviceId!),
    enabled: !!serviceId,
  });
}

export function useLikePost(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => likePost(postId),
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.servicePosts(serviceId) });
      const previous = qc.getQueryData(QUERY_KEYS.servicePosts(serviceId));
      qc.setQueryData(QUERY_KEYS.servicePosts(serviceId), (old: any[]) =>
        old?.map((p) => (p.id === postId ? { ...p, likes: (p.likes ?? 0) + 1 } : p)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(QUERY_KEYS.servicePosts(serviceId), ctx?.previous);
    },
    onSuccess: (result, postId) => {
      // Sincronizar con el valor real del servidor
      qc.setQueryData(QUERY_KEYS.servicePosts(serviceId), (old: any[]) =>
        old?.map((p) => (p.id === postId ? { ...p, likes: result.likes } : p)),
      );
    },
  });
}
