import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

const COOKIE_NAME = "token";
const LOGIN_PATH = "/";

const validRoles = [
  "admin",
  "contractor",
  "administrative_assistant",
  "management",
  "project_info",
] as const;

type Role = (typeof validRoles)[number];

const basePathMap: Record<Role, string> = {
  admin: "/admin",
  contractor: "/contractor",
  administrative_assistant: "/admin",
  management: "/management",
  project_info: "/coordinator",
};

const panelPathMap: Record<Role, string> = {
  admin: "/admin/",
  contractor: "/contractor",
  administrative_assistant: "/admin/",
  management: "/management/",
  project_info: "/coordinator/",
};

export function proxy(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const currentPath = nextUrl.pathname;
  const token = cookies.get(COOKIE_NAME)?.value;
  // --- Caso NO autenticado ---
  if (!token) {
    // deja pasar si estamos ya en `/`
    if (currentPath === LOGIN_PATH) return NextResponse.next();
    // si no, redirige a `/`
    const res = NextResponse.redirect(new URL(LOGIN_PATH, nextUrl));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // --- Token corrupto o sin rol válido ---
  let user: { role?: string };
  try {
    user = jwtDecode<{ role: string }>(token);
  } catch {
    if (currentPath === LOGIN_PATH) return NextResponse.next();
    const res = NextResponse.redirect(new URL(LOGIN_PATH, nextUrl));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
  const role = user.role as Role | undefined;
  if (!role || !validRoles.includes(role)) {
    if (currentPath === LOGIN_PATH) return NextResponse.next();
    const res = NextResponse.redirect(new URL(LOGIN_PATH, nextUrl));
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // --- Ya autenticado y en `/` → lo mando a su panel ---
  if (currentPath === LOGIN_PATH) {
    return NextResponse.redirect(new URL(panelPathMap[role], nextUrl));
  }
  // --- Protejo sólo rutas de cada rol ---
  const allowedBase = basePathMap[role];
  if (!currentPath.startsWith(allowedBase)) {
    return NextResponse.redirect(new URL(panelPathMap[role], nextUrl));
  }

  // --- Todo OK ---
  return NextResponse.next();
}

export const config = {
  matcher: [
    // ruta de login
    "/",
    // rutas de cada panel y subrutas
    "/admin/:path*",
    "/contractor/:path*",
    "/administrative-assistant/:path*",
    "/management/:path*",
    "/coordinator/:path*",
  ],
};
