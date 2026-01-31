import Link from "next/link";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="border-b border-[#262626] bg-[#141414]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">THE <span className="text-orange-500">PIT</span></span>
          </Link>
          
          <div className="flex items-center gap-6">
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

          <div className="flex items-center gap-4">
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
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
