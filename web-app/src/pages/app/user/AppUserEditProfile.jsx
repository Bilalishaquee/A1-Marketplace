import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Camera, CheckCircle2, Mail, Phone, MapPin, User, FileText } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

export default function AppUserEditProfile() {
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const fileRef    = useRef(null)

  const [form, setForm] = useState({
    name:     user?.name  || 'James Carter',
    email:    user?.email || 'james.carter@email.com',
    phone:    '+1 (512) 555-0187',
    location: 'Austin, TX',
    bio:      'Homeowner renovating a 1970s ranch-style home. Love modern farmhouse aesthetic.',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [avatar, setAvatar] = useState(null)

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  const handlePhoto = e => {
    const file = e.target.files?.[0]
    if (file) setAvatar(URL.createObjectURL(file))
  }

  const save = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => navigate('/app/user/profile'), 900)
    }, 1200)
  }

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="font-extrabold text-slate-900 text-lg">Edit Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative">
            {avatar
              ? <img src={avatar} alt="avatar" className="w-20 h-20 rounded-2xl object-cover" />
              : <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white">
                  {form.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
            }
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center border-2 border-white">
              <Camera size={13} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <button onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-turquoise-600">
            Change Photo
          </button>
        </div>

        {/* Form */}
        <div className="px-4 space-y-3">
          {[
            { icon: User,     key: 'name',     label: 'Full Name',    type: 'text' },
            { icon: Mail,     key: 'email',    label: 'Email',        type: 'email' },
            { icon: Phone,    key: 'phone',    label: 'Phone',        type: 'tel' },
            { icon: MapPin,   key: 'location', label: 'City / State', type: 'text' },
          ].map(({ icon: Icon, key, label, type }) => (
            <div key={key} className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                <Icon size={11} /> {label}
              </label>
              <input type={type} value={form[key]} onChange={e => set(key)(e.target.value)}
                className="w-full text-sm font-semibold text-slate-800 focus:outline-none focus:text-turquoise-600 bg-transparent" />
            </div>
          ))}

          {/* Bio */}
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5">
            <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mb-1">
              <FileText size={11} /> Bio (optional)
            </label>
            <textarea rows={3} value={form.bio} onChange={e => set('bio')(e.target.value)}
              className="w-full text-sm text-slate-700 focus:outline-none bg-transparent resize-none" />
          </div>
        </div>

        {/* Save */}
        <div className="px-4">
          <button onClick={save} disabled={saving || saved}
            className={`w-full py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-emerald-500 text-white' : 'bg-turquoise-500 hover:bg-turquoise-600 text-white'
            }`}>
            {saved
              ? <><CheckCircle2 size={16}/> Saved! Redirecting...</>
              : saving
              ? 'Saving...'
              : 'Save Changes'
            }
          </button>
        </div>
      </div>
    </MobileAppLayout>
  )
}
