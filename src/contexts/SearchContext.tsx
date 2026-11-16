import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/core/query/queryKeys';
import { getLoadErrorMessage } from '../lib/errors';
import type { SearchResponse } from '../interfaces/search';
import { search as searchApi } from '../features/search/services/search.service';

interface SearchState {
  lastQuery: string;
  results: SearchResponse | null;
  loading: boolean;
  error: string | null;
  runSearch: (query: string) => Promise<SearchResponse | null>;
}

export const SearchProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <>{children}</>
);

export const useSearch = (): SearchState => {
  const qc = useQueryClient();
  const [lastQuery, setLastQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);

  const runSearch = useCallback(async (query: string) => {
    setLastQuery(query);
    setLoading(true);
    setError(null);
    try {
      const data = await qc.fetchQuery({
        queryKey: QUERY_KEYS.search(query),
        queryFn: () => searchApi(query),
        staleTime: 5 * 60 * 1000,
      });
      setResults(data as SearchResponse);
      return data as SearchResponse;
    } catch (err) {
      setError(getLoadErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, [qc]);

  return { results, loading, error, lastQuery, runSearch };
};
