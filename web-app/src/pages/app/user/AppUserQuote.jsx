import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import {
  ChevronLeft, Sparkles, Camera, X, Info, Mic, MicOff, MapPin, CheckCircle2, Send, Loader2,
} from 'lucide-react'
import { runEstimation, getDeviceLocation, postProject } from '../../../lib/aiEngine'
import { useVoiceInput } from '../../../lib/useVoiceInput'

const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString()

export default function AppUserQuote() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [desc, setDesc] = useState('')
  const [files, setFiles] = useState([])
  const [location, setLocation] = useState(null)
  const [locOn, setLocOn] = useState(false)
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [refObject, setRefObject] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stageMsg, setStageMsg] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [posted, setPosted] = useState(false)
  const [posting, setPosting] = useState(false)
  const { supported: speechSupported, listening, error: voiceError, start: startVoice, stop: stopVoice } = useVoiceInput(setDesc)

  useEffect(() => {
    let alive = true
    getDeviceLocation().then((l) => { if (alive && l) { setLocation(l); setLocOn(true) } })
    return () => { alive = false }
  }, [])

  const toggleVoice = () => { listening ? stopVoice() : startVoice(desc) }

  const addFiles = (incoming) => {
    const next = Array.from(incoming).map((f) => ({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f) }))
    setFiles((p) => [...p, ...next].slice(0, 8))
  }
  const removeFile = (id) => setFiles((f) => f.filter((x) => x.id !== id))

  const canSubmit = desc.trim().length >= 8 || files.length > 0

  const runAI = async () => {
    if (!canSubmit) { setError('Add a short description or a photo so the AI can estimate your project.'); return }
    setError(''); setLoading(true); setStageMsg('Starting…')
    try {
      const l = parseFloat(length), w = parseFloat(width)
      const measuredAreaSqft = l > 0 && w > 0 ? Math.round(l * w) : undefined
      const quote = await runEstimation(
        { files: files.map((f) => f.file), description: desc, location, measuredAreaSqft, referenceObject: refObject },
        { onStage: (ev) => ev.message && setStageMsg(ev.message) },
      )
      setResult(quote)
      setPosted(quote.status === 'posted')
      setLoading(false)
    } catch (err) {
      setLoading(false)
      setError(err.message || 'Could not generate the estimate. Please try again.')
    }
  }

  const post = async () => {
    if (!result) return
    setPosting(true)
    try { await postProject(result.id); setPosted(true) } catch { /* */ } finally { setPosting(false) }
  }

  const reset = () => { setResult(null); setFiles([]); setDesc(''); setError(''); setPosted(false) }

  const s = result?.scopeEstimate

  return (
    <MobileAppLayout role="user">
      <div className="pt-10 pb-8">
        <div className="flex items-center gap-3 px-4 mb-6">
          <button onClick={() => (result || loading ? reset() : navigate(-1))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <ChevronLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg">AI Estimate</h1>
            <p className="text-[11px] text-slate-400">{result ? 'Your scope & price range' : 'Describe your project'}</p>
          </div>
        </div>

        {/* Form */}
        {!loading && !result && (
          <div className="px-4 space-y-5">
            <div>
              <p className="font-bold text-slate-900 mb-1">What do you need done?</p>
              <p className="text-xs text-slate-400">Describe it (or use the mic) and add photos — the AI does the rest.</p>
            </div>

            <div className="relative">
              <textarea rows={5} value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="e.g. Replace my tub with a walk-in shower, new tile floor and vanity. Bathroom is about 60 sq ft and dated."
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-turquoise-300 resize-none pr-12" />
              {speechSupported && (
                <button onClick={toggleVoice} className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-xl flex items-center justify-center ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                  {listening ? <MicOff size={17} /> : <Mic size={17} />}
                </button>
              )}
            </div>
            {voiceError ? <p className="text-[11px] text-red-600">{voiceError}</p>
              : listening ? <p className="text-[11px] text-turquoise-600">🎙️ Listening… speak now.</p> : null}

            <div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              <button onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center"><Camera size={18} className="text-slate-500" /></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-700">{files.length ? `${files.length} photo${files.length > 1 ? 's' : ''} added` : 'Add Photos'}</p>
                  <p className="text-[11px] text-slate-400">Optional · camera or gallery</p>
                </div>
                <span className="text-xs font-semibold text-turquoise-600">Upload</span>
              </button>
              {files.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {files.map((f) => (
                    <div key={f.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                      <img src={f.url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeFile(f.id)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X size={11} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional accuracy aids */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
              <p className="text-xs font-semibold text-slate-700">Improve accuracy <span className="font-normal text-slate-400">(optional)</span></p>
              <p className="text-[11px] text-slate-400 mb-2">Dimensions or a reference object give a tighter estimate.</p>
              <div className="flex items-center gap-2 mb-2">
                <input type="number" inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} placeholder="Length ft" className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none" />
                <span className="text-slate-400">×</span>
                <input type="number" inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="Width ft" className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none" />
                {parseFloat(length) > 0 && parseFloat(width) > 0 && <span className="text-[11px] font-semibold text-turquoise-600 whitespace-nowrap">{Math.round(parseFloat(length) * parseFloat(width))} ft²</span>}
              </div>
              <label className="flex items-start gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={refObject} onChange={(e) => setRefObject(e.target.checked)} className="accent-turquoise-500 mt-0.5" />
                <span>📏 A credit card/paper is in one photo for scale</span>
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <MapPin size={14} className={locOn ? 'text-turquoise-600' : 'text-slate-400'} />
              <span className="text-slate-500">{locOn ? `${location?.region || 'Location on'} · matches nearby pros` : 'Location off — estimate still works'}</span>
            </div>

            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{error}</div>}

            <button onClick={runAI} disabled={!canSubmit} className="w-full py-3.5 bg-turquoise-500 disabled:opacity-40 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              <Sparkles size={16} /> Get AI Estimate
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-14 h-14 bg-turquoise-100 rounded-full flex items-center justify-center mb-4 animate-pulse"><Sparkles size={24} className="text-turquoise-500" /></div>
            <p className="font-bold text-slate-900 mb-1">Analyzing your project…</p>
            <p className="text-xs text-slate-400">{stageMsg || 'Reviewing your description, photos and local pricing'}</p>
          </div>
        )}

        {/* Result */}
        {result && s && !loading && (
          <div className="px-4 space-y-4">
            <div className="bg-gradient-to-br from-turquoise-600 to-turquoise-700 rounded-2xl p-5 text-center">
              <p className="text-turquoise-200 text-xs mb-1">{s.categoryLabel}</p>
              <p className="text-white font-extrabold text-3xl">{money(s.priceLow)} – {money(s.priceHigh)}</p>
              <p className="text-turquoise-200 text-xs mt-2">typical {money(s.priceMed)} · {s.estimatedDuration.minDays}–{s.estimatedDuration.maxDays} days · {Math.round((s.confidence || 0) * 100)}% confidence</p>
            </div>

            {/* L/M/H */}
            <div className="grid grid-cols-3 gap-2">
              {[['Budget', s.priceLow], ['Typical', s.priceMed], ['Premium', s.priceHigh]].map(([l, v], i) => (
                <div key={l} className={`bg-white rounded-2xl border p-3 text-center ${i === 1 ? 'border-turquoise-400' : 'border-slate-200'}`}>
                  <p className="text-[10px] text-slate-400">{l}</p><p className="text-sm font-extrabold text-slate-900">{money(v)}</p>
                </div>
              ))}
            </div>

            {/* Scope */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="font-bold text-slate-900 text-sm mb-3">Scope of work</p>
              <ul className="space-y-2">
                {s.scopeOfWork.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600"><CheckCircle2 size={13} className="text-turquoise-500 shrink-0 mt-0.5" /><span><b className="text-slate-800 font-medium">{t.title}</b>{t.detail ? ` — ${t.detail}` : ''}</span></li>
                ))}
              </ul>
            </div>

            {/* Pros + permits */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div><p className="text-xs font-bold text-slate-700 mb-1.5">Suggested pros</p><div className="flex flex-wrap gap-1.5">{s.suggestedTrades.map((t) => <span key={t} className="text-[11px] bg-turquoise-50 text-turquoise-700 px-2 py-0.5 rounded-full">{t}</span>)}</div></div>
              {s.permitsRequired.length > 0 && <div><p className="text-xs font-bold text-slate-700 mb-1">Permits likely</p><p className="text-[11px] text-slate-500">{s.permitsRequired.join(' · ')}</p></div>}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2">
              <Info size={14} className="text-amber-600 mt-0.5 shrink-0" /><p className="text-[11px] text-amber-800">{s.framing}</p>
            </div>

            {posted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center text-green-700 text-sm font-semibold"><CheckCircle2 size={18} className="mx-auto mb-1" /> Posted! Nearby pros can now send quotes.</div>
            ) : (
              <button onClick={post} disabled={posting} className="w-full py-3.5 bg-turquoise-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
                {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Post my project
              </button>
            )}
            <button onClick={reset} className="w-full py-3 text-slate-500 text-sm font-semibold">Start a New Estimate</button>
          </div>
        )}
      </div>
    </MobileAppLayout>
  )
}
