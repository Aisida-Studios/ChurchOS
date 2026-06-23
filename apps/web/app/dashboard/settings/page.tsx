'use client'
import { useState, useEffect } from 'react'
import { Settings, Save, Loader2, Download, Upload, Shield, Building2,
  Clock, Globe, FileText, AlertTriangle, Check } from 'lucide-react'

const TIMEZONES = [
  'Europe/London','Europe/Paris','Europe/Berlin','America/New_York',
  'America/Chicago','America/Denver','America/Los_Angeles','America/Toronto',
  'Australia/Sydney','Australia/Melbourne','Asia/Singapore','Asia/Tokyo',
  'Africa/Johannesburg','America/Sao_Paulo',
]

const ROLES = [
  { id: 'admin', label: 'Admin', desc: 'Full access to everything', color: '#c8a96e' },
  { id: 'operator', label: 'Operator', desc: 'Run live services, edit content', color: '#6e9ec8' },
  { id: 'editor', label: 'Editor', desc: 'Create and edit content, no live control', color: '#9e6ec8' },
  { id: 'viewer', label: 'Viewer', desc: 'View only', color: '#6ec89e' },
]

interface OrgSettings {
  name: string; timezone: string; campuses: {id:string,name:string,location:string}[]
  defaultTranslation: string; autoBackup: boolean; backupInterval: number
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'general'|'campuses'|'permissions'|'backup'|'audit'>('general')
  const [settings, setSettings] = useState<OrgSettings>({
    name: 'My Church', timezone: 'Europe/London', campuses: [],
    defaultTranslation: 'NKJV', autoBackup: false, backupInterval: 7
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [newCampus, setNewCampus] = useState({ name:'', location:'' })

  useEffect(() => {
    const stored = localStorage.getItem('churchos_settings')
    if (stored) setSettings(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (tab === 'audit') {
      setAuditLoading(true)
      fetch('/api/audit').then(r=>r.json()).then(d=>{ setAuditLog(d); setAuditLoading(false) })
    }
  }, [tab])

  const save = async () => {
    setSaving(true)
    localStorage.setItem('churchos_settings', JSON.stringify(settings))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const downloadBackup = async () => {
    setBackupLoading(true)
    const r = await fetch('/api/backup')
    const blob = await r.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `churchos-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(url)
    setBackupLoading(false)
  }

  const restoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setRestoreLoading(true)
    const text = await file.text()
    const backup = JSON.parse(text)
    await fetch('/api/backup', {
      method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(backup)
    })
    setRestoreLoading(false)
    alert('Restore complete. Refresh the page to see your data.')
  }

  const addCampus = () => {
    if (!newCampus.name) return
    setSettings(s => ({
      ...s, campuses: [...s.campuses, { id: Math.random().toString(36).slice(2), ...newCampus }]
    }))
    setNewCampus({ name:'', location:'' })
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={18} className="text-[#c8a96e]"/>
        <h1 className="text-xl font-serif text-[#e8d8b8]">Settings</h1>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[#2a2d38] flex-wrap">
        {([
          {id:'general',label:'General',icon:Globe},
          {id:'campuses',label:'Campuses',icon:Building2},
          {id:'permissions',label:'Permissions',icon:Shield},
          {id:'backup',label:'Backup',icon:Download},
          {id:'audit',label:'Audit Log',icon:FileText},
        ] as const).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${tab===t.id?'border-[#c8a96e] text-[#c8a96e]':'border-transparent text-[#666] hover:text-[#888]'}`}>
            <t.icon size={13}/>{t.label}
          </button>
        ))}
      </div>

      {/* ── GENERAL ── */}
      {tab==='general' && (
        <div className="flex flex-col gap-4">
          <div className="glass p-4">
            <h3 className="text-xs text-[#666] uppercase tracking-widest mb-4">Organisation</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[#666] block mb-1">Church / Organisation Name</label>
                <input value={settings.name} onChange={e=>setSettings(s=>({...s,name:e.target.value}))}
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]"/>
              </div>
              <div>
                <label className="text-xs text-[#666] block mb-1">Timezone</label>
                <select value={settings.timezone} onChange={e=>setSettings(s=>({...s,timezone:e.target.value}))}
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]">
                  {TIMEZONES.map(tz=><option key={tz} value={tz}>{tz.replace('_',' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#666] block mb-1">Default Bible Translation</label>
                <select value={settings.defaultTranslation} onChange={e=>setSettings(s=>({...s,defaultTranslation:e.target.value}))}
                  className="w-full bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]">
                  {['NKJV','KJV','NLT','MSG'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center justify-center gap-2 py-2.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm font-medium hover:bg-[#d8b97e] transition-colors disabled:opacity-50 w-40">
            {saving?<Loader2 size={13} className="animate-spin"/>:saved?<Check size={13}/>:<Save size={13}/>}
            {saving?'Saving…':saved?'Saved!':'Save Settings'}
          </button>
        </div>
      )}

      {/* ── CAMPUSES ── */}
      {tab==='campuses' && (
        <div className="flex flex-col gap-4">
          <div className="glass p-4">
            <h3 className="text-xs text-[#666] uppercase tracking-widest mb-4">Campuses / Locations</h3>
            {settings.campuses.length===0 ? (
              <div className="text-sm text-[#444] mb-4">No additional campuses. ChurchOS supports multiple campuses sharing the same song and slide library.</div>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {settings.campuses.map((c,i)=>(
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-[#0d0f14] rounded-lg border border-[#1a1c24]">
                    <Building2 size={13} className="text-[#c8a96e] shrink-0"/>
                    <div className="flex-1">
                      <div className="text-sm text-[#e8d8b8]">{c.name}</div>
                      {c.location && <div className="text-xs text-[#555]">{c.location}</div>}
                    </div>
                    <button onClick={()=>setSettings(s=>({...s,campuses:s.campuses.filter((_,j)=>j!==i)}))}
                      className="text-[#444] hover:text-red-400 transition-colors text-xs">Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={newCampus.name} onChange={e=>setNewCampus(n=>({...n,name:e.target.value}))}
                placeholder="Campus name" className="flex-1 bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]"/>
              <input value={newCampus.location} onChange={e=>setNewCampus(n=>({...n,location:e.target.value}))}
                placeholder="Location (optional)" className="flex-1 bg-[#0d0f14] border border-[#2a2d38] rounded px-3 py-2 text-sm text-[#e8d8b8] outline-none focus:border-[#c8a96e]"/>
              <button onClick={addCampus} className="px-4 py-2 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm hover:bg-[#d8b97e] transition-colors">Add</button>
            </div>
          </div>
          <button onClick={save} className="flex items-center gap-2 py-2.5 px-5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm font-medium hover:bg-[#d8b97e] transition-colors w-fit">
            <Save size={13}/>Save
          </button>
        </div>
      )}

      {/* ── PERMISSIONS ── */}
      {tab==='permissions' && (
        <div className="flex flex-col gap-4">
          <div className="glass p-4">
            <h3 className="text-xs text-[#666] uppercase tracking-widest mb-4">Role Definitions</h3>
            <div className="flex flex-col gap-3">
              {ROLES.map(role=>(
                <div key={role.id} className="flex items-start gap-3 p-3 bg-[#0d0f14] rounded-lg border border-[#1a1c24]">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{background:role.color}}/>
                  <div>
                    <div className="text-sm font-medium text-[#e8d8b8]">{role.label}</div>
                    <div className="text-xs text-[#555]">{role.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-[#0d0f14] rounded-lg border border-[#1a1c24] text-xs text-[#555]">
              <AlertTriangle size={11} className="inline mr-1.5 text-yellow-600"/>
              ChurchOS currently runs in single-user mode. Multi-user authentication with role enforcement is on the roadmap. For now, all local users have admin access.
            </div>
          </div>
        </div>
      )}

      {/* ── BACKUP ── */}
      {tab==='backup' && (
        <div className="flex flex-col gap-4">
          <div className="glass p-4">
            <h3 className="text-xs text-[#666] uppercase tracking-widest mb-4">Export Backup</h3>
            <p className="text-sm text-[#666] mb-4">Download a complete JSON backup of all your songs, services, slides, and settings.</p>
            <button onClick={downloadBackup} disabled={backupLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm font-medium hover:bg-[#d8b97e] transition-colors disabled:opacity-50">
              {backupLoading?<Loader2 size={13} className="animate-spin"/>:<Download size={13}/>}
              {backupLoading?'Preparing…':'Download Backup'}
            </button>
          </div>

          <div className="glass p-4">
            <h3 className="text-xs text-[#666] uppercase tracking-widest mb-4">Restore from Backup</h3>
            <p className="text-sm text-[#666] mb-4">Restore data from a previously exported JSON backup file. This will merge data, not overwrite.</p>
            <label className={`flex items-center gap-2 px-4 py-2.5 border border-[#2a2d38] text-[#666] rounded-lg text-sm cursor-pointer hover:border-[#3a3d48] hover:text-[#888] transition-colors w-fit ${restoreLoading?'opacity-50 pointer-events-none':''}`}>
              {restoreLoading?<Loader2 size={13} className="animate-spin"/>:<Upload size={13}/>}
              {restoreLoading?'Restoring…':'Choose Backup File'}
              <input type="file" accept=".json" className="hidden" onChange={restoreBackup}/>
            </label>
          </div>

          <div className="glass p-4">
            <h3 className="text-xs text-[#666] uppercase tracking-widest mb-3">Auto-backup</h3>
            <div className="flex items-center gap-3 mb-3">
              <button onClick={()=>setSettings(s=>({...s,autoBackup:!s.autoBackup}))}
                className={`relative w-9 h-5 rounded-full transition-colors ${settings.autoBackup?'bg-green-600':'bg-[#2a2d38]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.autoBackup?'left-4':'left-0.5'}`}/>
              </button>
              <span className="text-sm text-[#666]">Auto-backup every {settings.backupInterval} days</span>
            </div>
            {settings.autoBackup && (
              <input type="range" min={1} max={30} value={settings.backupInterval}
                onChange={e=>setSettings(s=>({...s,backupInterval:Number(e.target.value)}))}
                className="w-full"/>
            )}
            <button onClick={save} className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#c8a96e] text-[#0d0f14] rounded-lg text-sm hover:bg-[#d8b97e] transition-colors">
              <Save size={13}/>Save
            </button>
          </div>
        </div>
      )}

      {/* ── AUDIT LOG ── */}
      {tab==='audit' && (
        <div className="glass p-4">
          <h3 className="text-xs text-[#666] uppercase tracking-widest mb-4">Activity Log</h3>
          {auditLoading ? (
            <div className="flex items-center gap-2 text-[#555] py-8 justify-center"><Loader2 size={14} className="animate-spin"/></div>
          ) : auditLog.length===0 ? (
            <div className="text-sm text-[#444] text-center py-8">No activity logged yet. Actions will appear here as you use the app.</div>
          ) : (
            <div className="flex flex-col">
              {auditLog.map(entry=>(
                <div key={entry.id} className="flex items-center gap-3 py-2.5 border-b border-[#1a1c24] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c8a96e] shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#e8d8b8]">
                      <span className="text-[#c8a96e]">{entry.action}</span>
                      {' on '}<span className="text-[#888]">{entry.entity}</span>
                    </div>
                    {entry.detail && entry.detail!=='{}' && (
                      <div className="text-[10px] text-[#555] truncate">{entry.entity_id}</div>
                    )}
                  </div>
                  <div className="text-[10px] text-[#444] shrink-0">
                    {new Date(entry.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
