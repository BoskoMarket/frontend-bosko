import React, { createContext, useCallback, useContext, useState } from "react";
import { extractApiError } from "../src/lib/errors";
import { SearchResponse } from "../src/interfaces/search";
import { search as searchApi } from "../src/services/search.service";

interface SearchState {
    lastQuery: string;
    results: SearchResponse | null;
    loading: boolean;
    error: string | null;
    runSearch: (query: string) => Promise<SearchResponse | null>;
}

const SearchContext = createContext<SearchState | undefined>(undefined);

export const SearchProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastQuery, setLastQuery] = useState("");

    const runSearch = useCallback(async (query: string) => {
        setLoading(true);
        setError(null);
        setLastQuery(query);
        try {
            const data = await searchApi(query);
            setResults(data);
            return data;
        } catch (err) {
            setError(extractApiError(err));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <SearchContext.Provider value={{ results, loading, error, lastQuery, runSearch }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error("useSearch debe usarse dentro de un SearchProvider");
    }
    return context;
};
