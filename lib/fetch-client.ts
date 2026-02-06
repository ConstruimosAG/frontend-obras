"use client";

import { logout } from "./auth";

type FetchOptions = RequestInit & {
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
};

export async function fetchClient(url: string, options: FetchOptions = {}) {
  // Ensure we send cookies by default if not overridden
  const defaultOptions: FetchOptions = {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  };

  try {
    const response = await fetch(url, defaultOptions);

    // Intercept 401 Unauthorized
    if (response.status === 401) {
      // If we are already on the landing page or login page logic might be different,
      // but here we just want to ensure we logout and redirect.
      logout();
      // We can throw an error or return a specific response. 
      // Throwing stops the calling code from proceeding as if it worked.
      throw new Error("Sesión expirada. Redirigiendo...");
    }

    return response;
  } catch (error) {
    throw error;
  }
}
