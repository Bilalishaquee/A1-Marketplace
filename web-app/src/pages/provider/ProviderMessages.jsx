import { useState, useRef, useEffect } from 'react'
import ProviderLayout from '../../components/layout/ProviderLayout'
import { Send, Search, Loader2, MessageSquare } from 'lucide-react'
import { myThreads, threadMessages, sendMessage } from '../../lib/platformApi'

const initials = (name) => (name || '?').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()
const timeShort = (iso) => { if (!iso) return ''; const d = new Date(iso); return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) }

export default function ProviderMessages() {
  const [threads, setThreads]   = useState(null)
  const [active, setActive]     = useState(null)
  const [messages, setMessages] = useState(null)
  const [input, setInput]       = useState('')
  const [search, setSearch]     = useState('')
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
    } catch { /* keep input on failure */ }
    finally { setSending(false) }
  }

  const filtered = (threads || []).filter(t => !search ||
    (t.otherParty?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.projectCategory || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <ProviderLayout title="Messages" subtitle="Client communications">
      <div className="flex h-[calc(100vh-61px)] overflow-hidden">

        {/* Thread list */}
        <div className="w-72 shrink-0 border-r border-slate-200 flex flex-col bg-white">
          <div className="px-3 py-3 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {threads === null ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-slate-400 text-xs">No conversations yet.</div>
            ) : filtered.map(t => (
              <button key={t.id} onClick={() => setActive(t)}
                className={`w-full text-left px-3 py-3 transition-colors hover:bg-slate-50 ${active?.id === t.id ? 'bg-turquoise-50' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-turquoise-500 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                    {initials(t.otherParty?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">{t.otherParty?.name || 'Client'}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{timeShort(t.lastMessage?.createdAt)}</span>
                    </div>
                    {t.projectCategory && <p className="text-[11px] text-slate-400 truncate">{t.projectCategory}</p>}
                    <p className="text-[11px] text-slate-500 truncate">{t.lastMessage?.body || 'No messages yet'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-slate-50">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={32} className="mb-2 text-slate-300" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-turquoise-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {initials(active.otherParty?.name)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{active.otherParty?.name || 'Client'}</p>
                  {active.projectCategory && <p className="text-[11px] text-slate-400">{active.projectCategory}</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages === null ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-10">No messages yet. Say hello!</div>
                ) : messages.map(m => (
                  <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs sm:max-w-sm rounded-2xl px-3.5 py-2.5 ${
                      m.mine ? 'bg-turquoise-500 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                    }`}>
                      <p className="text-sm">{m.body}</p>
                      <p className={`text-[10px] mt-1 ${m.mine ? 'text-turquoise-200' : 'text-slate-400'}`}>{timeShort(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 text-sm bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-turquoise-300" />
                <button onClick={send} disabled={!input.trim() || sending}
                  className="w-8 h-8 bg-turquoise-500 hover:bg-turquoise-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors">
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ProviderLayout>
  )
}
