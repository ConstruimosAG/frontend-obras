"use client";

// Logic to sign out
// 1. Delete the cookie "token"
// 2. Redirect to https://www.construimosagsas.com/

export function logout() {
  // Delete the cookie by setting it to expire in the past
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
  
  // Redirect
  window.location.href = "https://www.construimosagsas.com/";
}
