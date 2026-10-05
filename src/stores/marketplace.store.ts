import { create } from 'zustand';

interface MarketplaceUIState {
  selectedCategoryId: string | null;
  activeFilters: Record<string, any>;
  searchQuery: string;
  debouncedQuery: string;

  setCategory: (id: string | null) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setSearchQuery: (q: string) => void;
  setDebouncedQuery: (q: string) => void;
}

export const useMarketplaceStore = create<MarketplaceUIState>((set) => ({
  selectedCategoryId: null,
  activeFilters: {},
  searchQuery: '',
  debouncedQuery: '',

  setCategory: (selectedCategoryId) => set({ selectedCategoryId }),
  setFilter: (key, value) =>
    set((state) => ({ activeFilters: { ...state.activeFilters, [key]: value } })),
  clearFilters: () => set({ activeFilters: {}, selectedCategoryId: null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setDebouncedQuery: (debouncedQuery) => set({ debouncedQuery }),
}));

export const useSelectedCategory = () => useMarketplaceStore((s) => s.selectedCategoryId);
export const useActiveFilters = () => useMarketplaceStore((s) => s.activeFilters);
