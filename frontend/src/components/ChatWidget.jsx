import { useEffect, useRef, useState } from 'react'
import { fetchChatMessages } from '../api/client'
import { getCachedBooking } from '../utils/offlineCache'
import { sendChatMessage } from '../utils/syncQueue'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState('')
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [senderName, setSenderName] = useState('Traveler')
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    getCachedBooking().then((b) => {
      if (b?.reference) {
        setReference(b.reference)
        setSenderName(b.traveler_name || 'Traveler')
      }
    })
  }, [])

  useEffect(() => {
    if (!open || !reference) return
    const load = () => fetchChatMessages(reference).then(setMessages).catch(() => {})
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [open, reference])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || !reference) return
    setError('')
    try {
      const payload = { body: text.trim(), sender_name: senderName, sender_role: 'tourist' }
      const sent = await sendChatMessage(reference, payload)
      setMessages((prev) => [
        ...prev,
        {
          id: sent.id || `local-${Date.now()}`,
          body: payload.body,
          sender_name: payload.sender_name,
          sender_role: 'tourist',
          created_at: new Date().toISOString(),
          queued: sent.queued,
        },
      ])
      setText('')
    } catch (err) {
      setError(err.message)
    }
  }

  if (!reference) return null

  return (
    <>
      <button type="button" className="chat-bubble-fixed" onClick={() => setOpen(!open)} aria-label="Chat with vendor">
        💬
      </button>
      {open && (
        <div className="chat-window-overlay">
          <div className="chat-window">
            <div className="chat-header">
              <strong>Vendor chat</strong>
              <span>{reference}</span>
              <button type="button" className="btn-link-sm" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="chat-body">
              {messages.length === 0 && <p className="chat-empty">Message your driver or hotel about your trip.</p>}
              {messages.map((m) => (
                <div key={m.id} className={`chat-msg ${m.sender_role}`}>
                  <strong>{m.sender_name}</strong>
                  <p>{m.body}{m.queued ? ' (queued)' : ''}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form className="chat-footer" onSubmit={handleSend}>
              <input
                className="chat-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
              />
              <button type="submit" className="btn-primary btn-enabled">Send</button>
            </form>
            {error && <p className="form-error chat-error">{error}</p>}
          </div>
        </div>
      )}
    </>
  )
}
