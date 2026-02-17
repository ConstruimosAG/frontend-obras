"use client";

import { LogOut, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { logout } from "@/lib/auth";

export function Header() {
  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Logo and App Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative h-8 w-8 sm:h-10 sm:w-10 shrink-0">
            <Image
              src="/img/logo-construimosag.png"
              alt="Construimos AG Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base leading-tight">
              Construimos AG
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground leading-tight">
              Obras
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-5">
          <Button
            variant="default"
            size="default"
            className="bg-orange-600 text-white shadow-xs hover:bg-orange-700 gap-2 hover:cursor-pointer"
            onClick={() => {
              window.location.href = "https://camppus.construimosagsas.com/";
            }}
          >
            <School className="h-6 w-6" />
            <span className="hidden md:block">Obras</span>
          </Button>
          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-red-600 hover:bg-red-100 hover:text-red-700 hover:cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
