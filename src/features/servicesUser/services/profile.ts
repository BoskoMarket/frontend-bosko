import api from "@/core/api/axiosinstance";


export interface UserProfile {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    location?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateProfilePayload {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    location?: string;
}

/**
 * Get current user profile
 * GET /auth/me
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
    console.log("🌐 [ProfileService] Fetching current user profile from /auth/me");
    try {
        const { data } = await api.get<UserProfile>("/auth/me");
        console.log("✅ [ProfileService] Profile fetched successfully:", data);
        return data;
    } catch (error: any) {
        console.error("❌ [ProfileService] Error fetching profile:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        throw error;
    }
}

/**
 * Update current user profile
 * PUT /user
 */
export async function updateUserProfile(
    payload: UpdateProfilePayload
): Promise<UserProfile> {
    const { data } = await api.put<UserProfile>("/user", payload);
    return data;
}

/**
 * Upload user avatar
 * POST /user/avatar
 */
export async function uploadAvatar(file: FormData): Promise<{ avatarUrl: string }> {
    const { data } = await api.post<{ avatarUrl: string }>("/user/avatar", file, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return data;
}
