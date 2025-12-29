import { Id } from "./common";

export interface Category {
  id: Id;
  name: string;
  description?: string;
  icon?: string;
  accent?: string;
  video?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  icon?: string;
  accent?: string;
  // TODO: confirmar con backend si hay más campos configurables
}
