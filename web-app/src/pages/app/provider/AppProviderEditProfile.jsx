import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Camera, CheckCircle2, Plus, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

const DEFAULT_SERVICES = ['Kitchen Remodel', 'Bathroom Renovation', 'Home Addition', 'Flooring', 'Drywall', 'Painting']

export default function AppProviderEditProfile() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const fileRef    = useRef(null)

  const [avatar,    setAvatar]    = useState(null)
  const [form,      setForm]      = useState({
    name:      user?.name      || 'Mike Rodriguez',
    title:     user?.title     || 'General Contractor',
    phone:     '+1 (512) 555-0142',
    location:  'Austin, TX',
    license:   'TX-GC-4821',
    bio:       'Licensed general contractor with 14 years of residential experience in Austin. Specializing in full kitchen and bathroom remodels. All work is permitted and inspected.',
    years:     '14',
    employees: '8',
  })
  const [services,  setServices]  = useState(DEFAULT_SERVICES)
  const [newService,setNewService] = useState('')
  const [saved,     setSaved]     = useState(false)

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const handlePhoto = e => {
    const file = e.target.files?.[0]
    if (file) setAvatar(URL.createObjectURL(file))
  }

  const addService = () => {
    const s = newService.trim()
    if (s && !services.includes(s)) setServices(sv => [...sv, s])
    setNewService('')
  }

  const removeService = s => setServices(sv => sv.filter(x => x !== s))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => navigate('/app/provider/profile'), 1400)
  }

  return (
    <MobileAppLayout role="provider">
      <div className="pt-10 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">Edit Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {avatar
              ? <img src={avatar} alt="avatar" className="w-20 h-20 rounded-2xl object-cover" />
              : <div className="w-20 h-20 bg-turquoise-500 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white">
                  {(form.name || 'M').split(' ').map(w => w[0]).join('').slice(0,2)}
                </div>
            }
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-turquoise-500 rounded-full flex items-center justify-center shadow-md">
              <Camera size={13} className="text-white" />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <button onClick={() => fileRef.current?.click()} className="text-xs text-turquoise-600 font-semibold">Change Photo</button>
        </div>

        {/* Business Info */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Business Info</p>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {[
              ['Full Name',      'name',      'text'],
              ['Title / Specialty','title',   'text'],
              ['Phone Number',   'phone',     'tel'],
              ['Location',       'location',  'text'],
              ['License #',      'license',   'text'],
              ['Years in Business','years',   'number'],
              ['Team Size',      'employees', 'number'],
            ].map(([label, key, type]) => (
              <div key={key} className="px-4 py-3 border-b border-slate-50 last:border-0">
                <label className="text-[11px] font-bold text-slate-400 block mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={e => set(key)(e.target.value)}
                  className="w-full text-sm font-medium text-slate-800 focus:outline-none focus:text-turquoise-600 bg-transparent" />
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">About</p>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <textarea value={form.bio} onChange={e => set('bio')(e.target.value)} rows={4}
              placeholder="Describe your experience, specialty, and work style..."
              className="w-full text-sm text-slate-800 focus:outline-none bg-transparent resize-none leading-relaxed" />
            <p className="text-[11px] text-slate-400 mt-1 text-right">{form.bio.length}/500</p>
          </div>
        </div>

        {/* Services */}
        <div className="px-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Services Offered</p>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {services.map(s => (
                <span key={s} className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 bg-turquoise-50 text-turquoise-700 text-xs font-semibold rounded-full border border-turquoise-100">
                  {s}
                  <button onClick={() => removeService(s)} className="w-4 h-4 bg-turquoise-200 rounded-full flex items-center justify-center ml-0.5 hover:bg-turquoise-300">
                    <X size={9} className="text-turquoise-700" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newService} onChange={e => setNewService(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addService()}
                placeholder="Add a service..."
                className="flex-1 text-sm px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
              <button onClick={addService}
                className="w-9 h-9 bg-turquoise-500 rounded-xl flex items-center justify-center hover:bg-turquoise-600 transition-colors">
                <Plus size={15} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="px-4">
          <button onClick={handleSave}
            className={`w-full py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-emerald-500 text-white' : 'bg-turquoise-500 hover:bg-turquoise-600 text-white'
            }`}>
            {saved ? <><CheckCircle2 size={16}/> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </MobileAppLayout>
  )
}
