import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Shield, FileText, CheckCircle2, AlertCircle, Upload, Download } from 'lucide-react'

const DOCS = [
  {
    id:1, type:'license', title:"General Contractor License", number:'TX-GC-4821',
    issued:'Jan 15, 2020', expires:'Jan 15, 2027', status:'verified', issuer:'Texas Dept. of Licensing',
  },
  {
    id:2, type:'insurance', title:'General Liability Insurance', number:'GLI-2024-88421',
    issued:'Mar 1, 2024', expires:'Mar 1, 2025', status:'expiring', issuer:'Nationwide Business Ins.',
  },
  {
    id:3, type:'insurance', title:"Workers' Comp Insurance", number:'WC-2024-33091',
    issued:'Jan 1, 2024', expires:'Jan 1, 2026', status:'verified', issuer:'State Fund',
  },
  {
    id:4, type:'cert', title:'OSHA 30 Certification', number:'OSHA-30-2023',
    issued:'Jun 10, 2023', expires:'Jun 10, 2026', status:'verified', issuer:'OSHA Training Institute',
  },
]

const STATUS_META = {
  verified: { icon: CheckCircle2, color:'text-emerald-500', bg:'bg-emerald-50', border:'border-emerald-200', label:'Verified' },
  expiring: { icon: AlertCircle,  color:'text-amber-500',   bg:'bg-amber-50',   border:'border-amber-200',  label:'Expiring Soon' },
  expired:  { icon: AlertCircle,  color:'text-red-500',     bg:'bg-red-50',     border:'border-red-200',    label:'Expired' },
}

export default function AppProviderLicense() {
  const navigate       = useNavigate()
  const [uploading,    setUploading]   = useState(null)
  const [uploaded,     setUploaded]    = useState([])
  const [downloading,  setDownloading] = useState(null)

  const handleUpload = (id) => {
    setUploading(id)
    setTimeout(() => { setUploading(null); setUploaded(u => [...u, id]) }, 1400)
  }

  const handleDownload = (id) => {
    setDownloading(id)
    setTimeout(() => setDownloading(null), 1200)
  }

  return (
    <MobileAppLayout role="provider">
      <div className="pt-10 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">License & Documents</h1>
        </div>

        {/* Summary */}
        <div className="px-4 grid grid-cols-3 gap-2">
          {[
            [DOCS.filter(d => d.status === 'verified').length, 'Verified', 'text-emerald-600', 'bg-emerald-50'],
            [DOCS.filter(d => d.status === 'expiring').length, 'Expiring', 'text-amber-600',   'bg-amber-50'  ],
            [DOCS.filter(d => d.status === 'expired').length,  'Expired',  'text-red-600',      'bg-red-50'    ],
          ].map(([n, l, tc, bg]) => (
            <div key={l} className={`${bg} rounded-2xl p-3 text-center`}>
              <p className={`font-extrabold text-xl ${tc}`}>{n}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        {/* Document list */}
        <div className="px-4 space-y-3">
          {DOCS.map(doc => {
            const meta   = STATUS_META[doc.status]
            const Icon   = meta.icon
            const isUp   = uploaded.includes(doc.id)
            return (
              <div key={doc.id} className={`bg-white rounded-2xl border ${meta.border} p-4 space-y-3`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${meta.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    {doc.type === 'license' ? <Shield size={16} className={meta.color} /> : <FileText size={16} className={meta.color} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{doc.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">#{doc.number}</p>
                    <p className="text-[11px] text-slate-400">{doc.issuer}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-slate-400">Issued</p>
                    <p className="font-semibold text-slate-700">{doc.issued}</p>
                  </div>
                  <div className={`rounded-lg px-3 py-2 ${doc.status === 'expiring' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                    <p className="text-slate-400">Expires</p>
                    <p className={`font-semibold ${doc.status === 'expiring' ? 'text-amber-700' : 'text-slate-700'}`}>{doc.expires}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleUpload(doc.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isUp
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}>
                    {uploading === doc.id
                      ? <Upload size={11} className="animate-bounce" />
                      : isUp
                      ? <><CheckCircle2 size={11}/> Uploaded</>
                      : <><Upload size={11}/> Upload New</>
                    }
                  </button>
                  <button onClick={() => handleDownload(doc.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      downloading === doc.id
                        ? 'bg-turquoise-500 text-white'
                        : 'bg-turquoise-50 text-turquoise-700 border border-turquoise-100 hover:bg-turquoise-100'
                    }`}>
                    <Download size={11}/> {downloading === doc.id ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add new doc */}
        <div className="px-4">
          <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-sm font-semibold text-slate-500 hover:border-turquoise-400 hover:text-turquoise-600 transition-all">
            + Upload New Document
          </button>
        </div>
      </div>
    </MobileAppLayout>
  )
}
