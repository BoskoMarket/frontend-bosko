
import { Id } from "../interfaces/common";
import { Category, UpdateCategoryDto } from "../interfaces/category";
import api from "@/core/api/axiosinstance";

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function getCategory(id: Id): Promise<Category> {
  const { data } = await api.get<Category>(`/categories/${id}`);
  return data;
}

export async function updateCategory(
  id: Id,
  payload: UpdateCategoryDto
): Promise<Category> {
  const { data } = await api.patch<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: Id): Promise<void> {
  await api.delete(`/categories/${id}`);
}
