import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { extractApiError } from "../lib/errors";
import { Id } from "../interfaces/common";
import { Category } from "../interfaces/category";
import {
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../services/categories.service";

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  findCategory: (id: Id) => Category | undefined;
  refreshCategory: (id: Id) => Promise<Category | null>;
  editCategory: (id: Id, payload: Partial<Category>) => Promise<Category | null>;
  removeCategory: (id: Id) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesState | undefined>(undefined);

export const CategoriesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCategories();
      setCategories(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories().catch(() => {});
  }, [loadCategories]);

  const findCategory = useCallback(
    (id: Id) => categories.find((category) => category.id === id),
    [categories]
  );

  const refreshCategory = useCallback(async (id: Id) => {
    try {
      const data = await getCategory(id);
      setCategories((prev) => {
        const exists = prev.some((item) => item.id === id);
        if (exists) {
          return prev.map((item) => (item.id === id ? data : item));
        }
        return [...prev, data];
      });
      return data;
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const editCategory = useCallback(async (id: Id, payload: Partial<Category>) => {
    try {
      const updated = await updateCategory(id, payload);
      setCategories((prev) => prev.map((cat) => (cat.id === id ? updated : cat)));
      return updated;
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const removeCategory = useCallback(async (id: Id) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      setError(extractApiError(err));
    }
  }, []);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        loading,
        error,
        loadCategories,
        findCategory,
        refreshCategory,
        editCategory,
        removeCategory,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories debe usarse dentro de un CategoriesProvider");
  }
  return context;
};
