"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Header() {
  const handleLogout = () => {
    // Logout logic will be implemented when connecting backend
    console.log("Logout clicked");
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
    </header>
  );
}
