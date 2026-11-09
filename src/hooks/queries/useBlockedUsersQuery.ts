import { useInfiniteQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { flattenUniqueById, nextCollectionPage } from '@/core/api/collections';
import { fetchBlockedUsers, type BlockedUser } from '@/features/users/services/users';

export const BLOCKED_USERS_PAGE_SIZE = 20;

/** Users the current user blocked (Perfil > Usuarios bloqueados), paginated. */
export function useBlockedUsersQuery() {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.blockedUsers,
    queryFn: ({ pageParam }) => fetchBlockedUsers(pageParam, BLOCKED_USERS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: nextCollectionPage,
  });
}

export function flattenBlockedUsers(
  pages: Parameters<typeof flattenUniqueById<BlockedUser>>[0] | undefined,
): BlockedUser[] {
  return flattenUniqueById(pages ?? []);
}
