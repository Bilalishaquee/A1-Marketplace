import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ClipboardList, Clock, FileText, Hammer, Info, Loader2, MessageSquare, Send, ShieldCheck } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { askQuestion, getQuote, postProject } from '../lib/aiEngine'
import { Alert, Badge, Button, Card, Container, LoadingState, PageHeader, TextInput } from '../components/ui/marketplace'

const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString()

export default function QuoteResult() {
  const [params] = useSearchParams()
  const quoteId = params.get('id')
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [messages, setMessages] = useState([{ from: 'ai', text: 'Ask about scope, assumptions, timing, or ways to adjust the project.' }])

  useEffect(() => {
    if (!quoteId) { setLoading(false); return }
    let alive = true
    getQuote(quoteId)
      .then((q) => { if (alive) { setQuote(q); setPosted(q.status === 'POSTED' || q.status === 'posted'); setLoading(false) } })
      .catch((err) => { if (alive) { setError(err.message); setLoading(false) } })
    return () => { alive = false }
  }, [quoteId])

  const post = async () => {
    setPosting(true)
    try {
      await postProject(quoteId)
      setPosted(true)
    } finally {
      setPosting(false)
    }
  }

  const send = async () => {
    if (!chatMsg.trim() || chatBusy) return
    const text = chatMsg.trim()
    setChatMsg('')
    setMessages((current) => [...current, { from: 'user', text }])
    setChatBusy(true)
    try {
      const { answer } = await askQuestion(quoteId, text)
      setMessages((current) => [...current, { from: 'ai', text: answer }])
    } catch {
      setMessages((current) => [...current, { from: 'ai', text: 'I could not answer that right now. Please try again.' }])
    } finally {
      setChatBusy(false)
    }
  }

  if (loading) return <Shell><LoadingState label="Loading estimate…" /></Shell>
  if (!quoteId || error || !quote?.scopeEstimate) {
    return (
      <Shell>
        <Card className="p-10 text-center">
          <AlertCircle size={34} className="mx-auto text-amber-600" />
          <h1 className="mt-3 text-lg font-semibold text-slate-950">Estimate unavailable</h1>
          <p className="mt-1 text-sm text-slate-600">{error || 'Start a new project to build an estimate.'}</p>
          <Button as={Link} to="/quote" className="mt-5">Start a project</Button>
        </Card>
      </Shell>
    )
  }

  const s = quote.scopeEstimate
  const confidence = Math.round((s.confidence || 0) * 100)

  return (
    <Shell>
      <PageHeader
        title={s.categoryLabel}
        description={quote.description || 'AI-assisted project scope and estimate range.'}
        meta={<Badge tone={s.needsReview ? 'amber' : 'green'}>{confidence}% confidence</Badge>}
        action={posted ? <Badge tone="green"><CheckCircle2 size={13} /> Posted for providers</Badge> : <Button onClick={post} disabled={posting}>{posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Post project</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <main className="space-y-5">
          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Price label="Budget" value={s.priceLow} />
              <Price label="Typical" value={s.priceMed} active />
              <Price label="Premium" value={s.priceHigh} />
            </div>
            <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
              <Stat icon={Clock} label="Duration" value={`${s.estimatedDuration.minDays}–${s.estimatedDuration.maxDays} days`} />
              <Stat icon={Hammer} label="Material grade" value={s.materialQuality} />
              <Stat icon={ShieldCheck} label="Permits" value={String(s.permitsRequired.length || 0)} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold text-slate-950"><ClipboardList size={18} /> Scope of work</h2>
            <ul className="mt-4 space-y-3">
              {s.scopeOfWork.map((task, index) => (
                <li key={index} className="flex gap-3 text-sm leading-6">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                  <span><strong className="text-slate-900">{task.title}</strong>{task.detail ? <span className="text-slate-600"> — {task.detail}</span> : null}</span>
                </li>
              ))}
            </ul>
            {s.matchedItems?.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{s.matchedItems.map((item) => <Badge key={item}>{item}</Badge>)}</div>}
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-950">Permits and inspections</h3>
              {s.permitsRequired.length ? <ul className="mt-3 space-y-2 text-sm text-slate-600">{s.permitsRequired.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">None typically required.</p>}
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold text-slate-950">Suggested provider types</h3>
              <div className="mt-3 flex flex-wrap gap-2">{s.suggestedTrades.map((item) => <Badge key={item} tone="blue">{item}</Badge>)}</div>
            </Card>
          </div>

          {s.needsReview && <Alert tone="blue">This estimate has a wider confidence range. Add more photos, dimensions, or provider confirmation to tighten it.</Alert>}

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-950"><Info size={17} /> Estimate rationale</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{s.rationale.map((item, index) => <li key={index}>• {item}</li>)}</ul>
            {s.assumptions?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{s.assumptions.map((item, index) => <Badge key={index}>{item}</Badge>)}</div>}
          </Card>
          <Alert>{s.framing}<div className="mt-1 text-xs">{s.pricingBasis}</div></Alert>
        </main>

        <aside className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-950">Ready for provider bids?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Posting lets nearby providers review the scope and send actual quotes.</p>
            {posted ? <Alert tone="green" className="mt-4">Your project is posted.</Alert> : <Button onClick={post} disabled={posting} className="mt-4 w-full">Post project</Button>}
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-semibold text-slate-950"><FileText size={17} /> Project details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Project ID', `PR-${quote.id.slice(0, 8).toUpperCase()}`],
                ['Location', quote.location?.region || quote.location?.zip || '—'],
                ['Model', s.modelId || '—'],
                ['Urgency', s.urgency || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">{label}</dt><dd className="text-right font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-0">
            <div className="border-b border-slate-100 p-4">
              <h3 className="flex items-center gap-2 font-semibold text-slate-950"><MessageSquare size={17} /> Ask about this estimate</h3>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div key={index} className={`rounded-lg px-3 py-2 text-sm leading-6 ${message.from === 'user' ? 'ml-8 bg-emerald-700 text-white' : 'mr-8 bg-slate-100 text-slate-700'}`}>{message.text}</div>
              ))}
              {chatBusy && <div className="mr-8 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">Thinking…</div>}
            </div>
            <div className="flex gap-2 border-t border-slate-100 p-3">
              <TextInput value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask a question…" />
              <Button onClick={send} disabled={chatBusy || !chatMsg.trim()}><Send size={16} /></Button>
            </div>
          </Card>
        </aside>
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Container className="max-w-6xl py-8">{children}</Container>
      <Footer />
    </div>
  )
}

function Price({ label, value, active }) {
  return (
    <div className={`rounded-lg border p-4 ${active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{money(value)}</p>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700"><Icon size={18} /></div>
      <div><p className="text-sm font-semibold capitalize text-slate-950">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
    </div>
  )
}
