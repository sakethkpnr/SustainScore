import { useEffect, useMemo, useState } from 'react'
import { Github, BookmarkPlus, ExternalLink, ListPlus, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import api from '../services/api'

export default function AddRepository() {
  const [rows, setRows] = useState([])
  const [urls, setUrls] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(false)

  const parsedUrls = useMemo(() => [...new Set(urls.split(/\r?\n/).map(v => v.trim()).filter(Boolean))], [urls])

  const load = async () => {
    setLoadingSaved(true)
    try {
      const response = await api.get('/repositories/saved')
      setRows(response.data)
    } catch {
      setError('Could not load saved repositories.')
    } finally {
      setLoadingSaved(false)
    }
  }

  useEffect(() => { load() }, [])

  const addMany = async e => {
    e.preventDefault()
    setError('')
    setResults(null)
    if (!parsedUrls.length) {
      setError('Paste at least one GitHub repository URL, one per line.')
      return
    }
    if (parsedUrls.length > 10) {
      setError('You can analyze up to 10 repositories in one batch. Please split larger lists into batches.')
      return
    }
    const invalid = parsedUrls.find(url => !/^https?:\/\/github\.com\/[^/\s]+\/[^/\s?#]+/i.test(url))
    if (invalid) {
      setError(`This does not look like a GitHub repository URL: ${invalid}`)
      return
    }

    setBusy(true)
    try {
      const response = await api.post('/repositories/bulk-analyze', { github_urls: parsedUrls })
      setResults(response.data)
      setUrls('')
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Bulk repository analysis failed.')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <div className="page-heading">
      <div>
        <div className="eyebrow">YOUR LIBRARY</div>
        <h1>Add repositories</h1>
        <p className="muted">Analyze and save several public GitHub repositories in one batch.</p>
      </div>
    </div>

    <section className="panel bulk-add-panel">
      <div className="bulk-title-row">
        <div className="bulk-icon"><ListPlus size={21} /></div>
        <div>
          <h3>Bulk add repositories</h3>
          <p className="muted">Paste one GitHub URL per line. Up to 10 repositories per batch.</p>
        </div>
      </div>
      <form onSubmit={addMany}>
        <textarea
          className="bulk-url-input"
          rows={6}
          placeholder={'https://github.com/kubernetes/kubernetes\nhttps://github.com/hashicorp/terraform\nhttps://github.com/helm/helm'}
          value={urls}
          onChange={e => setUrls(e.target.value)}
          disabled={busy}
        />
        <div className="bulk-form-footer">
          <span className="muted">{parsedUrls.length} unique URL{parsedUrls.length === 1 ? '' : 's'} entered</span>
          <button className="primary-btn" disabled={busy || parsedUrls.length === 0}>
            {busy ? <><RefreshCw size={15} className="spin-icon" /> Analyzing repositories…</> : <><BookmarkPlus size={16} /> Analyze & save all</>}
          </button>
        </div>
      </form>
      {error && <div className="error-box">{error}</div>}
      {results && <div className="bulk-results">
        <div className="bulk-summary">
          <b>Batch completed</b>
          <span className="bulk-success-count">{results.successful} successful</span>
          <span className="bulk-fail-count">{results.failed} failed</span>
        </div>
        {results.results.map((item, index) => <div className="bulk-result-row" key={`${item.github_url}-${index}`}>
          {item.status === 'success' ? <CheckCircle2 size={17} className="result-ok" /> : <XCircle size={17} className="result-fail" />}
          <div className="bulk-result-copy">
            <b>{item.repository}</b>
            <small>{item.message}{item.maturity_score != null ? ` · Maturity ${Number(item.maturity_score).toFixed(1)}/100` : ''}</small>
          </div>
          {item.status === 'success' && <span className="level-pill">Saved</span>}
        </div>)}
      </div>}
    </section>

    <section className="panel">
      <div className="panel-heading">
        <div><h3>Saved repositories</h3><p className="muted">Repositories available for comparison.</p></div>
        <button className="secondary-btn" onClick={load} disabled={loadingSaved}><RefreshCw size={14} /> Refresh</button>
      </div>
      {loadingSaved ? <p className="muted">Loading saved repositories…</p> : rows.length === 0 ? <p className="muted">No saved repositories yet. Add one or paste multiple URLs above.</p> : rows.map(r => <div className="saved-row" key={r.id}>
        <Github />
        <div><b>{r.owner}/{r.repo_name}</b><small>{Number(r.stars || 0).toLocaleString()} stars · {r.language || 'Language not specified'}{r.maturity_score != null ? ` · Maturity ${Number(r.maturity_score).toFixed(1)}` : ''}</small></div>
        <a className="text-link" href={r.github_url} target="_blank" rel="noreferrer">Open <ExternalLink size={13} /></a>
      </div>)}
    </section>
  </>
}
