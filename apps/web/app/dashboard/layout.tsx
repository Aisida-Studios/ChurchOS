import Link from 'next/link'
import { AICommandBar } from '@/components/ai/AICommandBar'
import { 
  LayoutDashboard, Music, Layout, BookOpen, Image,
  Settings, BarChart2, Calendar, Monitor, Users, Palette, Zap, Sparkles,
  Radio, Link2, Download
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/services', label: 'Services', icon: Calendar },
  { href: '/dashboard/songs', label: 'Songs', icon: Music },
  { href: '/dashboard/slides', label: 'Slides', icon: Layout },
  { href: '/dashboard/bible', label: 'Bible', icon: BookOpen },
  { href: '/dashboard/media', label: 'Media', icon: Image },
  { href: '/dashboard/output', label: 'Output', icon: Monitor },
  { href: '/dashboard/design', label: 'Design', icon: Palette },
  { href: '/dashboard/volunteers', label: 'Volunteers', icon: Users },
  { href: '/dashboard/automation', label: 'Automation', icon: Zap },
  { href: '/dashboard/ai-slides', label: 'AI Slides', icon: Sparkles },
  { href: '/dashboard/livestream', label: 'Livestream', icon: Radio },
  { href: '/dashboard/congregation', label: 'Congregation', icon: Users },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Link2 },
  { href: '/dashboard/backgrounds', label: 'Backgrounds', icon: Image },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0d0f14]">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 bg-[#1a1c24] border-r border-[#2a2d38] flex flex-col">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-[#2a2d38]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c8a96e] to-[#9e6ec8] flex items-center justify-center text-[#0d0f14] font-bold text-sm">
              ✝
            </div>
            <div>
              <div className="text-sm font-bold text-[#e8d8b8] tracking-wide">ChurchOS</div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest">Production</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#888] hover:text-[#e8d8b8] hover:bg-white/5 transition-colors group"
            >
              <Icon size={15} className="group-hover:text-[#c8a96e] transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#2a2d38] text-[10px] text-[#444]">
          v0.1.0 — Alpha
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <AICommandBar />
    </div>
  )
}
