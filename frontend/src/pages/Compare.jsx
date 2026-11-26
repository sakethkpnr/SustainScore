import { useMemo, useState } from 'react'
import { GitCompareArrows, Search, Download, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../services/api'
import { downloadCSV, printComparisonPDF, repositoryCSVRows } from '../utils/exports'

const indicatorRows = [
  ['contributor_score', 'Contributor diversity'],
  ['release_score', 'Release continuity'],
  ['commit_score', 'Commit activity'],
  ['issue_score', 'Issue maintenance'],
  ['maintainer_score', 'Maintainer distribution'],
]

const metricRows = [
  ['maturity_score', 'Overall maturity score', '/100'],
  ['maturity_level', 'Maturity level', ''],
  ['language', 'Primary language', ''],
  ['license_name', 'License', ''],
  ['default_branch', 'Default branch', ''],
  ['created_at', 'Repository created', 'date'],
  ['last_pushed_at', 'Last pushed', 'date'],
  ['watchers', 'Watchers', ''],
  ['size_kb', 'Repository size (KB)', ''],
  ['archived', 'Archived', ''],
  ['is_fork', 'Fork', ''],
  ['stars', 'GitHub stars', ''],
  ['forks', 'Forks', ''],
  ['open_issues', 'Open issues', ''],
  ['contributors_sampled', 'Contributors sampled', ''],
  ['commits_sampled', 'Commits sampled', ''],
  ['releases_sampled', 'Releases sampled', ''],
  ['closed_issues_sampled', 'Closed issues sampled', ''],
  ['issues_sampled', 'Issues sampled', ''],
  ['top_contributor_share', 'Top contributor share', '%'],
]

function normalizeGitHubInput(value) {
  let input = value.trim().replace(/^(?:git\\s+clone|gh\\s+repo\\s+clone)\\s+/i, '')
  input = input.split(/[?#\\s]/)[0]
  const short = input.match(/^([A-Za-z0-9_.-]+)\\/([A-Za-z0-9_.-]+)$/)
  if (short) return `https://github.com/${short[1]}/${short[2].replace(/\\.git$/i, '')}`
  const ssh = input.match(/^(?:ssh:\/\/)?git@github\\.com[:/]([^/]+)\\/([^/]+)/i)
  if (ssh) return `https://github.com/${ssh[1]}/${ssh[2].replace(/\\.git$/i, '')}`
  return input.replace(/\\.git$/i, '').replace(/\\/(?:tree|blob|issues|pulls|releases|actions|wiki)(?:\\/.*)?$/i, '').replace(/\\/$/, '')
}

function isValidGitHubInput(value) {
  return /^https?:\\/\\/(www\\.)?github\\.com\\/[A-Za-z0-9_.-]+\\/[A-Za-z0-9_.-]+$/i.test(value)
}

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (suffix === 'date' && value) return new Date(value).toLocaleDateString()
  return `${value}${suffix}`
}

export default function Compare() {
  const [repoA, setRepoA] = useState('')
  const [repoB, setRepoB] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const chartData = useMemo(() => indicatorRows.map(([key, label]) => ({
    indicator: label,
    [results[0]?.repo_name || 'Repository A']: Number(results[0]?.scores?.[key] || 0),
    [results[1]?.repo_name || 'Repository B']: Number(results[1]?.scores?.[key] || 0),
  })), [results])

  async function handleCompare(event) {
    event.preventDefault()
    setError('')
    setResults([])

    const inputs = [repoA, repoB].map(normalizeGitHubInput)
    if (!repoA.trim() || !repoB.trim()) {
      setError('Enter both GitHub repositories to compare.')
      return
    }
    if (!inputs.every(isValidGitHubInput)) {
      setError('Invalid repository. Enter a full GitHub URL or owner/repository, for example kubernetes/kubernetes.')
      return
    }
    if (inputs[0].toLowerCase() === inputs[1].toLowerCase()) {
      setError('Enter two different repositories.')
      return
    }

    setLoading(true)
    try {
      const responses = await Promise.all(
        inputs.map(github_url => api.post('/repositories/analyze', { github_url }))
      )
      setResults(responses.map(response => response.data))
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not analyze both repositories. Check the URLs, GitHub API token, and backend terminal.')
    } finally {
      setLoading(false)
    }
  }

  const exportRows = results.flatMap(repo =>
    repositoryCSVRows(repo).map(row => ({
      repository: `${repo.owner}/${repo.repo_name}`,
      section: row.section,
      field: row.field,
      value: row.value
    }))
  )

  return (
    <div className="compare-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">O3 · SIDE-BY-SIDE ANALYSIS</div>
          <h1>Compare repositories</h1>
          <p className="muted">Enter any two public GitHub repositories to compare their sustainability and maintenance indicators.</p>
        </div>
      </div>

      <section className="panel compare-input-panel">
        <div className="compare-input-heading">
          <div className="compare-heading-icon"><GitCompareArrows size={21}/></div>
          <div>
            <h3>Choose two repositories</h3>
            <p className="muted">Both full GitHub URLs and owner/repository format are accepted.</p>
          </div>
        </div>

        <form onSubmit={handleCompare}>
          <div className="compare-input-grid">
            <label className="compare-repo-input">
              <span><b>Repository A</b><small>First project</small></span>
              <div className="input-icon"><Search size={16}/><input value={repoA} onChange={e => setRepoA(e.target.value)} placeholder="https://github.com/kubernetes/kubernetes or kubernetes/kubernetes" /></div>
              <small className="compare-input-hint">Example: kubernetes/kubernetes</small>
            </label>
            <label className="compare-repo-input">
              <span><b>Repository B</b><small>Second project</small></span>
              <div className="input-icon"><Search size={16}/><input value={repoB} onChange={e => setRepoB(e.target.value)} placeholder="https://github.com/hashicorp/terraform or hashicorp/terraform" /></div>
              <small className="compare-input-hint">Example: hashicorp/terraform</small>
            </label>
          </div>
          <div className="compare-form-footer">
            <p className="muted">Repositories are analyzed live using public GitHub data and your saved indicator weights.</p>
            <button className="primary-btn" type="submit" disabled={loading}>
              <GitCompareArrows size={16}/>{loading ? 'Analyzing repositories…' : 'Compare repositories'}
            </button>
          </div>
        </form>
        {error && <div className="error-box"><AlertCircle size={16}/>{error}</div>}
        {loading && <div className="compare-loading"><span className="compare-spinner"/>Fetching GitHub metrics and calculating maturity indicators…</div>}
      </section>

      {results.length === 2 && <>
        <div className="compare-results-title">
          <div><div className="eyebrow">COMPARISON REPORT</div><h2>Side-by-side results</h2><p className="muted">Both repositories were analyzed successfully.</p></div>
          <div className="compare-export-actions">
            <button className="secondary-btn" onClick={() => downloadCSV('sustainscore-comparison.csv', exportRows)}><Download size={15}/> Export CSV</button>
            <button className="secondary-btn" onClick={() => printComparisonPDF(results)}><Download size={15}/> Export PDF</button>
          </div>
        </div>

        <section className="compare-score-grid">
          {results.map((repo, index) => (
            <article className="panel compare-score-card" key={repo.github_url}>
              <div className="compare-card-top"><span className="compare-repo-label">REPOSITORY {index === 0 ? 'A' : 'B'}</span><a href={repo.github_url} target="_blank" rel="noreferrer" aria-label="Open GitHub repository"><ExternalLink size={16}/></a></div>
              <h3>{repo.owner}/{repo.repo_name}</h3>
              <p className="muted compare-description">{repo.description || 'No repository description provided.'}</p>
              <div className="compare-score-value">{Number(repo.maturity_score).toFixed(1)}<small>/100</small></div>
              <span className="level-pill">{repo.maturity_level} maturity</span>
              <div className="compare-mini-stats">
                <div><b>{Number(repo.stars || 0).toLocaleString()}</b><small>Stars</small></div>
                <div><b>{Number(repo.forks || 0).toLocaleString()}</b><small>Forks</small></div>
                <div><b>{repo.language || '—'}</b><small>Language</small></div>
              </div>
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panel-heading"><div><h3>Indicator score comparison</h3><p className="muted">Each indicator is scored from 0 to 100 using the configured weights.</p></div></div>
          <div className="compare-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{top: 12, right: 15, left: 0, bottom: 35}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="indicator" angle={-12} textAnchor="end" interval={0} height={65} tick={{fontSize: 10}}/>
                <YAxis domain={[0,100]} tick={{fontSize:10}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey={results[0].repo_name} fill="#2563eb" radius={[4,4,0,0]}/>
                <Bar dataKey={results[1].repo_name} fill="#16a085" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><div><h3>Detailed side-by-side metrics</h3><p className="muted">Compare repository metadata and the five O2 sustainability indicators.</p></div></div>
          <div className="table-wrap">
            <table className="compare-table">
              <thead><tr><th>Metric</th>{results.map(repo => <th key={repo.github_url}>{repo.owner}/{repo.repo_name}</th>)}</tr></thead>
              <tbody>
                {metricRows.map(([key,label,suffix]) => <tr key={key}><td><b>{label}</b></td>{results.map(repo => <td key={repo.github_url}>{formatValue(repo[key], suffix)}</td>)}</tr>)}
                <tr className="compare-section-row"><td colSpan="3"><b>O2 sustainability indicators</b></td></tr>
                {indicatorRows.map(([key,label]) => <tr key={key}><td><b>{label}</b></td>{results.map(repo => <td key={repo.github_url}>{formatValue(repo.scores?.[key], '/100')}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </section>
        <div className="compare-research-note"><CheckCircle2 size={17}/><p><b>Interpretation note:</b> Scores are prototype heuristic assessments based on sampled public GitHub API data and configured weights. They describe observed signals and do not guarantee future project maintenance or security.</p></div>
      </>}
    </div>
  )
}
