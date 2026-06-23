'use client'
import { useEffect, useState } from 'react'
import { BarChart2, Calendar, Music, Layout, TrendingUp, Clock, BookOpen } from 'lucide-react'

interface Stats {
  services: number; songs: number; slides: number; volunteers: number
  recentServices: any[]; songHistory: any[]; topSongs: Record<string,number>
}

function Bar({ value, max, color='#c8a96e' }: { value: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#1a1c24] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width:`${max?Math.round(value/max*100):0}%`, background: color }}/>
      </div>
      <span className="text-xs text-[#666] w-6 text-right">{value}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({
    services:0, songs:0, slides:0, volunteers:0,
    recentServices:[], songHistory:[], topSongs:{}
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/services').then(r=>r.json()),
      fetch('/api/songs').then(r=>r.json()),
      fetch('/api/slides').then(r=>r.json()),
      fetch('/api/volunteers').then(r=>r.json()),
      fetch('/api/song-history').then(r=>r.json()),
    ]).then(([svcs, songs, slides, vols, history]) => {
      const topSongs: Record<string,number> = {}
      history.forEach((h:any) => { topSongs[h.service_title||h.song_id] = (topSongs[h.service_title||h.song_id]||0)+1 })
      const songCounts: Record<string,{title:string,count:number}> = {}
      history.forEach((h:any) => {
        const song = songs.find((s:any)=>s.id===h.song_id)
        const title = song?.title || h.song_id
        songCounts[h.song_id] = { title, count: (songCounts[h.song_id]?.count||0)+1 }
      })
      setStats({
        services: svcs.length, songs: songs.length, slides: slides.length, volunteers: vols.length,
        recentServices: svcs.slice(0,5), songHistory: history.slice(0,20),
        topSongs: Object.fromEntries(Object.entries(songCounts).map(([k,v])=>[v.title,(v as any).count]))
      })
      setLoading(false)
    })
  }, [])

  const statCards = [
    { label:'Services', value:stats.services, icon:Calendar, color:'#c8a96e' },
    { label:'Songs', value:stats.songs, icon:Music, color:'#9e6ec8' },
    { label:'Slide Decks', value:stats.slides, icon:Layout, color:'#6e9ec8' },
    { label:'Volunteers', value:stats.volunteers, icon:BarChart2, color:'#6ec89e' },
  ]

  const topSongEntries = Object.entries(stats.topSongs).sort((a,b)=>b[1]-a[1]).slice(0,8)
  const maxCount = topSongEntries[0]?.[1] || 1

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 size={18} className="text-[#c8a96e]"/>
        <h1 className="text-xl font-serif text-[#e8d8b8]">Analytics</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }}/>
              <span className="text-xs text-[#666]">{label}</span>
            </div>
            <div className="text-2xl font-serif" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Top songs */}
        <div className="glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-[#c8a96e]"/>
            <h2 className="text-xs text-[#666] uppercase tracking-widest">Most Used Songs</h2>
          </div>
          {topSongEntries.length === 0 ? (
            <div className="text-xs text-[#444]">No song history yet. Songs are logged when services go live.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topSongEntries.map(([title, count]) => (
                <div key={title}>
                  <div className="text-xs text-[#e8d8b8] mb-1 truncate">{title}</div>
                  <Bar value={count} max={maxCount}/>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent services */}
        <div className="glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} className="text-[#c8a96e]"/>
            <h2 className="text-xs text-[#666] uppercase tracking-widest">Recent Services</h2>
          </div>
          {stats.recentServices.length === 0 ? (
            <div className="text-xs text-[#444]">No services yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.recentServices.map(s => (
                <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-[#1a1c24] last:border-0">
                  <div className="flex-1">
                    <div className="text-xs text-[#e8d8b8] truncate">{s.title}</div>
                    <div className="text-[10px] text-[#444]">
                      {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'No date'}
                      {' · '}{s.items?.length||0} items
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${
                    s.status==='live' ? 'border-red-700 text-red-400' : 'border-[#2a2d38] text-[#555]'
                  }`}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Song history feed */}
        <div className="glass p-4 col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={13} className="text-[#c8a96e]"/>
            <h2 className="text-xs text-[#666] uppercase tracking-widest">Song Usage History</h2>
          </div>
          {stats.songHistory.length === 0 ? (
            <div className="text-xs text-[#444]">Song history will appear here once services go live.</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {stats.songHistory.map((h:any) => (
                <div key={h.id} className="flex items-center gap-2 py-1 border-b border-[#1a1c24]">
                  <Music size={10} className="text-[#c8a96e] shrink-0"/>
                  <span className="text-xs text-[#888] truncate flex-1">{h.service_title}</span>
                  <span className="text-[10px] text-[#444]">{new Date(h.used_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
