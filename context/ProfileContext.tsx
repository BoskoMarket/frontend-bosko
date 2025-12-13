import React, { createContext, useContext, useState, useEffect } from "react";
import {
    getCurrentUserProfile,
    updateUserProfile,
    UserProfile,
    UpdateProfilePayload,
} from "@/services/profile";
import { useAuth } from "./AuthContext";

interface ProfileContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
    updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
    clearError: () => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error("useProfile must be used within a ProfileProvider");
    }
    return context;
};

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
    const { authState } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshProfile = async () => {
        if (!authState.token) {
            console.log("No token available, skipping profile fetch");
            return;
        }

        console.log("Starting profile fetch...");
        setIsLoading(true);
        setError(null);

        try {
            const data = await getCurrentUserProfile();
            console.log("Profile fetched successfully:", data);

            setProfile(data);
        } catch (err: any) {
            const message = err?.response?.data?.message || "Error al cargar el perfil";
            setError(message);
            console.error("Error loading profile:", {
                message,
                status: err?.response?.status,
                data: err?.response?.data,
                error: err
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (payload: UpdateProfilePayload) => {
        setIsLoading(true);
        setError(null);

        try {
            const updatedProfile = await updateUserProfile(payload);
            setProfile(updatedProfile);
        } catch (err: any) {
            const message = err?.response?.data?.message || "Error al actualizar el perfil";
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const clearError = () => setError(null);

    // Load profile when user is authenticated
    useEffect(() => {
        console.log("Auth token changed:", authState.token ? "Token present" : "No token");
        if (authState.token) {
            refreshProfile();
        } else {
            console.log("Clearing profile - no token");
            setProfile(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authState.token]);

    return (
        <ProfileContext.Provider
            value={{
                profile,
                isLoading,
                error,
                refreshProfile,
                updateProfile,
                clearError,
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
};
