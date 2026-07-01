// Voice-to-text via the Web Speech API (Chrome/Edge/Safari). Robust wrapper:
// live interim transcription, graceful error messages, and a clear note when the
// browser blocks the mic (which it does on non-secure origins — speech recognition
// only works on https:// or http://localhost, NOT a plain http LAN IP).

import { useState, useRef, useCallback } from 'react'

function createRecognition() {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  return SR ? new SR() : null
}

const SECURE = typeof window === 'undefined'
  || window.isSecureContext
  || ['localhost', '127.0.0.1'].includes(window.location.hostname)

export function useVoiceInput(onText) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recRef = useRef(null)
  const baseRef = useRef('')

  const supported = typeof window !== 'undefined'
    && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const stop = useCallback(() => {
    try { recRef.current?.stop() } catch { /* */ }
    setListening(false)
  }, [])

  const start = useCallback((current = '') => {
    setError('')
    if (!supported) { setError('Voice input isn’t supported in this browser — try Chrome, or just type.'); return }
    if (!SECURE) {
      setError('Voice needs a secure connection. Open the site on localhost (or https) — phones on a plain http address can’t use the mic. You can still type.')
      return
    }
    const rec = createRecognition()
    if (!rec) { setError('Voice input is unavailable here — please type instead.'); return }
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    baseRef.current = current ? current.trim() + ' ' : ''
    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript
      onText(baseRef.current + text)
    }
    rec.onerror = (e) => {
      const code = e?.error
      setError(
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone access was blocked. Allow mic access in your browser (and use localhost/https).'
          : code === 'no-speech' ? 'Didn’t catch that — tap the mic and try again.'
          : code === 'audio-capture' ? 'No microphone found on this device.'
          : 'Voice input stopped unexpectedly — please try again or type.',
      )
      setListening(false)
    }
    rec.onend = () => setListening(false)
    try {
      rec.start()
      recRef.current = rec
      setListening(true)
    } catch {
      setError('Could not start voice input — please try again or type.')
    }
  }, [onText, supported])

  return { supported, listening, error, start, stop }
}
