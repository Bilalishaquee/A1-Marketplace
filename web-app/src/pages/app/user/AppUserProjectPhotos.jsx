import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Camera, X, Download, ChevronRight } from 'lucide-react'

const PHASE_PHOTOS = {
  Before: [
    { img: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&auto=format&fit=crop&q=80', caption: 'Original kitchen — pre-demo',       date: 'Apr 1' },
    { img: 'https://images.unsplash.com/photo-1556909196-52bf76e65190?w=400&auto=format&fit=crop&q=80', caption: 'Old cabinetry — to be removed',       date: 'Apr 1' },
    { img: 'https://images.unsplash.com/photo-1556909056-5b6e88ad2b27?w=400&auto=format&fit=crop&q=80', caption: 'Existing countertop — damaged edge',  date: 'Apr 1' },
  ],
  During: [
    { img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80', caption: 'Demo complete — bare walls',         date: 'Apr 5' },
    { img: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b3?w=400&auto=format&fit=crop&q=80', caption: 'New plumbing rough-in',              date: 'Apr 12' },
    { img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&auto=format&fit=crop&q=80', caption: 'Electrical panel updated',             date: 'Apr 15' },
    { img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&auto=format&fit=crop&q=80', caption: 'Cabinet installation — upper row done',date: 'May 2' },
  ],
  After: [
    { img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&auto=format&fit=crop&q=80', caption: 'Completed kitchen — island view',      date: 'TBD' },
  ],
}

export default function AppUserProjectPhotos() {
  const navigate      = useNavigate()
  const [params]      = useSearchParams()
  const projectName   = params.get('project') || 'Kitchen Full Remodel'

  const [phase,     setPhase]     = useState('During')
  const [lightbox,  setLightbox]  = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded,  setUploaded]  = useState(0)

  const photos = PHASE_PHOTOS[phase]
  const total  = Object.values(PHASE_PHOTOS).flat().length + uploaded

  const simulateUpload = () => {
    setUploading(true)
    setTimeout(() => { setUploading(false); setUploaded(n => n + 1) }, 1200)
  }

  return (
    <MobileAppLayout role="user">
      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 pt-12 pb-4">
            <button onClick={() => setLightbox(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <X size={18} className="text-white" />
            </button>
            <p className="text-white text-xs font-semibold">{lightbox + 1} / {photos.length}</p>
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Download size={16} className="text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4">
            <img src={photos[lightbox].img} alt={photos[lightbox].caption} className="w-full rounded-2xl object-contain max-h-[70vh]" />
          </div>
          <div className="px-6 py-6">
            <p className="text-white font-semibold text-sm">{photos[lightbox].caption}</p>
            <p className="text-white/50 text-xs mt-1">{phase} · {photos[lightbox].date}</p>
          </div>
          <div className="flex justify-center gap-4 pb-8">
            <button onClick={() => setLightbox(l => Math.max(0, l - 1))} disabled={lightbox === 0}
              className="w-10 h-10 bg-white/10 disabled:opacity-30 rounded-full flex items-center justify-center">
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button onClick={() => setLightbox(l => Math.min(photos.length - 1, l + 1))} disabled={lightbox === photos.length - 1}
              className="w-10 h-10 bg-white/10 disabled:opacity-30 rounded-full flex items-center justify-center">
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="pt-10 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <ChevronLeft size={18} className="text-slate-600" />
            </button>
            <div>
              <h1 className="font-extrabold text-slate-900 text-base leading-tight">Project Photos</h1>
              <p className="text-[11px] text-slate-400">{projectName} · {total} photos</p>
            </div>
          </div>
          <button onClick={simulateUpload} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-turquoise-500 text-white text-xs font-bold rounded-xl">
            <Camera size={13}/>
            {uploading ? 'Uploading...' : 'Add Photo'}
          </button>
        </div>

        {/* Phase tabs */}
        <div className="px-4 mb-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {Object.keys(PHASE_PHOTOS).map(p => (
              <button key={p} onClick={() => setPhase(p)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  phase === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}>
                {p}
                <span className="ml-1 text-[9px] text-slate-400">({PHASE_PHOTOS[p].length + (p === 'During' ? uploaded : 0)})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Photo grid */}
        <div className="px-4 grid grid-cols-2 gap-2">
          {photos.map((p, i) => (
            <button key={i} onClick={() => setLightbox(i)} className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group">
              <img src={p.img} alt={p.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-[11px] font-semibold leading-tight truncate">{p.caption}</p>
                <p className="text-white/60 text-[10px]">{p.date}</p>
              </div>
            </button>
          ))}

          {/* Upload placeholder */}
          <button onClick={simulateUpload}
            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors">
            <Camera size={22} className="text-slate-300" />
            <p className="text-[11px] text-slate-400 font-medium">Upload</p>
          </button>
        </div>
      </div>
    </MobileAppLayout>
  )
}
