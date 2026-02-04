"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { User } from "@/lib/types";

export function useUsers() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    console.warn("NEXT_PUBLIC_BACKEND_URL no está definida");
  }

  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL es obligatoria");

      const res = await fetch(`${baseUrl}/api/users/me`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("No autenticado");
        }
        throw new Error(`Error fetching user: ${res.status}`);
      }

      type UserResponse = {
        success: boolean;
        data?: {
          user?: User;
        };
      };

      const payload: UserResponse = await res.json();
      const user = (payload as any)?.data?.user ?? (payload as any)?.user ?? payload?.data ?? null;
      setCurrentUser(user);
      return user;
    } catch (err: any) {
      console.error(err);
      const message = err?.message ?? "No se pudo cargar la información del usuario";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const getUserById = useCallback(
    async (id: number) => {
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL es obligatoria");

        const res = await fetch(`${baseUrl}/api/users/${id}`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`Error fetching user: ${res.status}`);

        type UserResponse = {
          success: boolean;
          data?: {
            user?: User;
          };
        };

        const json: UserResponse = await res.json();
        return (json as any)?.data?.user ?? (json as any)?.user ?? json?.data ?? json;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo cargar el usuario");
        throw err;
      }
    },
    [baseUrl],
  );

  const fetchUsers = useCallback(
    async () => {
      try {
        if (!baseUrl) throw new Error("NEXT_PUBLIC_BACKEND_URL es obligatoria");

        const res = await fetch(`${baseUrl}/api/users`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`Error fetching users: ${res.status}`);

        type UserResponse = {
          success: boolean;
          data?: {
            users?: User[];
          };
        };

        const json: UserResponse = await res.json();
        const incoming = (json as any)?.data?.users ?? (json as any)?.users ?? json?.data ?? json;
        setUsers(incoming);
        return incoming;
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "No se pudo cargar los usuarios");
        throw err;
      }
    },
    [baseUrl],
  );

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return {
    currentUser,
    users,
    setUsers,
    fetchUsers,
    setCurrentUser,
    loading,
    error,
    getCurrentUser,
    getUserById,
  };
}
