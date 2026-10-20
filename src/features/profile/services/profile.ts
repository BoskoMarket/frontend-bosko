import api from "@/core/api/axiosinstance";
import { extensionForMime } from "@/core/media/imageMime";


export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    isPhoneVerified?: boolean;
    /** Proposed (BR05): how the account signs in. Absent => treated as 'password'. */
    authProvider?: 'password' | 'google';
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string | null;
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

/** Subir portada — el backend recorta a 3:1 y genera un JPEG. */
export interface BannerFile { uri: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' }

export async function uploadBanner(file: BannerFile): Promise<{ bannerUrl: string }> {
    const formData = new FormData();
    formData.append('banner', { uri: file.uri, type: file.mimeType, name: `banner.${extensionForMime(file.mimeType)}` } as any);

    const { data } = await api.post<{ bannerUrl: string }>("/users/me/banner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

/** Quitar portada — la respuesta del backend contiene `bannerUrl: null`. */
export async function removeBanner(): Promise<{ bannerUrl: null }> {
    await api.delete("/users/me/banner");
    // The server answers 200 { bannerUrl: null } (or an empty 204): the result is always null.
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

export interface DeleteAccountResult {
    /** ISO date when the deactivated account is purged. Absent on older backends. */
    deletionScheduledAt?: string;
}

/** Desactiva la cuenta con 30 días de gracia — DELETE /users/me (409 ACTIVE_ORDERS si hay órdenes activas) */
export type DeleteAccountCredentials = { password: string } | { googleIdToken: string };

export async function deleteAccountService(credentials: DeleteAccountCredentials): Promise<DeleteAccountResult> {
    const { data } = await api.delete<DeleteAccountResult | undefined>('/users/me', { data: credentials });
    return data ?? {};
}
