import { Id } from "./common";

export interface User {
  id: Id;
  name?: string;
  email: string;
  avatarUrl?: string;
  description?: string;
  phone?: string;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserDto {
  name?: string;
  avatarUrl?: string;
  description?: string;
  phone?: string;
  // TODO: confirmar con backend campos permitidos en actualización
}
