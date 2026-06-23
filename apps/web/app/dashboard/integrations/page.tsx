'use client'
import { useState } from 'react'
import { Link2, ExternalLink, CheckCircle, AlertCircle, Copy, Loader2 } from 'lucide-react'

const INTEGRATIONS = [
  {
    id: 'planning-center',
    name: 'Planning Center',
    logo: '📋',
    description: 'Import service plans, songs, and team schedules directly from Planning Center Online.',
    status: 'coming-soon',
    docs: 'https://developer.planning.center',
    setup: [
      'Get your Planning Center API key from planningcenter.com/integrations',
      'Add PLANNING_CENTER_APP_ID and PLANNING_CENTER_SECRET to .env.local',
      'Restart the server — services will sync automatically'
    ]
  },
  {
    id: 'ccli',
    name: 'CCLI / SongSelect',
    logo: '🎵',
    description: 'Import licensed songs from CCLI SongSelect into your song library with full lyrics and chord charts.',
    status: 'coming-soon',
    docs: 'https://songselect.ccli.com',
    setup: [
      'Requires CCLI SongSelect subscription',
      'Add CCLI_USERNAME and CCLI_PASSWORD to .env.local',
      'Songs import directly to your library with correct attribution'
    ]
  },
  {
    id: 'obs',
    name: 'OBS Studio',
    logo: '🎬',
    description: 'Connect ChurchOS output directly to OBS via WebSocket for scene switching and stream control.',
    status: 'available',
    docs: 'https://obsproject.com/wiki/obs-websocket-remote-control',
    setup: [
      'Install OBS Studio and enable WebSocket Server in Tools → WebSocket Server Settings',
      'Add OBS_WS_URL=ws://localhost:4455 and OBS_WS_PASSWORD=yourpassword to .env.local',
      'ChurchOS can then switch OBS scenes when service items change'
    ]
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    logo: '📁',
    description: 'Upload media directly to Google Drive and use Drive files in your services.',
    status: 'available',
    docs: 'https://developers.google.com/drive',
    setup: [
      'Create a Google Cloud project and enable Drive API',
      'Download credentials.json and place in apps/web/lib/',
      'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local'
    ]
  },
  {
    id: 'stream-deck',
    name: 'Elgato Stream Deck',
    logo: '🎛️',
    description: 'Control ChurchOS from a physical Stream Deck — next slide, blackout, go live with one button press.',
    status: 'available',
    docs: 'https://developer.elgato.com/documentation',
    setup: [
      'Install Stream Deck software and the "System: Website" action',
      'Point buttons to these URLs:',
      '  Next slide: GET /api/remote/next',
      '  Blank screen: GET /api/remote/blackout',
      '  Go live: GET /api/remote/live'
    ]
  },
  {
    id: 'midi',
    name: 'MIDI Control',
    logo: '🎹',
    description: 'Use a MIDI controller or footswitch to advance slides hands-free during worship.',
    status: 'coming-soon',
    docs: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API',
    setup: [
      'Connect MIDI device via USB',
      'Enable MIDI in browser (chrome://flags/#enable-web-midi)',
      'Map note/CC values to actions in Settings → MIDI'
    ]
  },
  {
    id: 'ndi',
    name: 'NDI Video',
    logo: '📡',
    description: 'Send ChurchOS output as an NDI video source for multi-camera setups.',
    status: 'coming-soon',
    docs: 'https://ndi.video',
    setup: [
      'Install NDI Tools',
      'Use NDI Screen Capture to capture the ChurchOS output window',
      'Native NDI output in a future update'
    ]
  },
]

const STATUS: Record<string,{label:string,color:string,icon:any}> = {
  'available': { label:'Available', color:'text-green-400', icon:CheckCircle },
  'coming-soon': { label:'Coming Soon', color:'text-[#555]', icon:AlertCircle },
  'connected': { label:'Connected', color:'text-[#c8a96e]', icon:CheckCircle },
}

export default function IntegrationsPage() {
  const [expanded, setExpanded] = useState<string|null>(null)
  const [copied, setCopied] = useState<string|null>(null)

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <Link2 size={18} className="text-[#c8a96e]"/>
        <h1 className="text-xl font-serif text-[#e8d8b8]">Integrations</h1>
      </div>
      <p className="text-sm text-[#555] mb-6">Connect ChurchOS to the tools your church already uses.</p>

      <div className="flex flex-col gap-3">
        {INTEGRATIONS.map(intg => {
          const status = STATUS[intg.status]
          const isOpen = expanded === intg.id
          return (
            <div key={intg.id} className="glass overflow-hidden">
              <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : intg.id)}>
                <div className="text-2xl w-10 text-center shrink-0">{intg.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#e8d8b8]">{intg.name}</span>
                    <span className={`text-xs flex items-center gap-1 ${status.color}`}>
                      <status.icon size={11}/>{status.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#555] truncate">{intg.description}</p>
                </div>
                <a href={intg.docs} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()}
                  className="p-1.5 text-[#444] hover:text-[#888] transition-colors shrink-0">
                  <ExternalLink size={12}/>
                </a>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-[#1a1c24] pt-3">
                  <p className="text-xs text-[#666] mb-3">{intg.description}</p>
                  <div className="text-[10px] text-[#555] uppercase tracking-widest mb-2">Setup Instructions</div>
                  <div className="flex flex-col gap-1.5">
                    {intg.setup.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#c8a96e] text-[10px] shrink-0 mt-0.5">{step.startsWith(' ')?'':i+1+'.'}</span>
                        <div className="flex-1">
                          {step.includes('.env.local') || step.includes('/api/') ? (
                            <div className="flex items-center gap-2">
                              <code className="text-[10px] bg-[#0d0f14] text-[#c8a96e] px-2 py-0.5 rounded border border-[#1a1c24] flex-1">{step}</code>
                              <button onClick={() => copyText(step, `${intg.id}-${i}`)}
                                className="text-[#444] hover:text-[#888] transition-colors shrink-0">
                                {copied===`${intg.id}-${i}` ? <CheckCircle size={10} className="text-green-400"/> : <Copy size={10}/>}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#666]">{step}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
