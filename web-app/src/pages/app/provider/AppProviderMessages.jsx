import { useState, useRef, useEffect } from 'react'
import MobileAppLayout from '../../../components/layout/MobileAppLayout'
import { ChevronLeft, Send, Loader2, MessageSquare } from 'lucide-react'
import { myThreads, threadMessages, sendMessage } from '../../../lib/platformApi'

const initials = (name) => (name || '?').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()
const timeShort = (iso) => { if (!iso) return ''; return new Date(iso).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) }

export default function AppProviderMessages() {
  const [threads, setThreads]   = useState(null)
  const [active, setActive]     = useState(null)
  const [messages, setMessages] = useState(null)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { myThreads().then(setThreads).catch(() => setThreads([])) }, [])

  useEffect(() => {
    if (!active) return
    setMessages(null)
    threadMessages(active.id).then(setMessages).catch(() => setMessages([]))
  }, [active])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || !active || sending) return
    const body = input.trim()
    setSending(true)
    try {
      const msg = await sendMessage(active.id, body)
      setMessages(ms => [...(ms || []), msg])
      setInput('')
    } catch { /* keep input */ }
    finally { setSending(false) }
  }

  if (active) {
    return (
      <MobileAppLayout role="provider">
        <div className="flex flex-col h-screen bg-slate-50">
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 pt-10">
            <button onClick={() => setActive(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronLeft size={18}/>
            </button>
            <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {initials(active.otherParty?.name)}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{active.otherParty?.name || 'Client'}</p>
              {active.projectCategory && <p className="text-[11px] text-slate-400">{active.projectCategory}</p>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages === null ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : messages.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-10">No messages yet. Say hello!</div>
            ) : messages.map(m => (
              <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                  m.mine ? 'bg-turquoise-500 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                }`}>
                  <p className="text-sm">{m.body}</p>
                  <p className={`text-[10px] mt-0.5 ${m.mine ? 'text-turquoise-200' : 'text-slate-400'}`}>{timeShort(m.createdAt)}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="bg-white border-t border-slate-200 px-3 py-3 pb-20 flex items-center gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && send()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 text-sm bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
            <button onClick={send} disabled={!input.trim() || sending}
              className="w-8 h-8 bg-turquoise-500 disabled:opacity-40 text-white rounded-full flex items-center justify-center">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14}/>}
            </button>
          </div>
        </div>
      </MobileAppLayout>
    )
  }

  return (
    <MobileAppLayout role="provider">
      <div className="pt-12 pb-6">
        <h1 className="text-xl font-extrabold text-slate-900 px-4 mb-4">Messages</h1>
        {threads === null ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : threads.length === 0 ? (
          <div className="px-4">
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <MessageSquare size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-500">No conversations yet</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {threads.map(t => (
              <button key={t.id} onClick={() => setActive(t)}
                className="w-full text-left px-4 py-4 hover:bg-slate-50 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {initials(t.otherParty?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-sm">{t.otherParty?.name || 'Client'}</p>
                    <p className="text-[11px] text-slate-400">{timeShort(t.lastMessage?.createdAt)}</p>
                  </div>
                  {t.projectCategory && <p className="text-[11px] text-slate-400">{t.projectCategory}</p>}
                  <p className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessage?.body || 'No messages yet'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </MobileAppLayout>
  )
}
