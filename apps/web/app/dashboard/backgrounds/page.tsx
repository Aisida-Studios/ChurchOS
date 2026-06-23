'use client'
import { useState, useRef } from 'react'
import { Image, Film, Plus, Upload, Sparkles, Loader2, Play, X } from 'lucide-react'

const MOTION_PRESETS = [
  { id:'particles-gold', name:'Gold Particles', type:'motion', animation:'particles', color:'#0a0c14', particleColor:'#c8a96e' },
  { id:'particles-blue', name:'Blue Particles', type:'motion', animation:'particles', color:'#0a0c14', particleColor:'#6e9ec8' },
  { id:'particles-purple', name:'Purple Particles', type:'motion', animation:'particles', color:'#0a0c14', particleColor:'#9e6ec8' },
]

const SOLID_PRESETS = [
  { id:'deep-navy', name:'Deep Navy', type:'solid', color:'#0d0f14' },
  { id:'rich-black', name:'Rich Black', type:'solid', color:'#000000' },
  { id:'deep-burgundy', name:'Deep Burgundy', type:'solid', color:'#1a0810' },
  { id:'dark-forest', name:'Dark Forest', type:'solid', color:'#0a140c' },
]

const GRADIENT_PRESETS = [
  { id:'navy-black', name:'Navy to Black', type:'gradient', gradient:{ from:'#1a1c24', to:'#0d0f14', angle:135 } },
  { id:'purple-navy', name:'Purple to Navy', type:'gradient', gradient:{ from:'#1a0f2e', to:'#0d0f14', angle:160 } },
  { id:'forest-black', name:'Forest to Black', type:'gradient', gradient:{ from:'#0a1e12', to:'#050a06', angle:145 } },
  { id:'crimson-black', name:'Crimson to Black', type:'gradient', gradient:{ from:'#1e0a0a', to:'#050505', angle:135 } },
]

function BgPreview({ bg, selected, onClick }: { bg:any, selected:boolean, onClick:()=>void }) {
  let style: React.CSSProperties = {}
  if (bg.type==='solid') style.background = bg.color
  else if (bg.type==='gradient') style.background = `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.from}, ${bg.gradient.to})`
  else if (bg.type==='motion') style.background = bg.color
  else if (bg.type==='image') style = { backgroundImage:`url(${bg.url})`, backgroundSize:'cover', backgroundPosition:'center' }

  return (
    <div onClick={onClick} className={`aspect-video rounded-lg cursor-pointer border-2 transition-all overflow-hidden relative ${selected?'border-[#c8a96e]':'border-transparent hover:border-[#3a3d48]'}`} style={style}>
      {bg.type==='motion' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Play size={16} className="text-white/40"/>
        </div>
      )}
      {bg.type==='video' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Film size={16} className="text-white/60"/>
        </div>
      )}
      <div className="absolute bottom-1 left-2 text-[9px] text-white/50">{bg.name}</div>
    </div>
  )
}

export default function BackgroundLibraryPage() {
  const [selected, setSelected] = useState<any>(null)
  const [customBgs, setCustomBgs] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (files: FileList | null) => {
    if (!files) return
    const newBgs = Array.from(files).map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name, type: f.type.startsWith('video') ? 'video' : 'image',
      url: URL.createObjectURL(f)
    }))
    setCustomBgs(prev => [...prev, ...newBgs])
  }

  const copyConfig = () => {
    if (!selected) return
    navigator.clipboard.writeText(JSON.stringify(selected, null, 2))
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-2">
        <Image size={18} className="text-[#c8a96e]"/>
        <h1 className="text-xl font-serif text-[#e8d8b8]">Background Library</h1>
      </div>
      <p className="text-sm text-[#555] mb-6">Choose backgrounds for your slides and output screens.</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-5">

          <div>
            <div className="text-xs text-[#555] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sparkles size={10}/>Motion Backgrounds
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MOTION_PRESETS.map(bg=>(
                <BgPreview key={bg.id} bg={bg} selected={selected?.id===bg.id} onClick={()=>setSelected(bg)}/>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#555] uppercase tracking-widest mb-2">Solid Colours</div>
            <div className="grid grid-cols-4 gap-2">
              {SOLID_PRESETS.map(bg=>(
                <BgPreview key={bg.id} bg={bg} selected={selected?.id===bg.id} onClick={()=>setSelected(bg)}/>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#555] uppercase tracking-widest mb-2">Gradients</div>
            <div className="grid grid-cols-4 gap-2">
              {GRADIENT_PRESETS.map(bg=>(
                <BgPreview key={bg.id} bg={bg} selected={selected?.id===bg.id} onClick={()=>setSelected(bg)}/>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#555] uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Custom Media</span>
              <button onClick={()=>inputRef.current?.click()}
                className="text-[10px] flex items-center gap-1 text-[#c8a96e] hover:text-[#d8b97e] transition-colors">
                <Upload size={9}/>Upload
              </button>
            </div>
            <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e=>handleUpload(e.target.files)}/>
            {customBgs.length===0 ? (
              <div onClick={()=>inputRef.current?.click()}
                className="aspect-video rounded-lg border-2 border-dashed border-[#2a2d38] flex items-center justify-center cursor-pointer hover:border-[#3a3d48] transition-colors">
                <div className="text-center">
                  <Upload size={20} className="text-[#444] mx-auto mb-1"/>
                  <div className="text-xs text-[#444]">Upload images or videos</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {customBgs.map(bg=>(
                  <BgPreview key={bg.id} bg={bg} selected={selected?.id===bg.id} onClick={()=>setSelected(bg)}/>
                ))}
                <div onClick={()=>inputRef.current?.click()}
                  className="aspect-video rounded-lg border border-dashed border-[#2a2d38] flex items-center justify-center cursor-pointer hover:border-[#3a3d48] transition-colors">
                  <Plus size={16} className="text-[#444]"/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="sticky top-6 self-start">
          {selected ? (
            <div className="glass p-4">
              <div className="text-xs text-[#666] uppercase tracking-widest mb-3">Selected</div>
              <div className="aspect-video rounded-lg overflow-hidden mb-3" style={{
                background: selected.type==='solid' ? selected.color :
                  selected.type==='gradient' ? `linear-gradient(${selected.gradient?.angle}deg, ${selected.gradient?.from}, ${selected.gradient?.to})` :
                  selected.color || '#0d0f14'
              }}/>
              <div className="text-sm text-[#e8d8b8] mb-1">{selected.name}</div>
              <div className="text-xs text-[#555] capitalize mb-4">{selected.type}</div>
              <button onClick={copyConfig}
                className="w-full py-2 text-xs bg-[#c8a96e]/10 text-[#c8a96e] border border-[#c8a96e]/30 rounded-lg hover:bg-[#c8a96e]/20 transition-colors">
                {copied ? '✓ Copied!' : 'Copy Config JSON'}
              </button>
              <div className="text-[10px] text-[#444] mt-2">Paste this config into any slide background field</div>
            </div>
          ) : (
            <div className="glass p-4 flex items-center justify-center aspect-video">
              <div className="text-center text-[#444]">
                <Image size={24} className="mx-auto mb-2 opacity-30"/>
                <div className="text-xs">Click a background to select it</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
