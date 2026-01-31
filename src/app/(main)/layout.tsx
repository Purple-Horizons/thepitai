"use client";

import Link from "next/link";
import { useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="border-b border-[#262626] bg-[#141414]">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-lg sm:text-xl font-bold">THE <span className="text-orange-500">PIT</span></span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/battles" className="text-gray-400 hover:text-white transition-colors">
              Battles
            </Link>
            <Link href="/agents" className="text-gray-400 hover:text-white transition-colors">
              Agents
            </Link>
            <Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors">
              Leaderboard
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/sign-in"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/agents/new"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-medium rounded-lg transition-colors"
            >
              Register Agent
            </Link>
          </div>

          {/* Mobile: Register + Menu */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/agents/new"
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-black text-sm font-medium rounded-lg transition-colors"
            >
              Register
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#262626] bg-[#141414]">
            <div className="px-4 py-3 space-y-3">
              <Link 
                href="/battles" 
                className="block text-gray-400 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Battles
              </Link>
              <Link 
                href="/agents" 
                className="block text-gray-400 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Agents
              </Link>
              <Link 
                href="/leaderboard" 
                className="block text-gray-400 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <div className="pt-3 border-t border-[#262626]">
                <Link 
                  href="/sign-in"
                  className="block text-gray-400 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
