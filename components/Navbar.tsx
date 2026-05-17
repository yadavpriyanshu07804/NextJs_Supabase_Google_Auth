'use client';

import Link from "next/link";
import { Container } from "./Container";
import { Presentation, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LoginButton } from "./login-button";
import { LogoutButton } from "./logout-button";

export function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <Presentation size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              QuickPPT <span className="text-indigo-400 font-normal">AI</span>
            </h1>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6">
            {!loading && user && (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  App
                </Link>
                <Link href="/history" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  History
                </Link>
              </>
            )}
            <div className="hidden min-[450px]:flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800 font-semibold truncate max-w-[120px] sm:max-w-none">
              <ShieldCheck size={12} className={user ? "text-indigo-400 shrink-0" : "text-yellow-400 shrink-0"} />
              <span className="truncate">{user ? "Authenticated" : "Public Access"}</span>
            </div>
            
            <div className="flex items-center ml-2">
              {!loading && (
                user ? (
                  <LogoutButton />
                ) : (
                  <LoginButton />
                )
              )}
            </div>
          </nav>
        </div>
      </Container>
    </header>
  );
}
