'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Music, Layout, Users, BarChart2, Play,
  ArrowRight, Clock, Sparkles, BookOpen, Zap } from 'lucide-react'

interface Stats {
  services: number; songs: number; decks: number; volunteers: number; nextService: any | null
}

function StatCard({ label, value, icon: Icon, href, color }: any) {
  return (
    <Link href={href} className="glass p-4 flex items-center gap-4 hover:border-[#3a3d48] transition-colors group">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{background:`${color}20`}}>
        <Icon size={18} style={{color}}/>
      </div>
      <div className="flex-1">
        <div className="text-2xl font-serif" style={{color}}>{value}</div>
        <div className="text-xs text-[#555]">{label}</div>
      </div>
      <ArrowRight size={14} className="text-[#333] group-hover:text-[#666] transition-colors"/>
    </Link>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ services:0, songs:0, decks:0, volunteers:0, nextService:null })
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    Promise.all([
      fetch('/api/services').then(r=>r.json()),
      fetch('/api/songs').then(r=>r.json()),
      fetch('/api/slides').then(r=>r.json()),
      fetch('/api/volunteers').then(r=>r.json()),
    ]).then(([svcs, songs, decks, vols]) => {
      const upcoming = svcs
        .filter((s:any) => s.scheduled_at && new Date(s.scheduled_at) >= new Date())
        .sort((a:any,b:any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      setStats({
        services: svcs.length, songs: songs.length, decks: decks.length,
        volunteers: vols.length, nextService: upcoming[0] || null
      })
      setLoading(false)
    })
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const settings = JSON.parse(typeof window!=='undefined'?localStorage.getItem('churchos_settings')||'{}':'{}')
  const orgName = settings.name || 'ChurchOS'

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-[#e8d8b8] mb-1">{orgName}</h1>
            <div className="text-sm text-[#555]">
              {time.toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
              {' · '}
              <span className="font-mono">{time.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            System online
          </div>
        </div>
      </div>

      {/* Next service banner */}
      {stats.nextService && (
        <div className="glass p-4 mb-6 border-l-2 border-l-[#c8a96e] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest mb-1 flex items-center gap-1">
              <Clock size={9}/>Next Service
            </div>
            <div className="text-sm font-medium text-[#e8d8b8]">{stats.nextService.title}</div>
            <div className="text-xs text-[#666]">
              {new Date(stats.nextService.scheduled_at).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}
              {' · '}{stats.nextService.items?.length||0} items
            </div>
          </div>
          <Link href={`/dashboard/services/${stats.nextService.id}/live`}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors shrink-0">
            <Play size={12} fill="white"/>Go Live
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Services" value={stats.services} icon={Calendar} href="/dashboard/services" color="#c8a96e"/>
        <StatCard label="Songs" value={stats.songs} icon={Music} href="/dashboard/songs" color="#9e6ec8"/>
        <StatCard label="Slide Decks" value={stats.decks} icon={Layout} href="/dashboard/slides" color="#6e9ec8"/>
        <StatCard label="Volunteers" value={stats.volunteers} icon={Users} href="/dashboard/volunteers" color="#6ec89e"/>
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-xs text-[#555] uppercase tracking-widest mb-3">Quick Actions</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label:'New Service', href:'/dashboard/services/new', icon:Calendar, color:'#c8a96e' },
            { label:'Add Song', href:'/dashboard/songs', icon:Music, color:'#9e6ec8' },
            { label:'Bible Search', href:'/dashboard/bible', icon:BookOpen, color:'#6e9ec8' },
            { label:'AI Slides', href:'/dashboard/ai-slides', icon:Sparkles, color:'#c8a96e' },
            { label:'Automation', href:'/dashboard/automation', icon:Zap, color:'#6ec89e' },
            { label:'Analytics', href:'/dashboard/analytics', icon:BarChart2, color:'#e8a86e' },
          ].map(({label,href,icon:Icon,color})=>(
            <Link key={label} href={href}
              className="glass p-3 flex items-center gap-2 hover:border-[#3a3d48] transition-colors group">
              <Icon size={14} style={{color}} className="shrink-0"/>
              <span className="text-xs text-[#888] group-hover:text-[#e8d8b8] transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
