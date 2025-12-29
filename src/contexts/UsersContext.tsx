import React, { createContext, useCallback, useContext, useState } from "react";
import { extractApiError } from "../lib/errors";
import { Id } from "../interfaces/common";
import { UpdateUserDto, User } from "../interfaces/user";
import {
  deleteUser as deleteUserApi,
  getUser as getUserApi,
  listUserReviewsReceived,
  listUserReviewsWritten,
  listUsers,
  updateUser as updateUserApi,
} from "../services/users.service";

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  loadUsers: (filters?: Record<string, any>) => Promise<void>;
  getUser: (id: Id) => Promise<User | null>;
  updateUser: (id: Id, payload: UpdateUserDto) => Promise<User | null>;
  removeUser: (id: Id) => Promise<void>;
  loadUserReviewsWritten: (id: Id) => Promise<any>;
  loadUserReviewsReceived: (id: Id) => Promise<any>;
}

const UsersContext = createContext<UsersState | undefined>(undefined);

export const UsersProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async (filters?: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers(filters);
      setUsers(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const getUser = useCallback(async (id: Id) => {
    try {
      return await getUserApi(id);
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const updateUser = useCallback(async (id: Id, payload: UpdateUserDto) => {
    try {
      const updated = await updateUserApi(id, payload);
      setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
      return updated;
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const removeUser = useCallback(async (id: Id) => {
    try {
      await deleteUserApi(id);
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (err) {
      setError(extractApiError(err));
    }
  }, []);

  const loadUserReviewsWritten = useCallback(async (id: Id) => {
    try {
      return await listUserReviewsWritten(id);
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  const loadUserReviewsReceived = useCallback(async (id: Id) => {
    try {
      return await listUserReviewsReceived(id);
    } catch (err) {
      setError(extractApiError(err));
      return null;
    }
  }, []);

  return (
    <UsersContext.Provider
      value={{
        users,
        loading,
        error,
        loadUsers,
        getUser,
        updateUser,
        removeUser,
        loadUserReviewsWritten,
        loadUserReviewsReceived,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("useUsers debe usarse dentro de un UsersProvider");
  }
  return context;
};
