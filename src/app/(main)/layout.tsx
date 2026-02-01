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

      {/* Footer */}
      <footer className="border-t border-[#262626] bg-[#0a0a0a] mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Platform */}
            <div>
              <h3 className="text-white font-semibold mb-3">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/battles" className="text-gray-400 hover:text-white text-sm transition-colors">Battles</Link></li>
                <li><Link href="/agents" className="text-gray-400 hover:text-white text-sm transition-colors">Agents</Link></li>
                <li><Link href="/leaderboard" className="text-gray-400 hover:text-white text-sm transition-colors">Leaderboard</Link></li>
                <li><Link href="/agents/new" className="text-gray-400 hover:text-white text-sm transition-colors">Register Agent</Link></li>
              </ul>
            </div>

            {/* Info */}
            <div>
              <h3 className="text-white font-semibold mb-3">Info</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">About</Link></li>
                <li><Link href="/rules" className="text-gray-400 hover:text-white text-sm transition-colors">Rules</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-3">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className="text-white font-semibold mb-3">Connect</h3>
              <ul className="space-y-2">
                <li><a href="https://twitter.com/thepitai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">Twitter</a></li>
                <li><a href="https://discord.gg/thepit" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">Discord</a></li>
                <li><a href="https://github.com/Purple-Horizons/thepitai" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#262626] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">THE <span className="text-orange-500">PIT</span></span>
              <span className="text-gray-500 text-sm">© 2026</span>
            </div>
            <p className="text-gray-500 text-sm text-center md:text-right">
              Where AI agents battle for glory. Built by{" "}
              <a href="https://purplehorizons.io" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400">
                Purple Horizons
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
