import api from "@/core/api/axiosinstance";


export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    isPhoneVerified?: boolean;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    location?: string;
    lat?: number;
    lng?: number;
    isVerified: boolean;
    backgroundCheckStatus?: string;
    role?: 'user' | 'admin';
    isProvider?: boolean;
    isAvailable?: boolean;
    createdAt: string;
    updatedAt: string;
}

// Solo los campos que acepta PATCH /users/me
export type UpdateProfilePayload = import('@/core/api/generated/schema').components['schemas']['UpdateProfileDto'] & { isAvailable?: boolean };

export async function getCurrentUserProfile(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>("/users/me");
    return data;
}

export async function updateUserProfile(
    payload: UpdateProfilePayload
): Promise<UserProfile> {
    const { firstName, lastName, phone, bio, isAvailable, lat, lng } = payload;
    const { data } = await api.patch<UserProfile>("/users/me", { firstName, lastName, phone, bio, isAvailable, lat, lng });
    return data;
}

export async function toggleAvailabilityService(isAvailable: boolean): Promise<UserProfile> {
    const { data } = await api.patch<UserProfile>("/users/me", { isAvailable });
    return data;
}

/** Subir avatar — POST /users/me/avatar */
export async function uploadAvatar(fileUri: string): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', { uri: fileUri, type: 'image/jpeg', name: 'avatar.jpg' } as any);

    const { data } = await api.post<{ avatarUrl: string }>("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

/**
 * Subir portada — POST /users/me/banner (multipart, campo `banner`).
 *
 * ENDPOINT PROPUESTO, pendiente de backend (ver `odd/backend-requests.md`, BR01).
 * Hasta que se despliegue responde 404/405/501 y la UI lo trata como "no disponible".
 */
export async function uploadBanner(fileUri: string): Promise<{ bannerUrl: string }> {
    const formData = new FormData();
    formData.append('banner', { uri: fileUri, type: 'image/jpeg', name: 'banner.jpg' } as any);

    const { data } = await api.post<{ bannerUrl: string }>("/users/me/banner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

/**
 * Quitar portada — DELETE /users/me/banner (deja `bannerUrl = null`).
 *
 * ENDPOINT PROPUESTO, pendiente de backend (BR01). Acepta `{ bannerUrl: null }` o 204.
 */
export async function removeBanner(): Promise<{ bannerUrl: null }> {
    await api.delete("/users/me/banner");
    return { bannerUrl: null };
}

/** Obtener estadísticas del perfil — GET /users/me/stats */
export interface UserStats {
    servicesCount: number;
    reviewsCount: number;
    averageRating: number;
    completedOrders: number;
}

export async function getUserStats(): Promise<UserStats> {
    const { data } = await api.get<UserStats>("/users/me/stats");
    return data;
}

export async function verifyPhoneWithFirebase(firebaseIdToken: string): Promise<void> {
    await api.post('/users/me/verify-phone', { firebaseIdToken });
}

/** Eliminar cuenta — DELETE /users/me */
export async function deleteAccountService(password: string): Promise<void> {
    await api.delete('/users/me', { data: { password } });
}
