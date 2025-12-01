import http from "../lib/http";
import { Id } from "../interfaces/common";
import { Category, UpdateCategoryDto } from "../interfaces/category";

export async function listCategories(): Promise<Category[]> {
  const { data } = await http.get<Category[]>("/categories");
  return data;
}

export async function getCategory(id: Id): Promise<Category> {
  const { data } = await http.get<Category>(`/categories/${id}`);
  return data;
}

export async function updateCategory(
  id: Id,
  payload: UpdateCategoryDto
): Promise<Category> {
  const { data } = await http.patch<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: Id): Promise<void> {
  await http.delete(`/categories/${id}`);
}
