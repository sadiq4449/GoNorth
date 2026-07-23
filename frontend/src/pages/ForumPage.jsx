import { useEffect, useState } from 'react'
import { fetchForum, postForum } from '../api/client'
import PageHeader from '../components/PageHeader'

const VALLEYS = ['Skardu', 'Hunza', 'Gilgit', 'Shigar', 'Khaplu', 'Deosai', 'Astore', 'Basho']

export default function ForumPage() {
  const [valley, setValley] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ author_name: '', title: '', body: '', valley: 'Skardu' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    fetchForum(valley || undefined)
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [valley])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    setSubmitting(true)
    try {
      await postForum(form)
      setForm({ author_name: '', title: '', body: '', valley: form.valley })
      setMsg('Post published — visible to other travelers.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container tourist-page community-page">
      <PageHeader
        title="Ask a Traveler"
        lead="Real advice from locals and people who've been there — routes, weather, stays, and what to pack for Gilgit-Baltistan."
      />

      <div className="forum-filter-row" role="tablist" aria-label="Filter by valley">
        <button type="button" className={!valley ? 'active' : ''} onClick={() => setValley('')}>
          All valleys
        </button>
        {VALLEYS.map((v) => (
          <button
            key={v}
            type="button"
            className={valley === v ? 'active' : ''}
            onClick={() => setValley(v)}
          >
            {v}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      <section className="forum-posts-section">
        <h2 className="forum-section-title">
          {valley ? `Posts in ${valley}` : 'Recent posts'}
          {!loading && <span className="forum-count">{posts.length}</span>}
        </h2>

        {loading && <p className="forum-loading">Loading posts…</p>}

        {!loading && posts.length === 0 && (
          <div className="forum-empty">
            <span className="forum-empty-icon" aria-hidden>💬</span>
            <h3>No posts yet in this valley</h3>
            <p>Be the first to ask about routes, weather, or where to stay{valley ? ` in ${valley}` : ''}.</p>
          </div>
        )}

        <div className="forum-list">
          {posts.map((p) => (
            <article key={p.id} className="forum-card">
              <div className="forum-card-top">
                <span className="forum-valley-badge">{p.valley}</span>
                <time className="forum-date">{new Date(p.created_at).toLocaleDateString()}</time>
              </div>
              <h3>{p.title}</h3>
              <p className="forum-body">{p.body}</p>
              <p className="forum-author">— {p.author_name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="forum-compose">
        <h2 className="forum-section-title">Share your question</h2>
        <form className="forum-form" onSubmit={submit}>
          <div className="forum-form-row">
            <label>
              Your name
              <input
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                placeholder="How should we show your name?"
                required
                minLength={2}
              />
            </label>
            <label>
              Valley
              <select value={form.valley} onChange={(e) => setForm({ ...form, valley: e.target.value })}>
                {VALLEYS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Best time to visit Deosai?"
              required
              minLength={3}
            />
          </label>

          <label>
            Message
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Share your question or tip for other travelers…"
              required
              minLength={10}
              rows={5}
            />
          </label>

          <button type="submit" className="btn-primary btn-enabled forum-submit" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Post to forum'}
          </button>
        </form>
      </section>
    </div>
  )
}
