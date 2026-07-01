import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Camera, CheckCircle2, ClipboardCheck, ImagePlus, Loader2, MapPin, Mic, MicOff,
  Ruler, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { runEstimation, getDeviceLocation } from '../lib/aiEngine'
import { useVoiceInput } from '../lib/useVoiceInput'
import { Alert, Button, Card, Container, PageHeader, TextArea, TextInput } from '../components/ui/marketplace'

const PROJECT_TYPES = [
  { key: 'bathroom_remodeling', label: 'Bathroom', hint: 'shower, tile, vanity' },
  { key: 'kitchen_remodeling', label: 'Kitchen', hint: 'cabinets, counters' },
  { key: 'flooring', label: 'Flooring', hint: 'LVP, tile, hardwood' },
  { key: 'painting_drywall', label: 'Paint/drywall', hint: 'repair, repaint' },
  { key: 'roofing', label: 'Roofing', hint: 'repair, replacement' },
  { key: 'basement_finishing', label: 'Basement', hint: 'finish, waterproof' },
]

export default function QuoteUpload() {
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [location, setLocation] = useState(null)
  const [locState, setLocState] = useState('detecting')
  const [categoryKey, setCategoryKey] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [refObject, setRefObject] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stageMsg, setStageMsg] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { supported, listening, error: voiceError, start, stop } = useVoiceInput(setDescription)

  useEffect(() => {
    let alive = true
    getDeviceLocation().then((loc) => {
      if (!alive) return
      if (loc) { setLocation(loc); setLocState('on') } else setLocState('off')
    })
    return () => { alive = false }
  }, [])

  const addFiles = (incoming) => {
    const next = Array.from(incoming || []).filter((f) => f.type?.startsWith('image/')).map((file) => ({
      id: crypto.randomUUID(), file, name: file.name, url: URL.createObjectURL(file),
    }))
    setFiles((current) => [...current, ...next].slice(0, 8))
  }
  const removeFile = (id) => setFiles((current) => current.filter((file) => file.id !== id))
  const canSubmit = description.trim().length >= 8 || files.length > 0
  const measuredArea = Number(length) > 0 && Number(width) > 0 ? Math.round(Number(length) * Number(width)) : null

  const generate = async () => {
    if (!canSubmit) {
      setError('Add a short project description or at least one photo.')
      return
    }
    setProcessing(true)
    setError('')
    setProgress(0)
    setStageMsg('Creating your project…')
    try {
      const l = Number(length), w = Number(width)
      const measuredAreaSqft = l > 0 && w > 0 ? Math.round(l * w) : undefined
      const quote = await runEstimation(
        { files: files.map((f) => f.file), description, categoryKey: categoryKey || undefined, location, measuredAreaSqft, referenceObject: refObject },
        { onStage: (ev) => { if (typeof ev.pct === 'number') setProgress(ev.pct); if (ev.message) setStageMsg(ev.message) } },
      )
      navigate(`/quote/result?id=${quote.id}`)
    } catch (err) {
      setProcessing(false)
      setError(err.message || 'Could not build your estimate. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Container className="max-w-5xl py-8">
        <PageHeader
          meta={<span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"><Sparkles size={13} /> AI scope and market range</span>}
          title="Get a project estimate"
          description="Tell us the trade, scope, size, condition, and photos. The estimate is anchored to public market pricing, then adjusted for your details."
        />

        {processing ? (
          <Card className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              {progress >= 100 ? <CheckCircle2 size={28} /> : <Loader2 size={28} className="animate-spin" />}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Building your market estimate</h2>
            <p className="mt-1 text-sm text-slate-600">{stageMsg || 'Analyzing your project…'}</p>
            <div className="mx-auto mt-6 max-w-md">
              <div className="mb-2 flex justify-between text-xs text-slate-500"><span>Progress</span><span>{progress}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-700 transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="p-5">
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-950">Project type</label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PROJECT_TYPES.map((type) => {
                      const active = categoryKey === type.key
                      return (
                        <button
                          key={type.key}
                          type="button"
                          onClick={() => setCategoryKey(active ? '' : type.key)}
                          className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                            active ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{type.label}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{type.hint}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-950">Project description</label>
                  <div className="relative">
                    <TextArea rows={8} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Example: Remodel a 60 sq ft main bathroom. Keep the same layout, replace tub with walk-in shower, install porcelain floor tile, new vanity, paint, and update fixtures. Existing tile is cracked but no visible mold." className="pr-12 text-[15px] leading-6" />
                    {supported && (
                      <button type="button" onClick={() => listening ? stop() : start(description)} className={`absolute right-3 top-3 rounded-md p-2 ${listening ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        {listening ? <MicOff size={17} /> : <Mic size={17} />}
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {(voiceError || listening) ? <span>{voiceError || 'Listening… tap again to stop.'}</span> : (
                      <>
                        <span>Good: size, layout changes, materials</span>
                        <span>•</span>
                        <span>Condition: dated, cracked, leak, mold</span>
                        <span>•</span>
                        <span>Timing: flexible or urgent</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-950">Photos</label>
                      <p className="mt-1 text-xs text-slate-500">Wide shot, close-up damage, and one photo with a scale reference work best.</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{files.length}/8</span>
                  </div>
                  <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-left transition-colors hover:border-emerald-400 hover:bg-emerald-50/30">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm"><ImagePlus size={22} /></span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-950">{files.length ? 'Add more photos' : 'Upload project photos'}</span>
                      <span className="mt-1 block text-xs text-slate-500">JPG or PNG. Uploads go directly to secure storage.</span>
                    </span>
                    <Upload size={18} className="ml-auto shrink-0 text-emerald-700" />
                  </button>
                  <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
                  {files.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {files.map((file) => (
                        <div key={file.id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeFile(file.id)} className="absolute right-1 top-1 rounded-full bg-slate-950/75 p-1 text-white"><X size={13} /></button>
                        </div>
                      ))}
                      {files.length < 8 && <button type="button" onClick={() => inputRef.current?.click()} className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500"><Camera size={22} /></button>}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700"><Ruler size={18} /></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Accuracy details</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Measurements keep the AI from pricing a small repair like a full room remodel.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_auto] sm:items-end">
                    <div><label className="mb-1 block text-xs font-semibold text-slate-600">Length (ft)</label><TextInput type="number" min="0" value={length} onChange={(e) => setLength(e.target.value)} /></div>
                    <span className="hidden pb-3 text-slate-400 sm:block">×</span>
                    <div><label className="mb-1 block text-xs font-semibold text-slate-600">Width (ft)</label><TextInput type="number" min="0" value={width} onChange={(e) => setWidth(e.target.value)} /></div>
                    {measuredArea && <p className="pb-3 text-sm font-semibold text-emerald-700">{measuredArea} sq ft</p>}
                  </div>
                  <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={refObject} onChange={(e) => setRefObject(e.target.checked)} className="accent-emerald-700" />
                    A credit card or sheet of paper is visible in one photo for scale.
                  </label>
                </div>

                {error && <Alert tone="red">{error}</Alert>}
                <Button onClick={generate} disabled={!canSubmit} size="lg" className="w-full"><Sparkles size={17} /> Get estimate</Button>
              </div>
            </Card>

            <aside className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold text-slate-950">What happens next</h3>
                <ol className="mt-4 space-y-4 text-sm text-slate-600">
                  {['Scope is classified', 'Price is market-calibrated', 'Review and post for bids'].map((item, index) => (
                    <li key={item} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">{index + 1}</span>{item}</li>
                  ))}
                </ol>
              </Card>
              <Card className="p-5">
                <h3 className="flex items-center gap-2 font-semibold text-slate-950"><ShieldCheck size={16} /> Estimate quality</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p className="flex gap-2"><ClipboardCheck size={16} className="mt-0.5 shrink-0 text-emerald-700" /> Public market ranges anchor the price before local adjustments.</p>
                  <p className="flex gap-2"><Ruler size={16} className="mt-0.5 shrink-0 text-emerald-700" /> Exact dimensions narrow the final band.</p>
                  <p className="flex gap-2"><Camera size={16} className="mt-0.5 shrink-0 text-emerald-700" /> Photos help identify condition and hidden complexity.</p>
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="flex items-center gap-2 font-semibold text-slate-950"><MapPin size={16} /> Location</h3>
                <p className="mt-2 text-sm text-slate-600">{locState === 'detecting' ? 'Detecting your location…' : locState === 'on' ? `${location?.region || 'Location detected'} will help match providers.` : 'Location is off. You can still create an estimate.'}</p>
              </Card>
            </aside>
          </div>
        )}
      </Container>
      <Footer />
    </div>
  )
}
