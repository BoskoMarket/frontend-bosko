import React, { createContext, useContext, useState, ReactNode } from "react";
import { fetchUsers, fetchUserById, updateUser, User } from "../services/users";

/**
 * UserContext
 *
 * Provides functions and state for interacting with user entities.
 * Exposes helpers to fetch a list of users (useful for chats or
 * assignment screens) and to update the current user's profile.
 */

interface UsersState {
  users: User[];
  loading: boolean;
  loadUsers: (filters?: Record<string, any>) => Promise<void>;
  getUser: (id: string) => Promise<User | undefined>;
  updateCurrentUser: (id: string, updates: Partial<User>) => Promise<User>;
}

const UserContext = createContext<UsersState | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadUsers = async (filters?: Record<string, any>) => {
    setLoading(true);
    try {
      const data = await fetchUsers(filters);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const getUser = async (id: string) => {
    try {
      const user = await fetchUserById(id);
      return user;
    } catch (err) {
      console.error("Failed to fetch user", err);
      return undefined;
    }
  };

  const updateCurrentUser = async (id: string, updates: Partial<User>) => {
    const updated = await updateUser(id, updates);
    // Optionally update the local users array if the updated user is
    // currently in the list
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    return updated;
  };

  const value: UsersState = {
    users,
    loading,
    loadUsers,
    getUser,
    updateCurrentUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
};
