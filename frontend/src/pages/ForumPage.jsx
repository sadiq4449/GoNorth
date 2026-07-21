import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchForum, postForum } from '../api/client'

export default function ForumPage() {
  const [valley, setValley] = useState('')
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState({ author_name: '', title: '', body: '', valley: 'Skardu' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  function load() {
    fetchForum(valley || undefined).then(setPosts).catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
  }, [valley])

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await postForum(form)
      setForm({ author_name: '', title: '', body: '', valley: form.valley })
      setMsg('Post published — visible to other travelers.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container community-page">
      <Link to="/" className="back-link">← Home</Link>
      <h1>Traveler Forum</h1>
      <p className="plan-lead">Ask locals and fellow travelers about routes, weather, and stays in Baltistan.</p>

      <div className="filter-row">
        <button type="button" className={!valley ? 'active' : ''} onClick={() => setValley('')}>All valleys</button>
        {['Skardu', 'Hunza', 'Shigar', 'Khaplu'].map((v) => (
          <button key={v} type="button" className={valley === v ? 'active' : ''} onClick={() => setValley(v)}>{v}</button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      <div className="forum-list">
        {posts.map((p) => (
          <article key={p.id} className="forum-card">
            <h3>{p.title}</h3>
            <p className="meta">{p.author_name} · {p.valley} · {new Date(p.created_at).toLocaleDateString()}</p>
            <p>{p.body}</p>
          </article>
        ))}
        {!posts.length && <p>No posts yet — be the first to ask a question.</p>}
      </div>

      <form className="vendor-panel forum-form" onSubmit={submit}>
        <h2>New post</h2>
        <label>
          Your name
          <input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} required minLength={2} />
        </label>
        <label>
          Valley
          <select value={form.valley} onChange={(e) => setForm({ ...form, valley: e.target.value })}>
            {['Skardu', 'Hunza', 'Shigar', 'Khaplu', 'Deosai'].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label>
          Title
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={3} />
        </label>
        <label>
          Message
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required minLength={10} rows={4} />
        </label>
        <button type="submit" className="btn-primary">Publish</button>
      </form>
    </div>
  )
}
