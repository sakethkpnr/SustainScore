function csvEscape(value) {
  if (value === null || value === undefined) return '""'
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function downloadCSV(filename, rows) {
  if (!rows?.length) return
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))]
  const csv = [
    columns.map(csvEscape).join(','),
    ...rows.map(row => columns.map(key => csvEscape(row[key])).join(','))
  ].join('\r\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function flattenObject(value, prefix = '', rows = []) {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    rows.push({ section: prefix.split('.')[0] || 'Repository', field: prefix || 'Value', value: Array.isArray(value) ? value.join(', ') : value ?? '' })
    return rows
  }
  Object.entries(value).forEach(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) flattenObject(child, path, rows)
    else rows.push({ section: path.split('.')[0], field: path, value: Array.isArray(child) ? child.join(', ') : child ?? '' })
  })
  return rows
}

export function repositoryCSVRows(repo) {
  const base = {
    repository: `${repo.owner || ''}/${repo.repo_name || ''}`,
    github_url: repo.github_url || '',
    analyzed_at: repo.analyzed_at || new Date().toISOString(),
    maturity_score: repo.maturity_score ?? '',
    maturity_level: repo.maturity_level || '',
    description: repo.description || '',
    language: repo.language || '',
    stars: repo.stars ?? '',
    forks: repo.forks ?? '',
    open_issues: repo.open_issues ?? '',
    last_pushed_at: repo.last_pushed_at || '',
    default_branch: repo.default_branch || '',
    created_at: repo.created_at || '',
    watchers: repo.watchers ?? '',
    size_kb: repo.size_kb ?? '',
    homepage: repo.homepage || '',
    topics: (repo.topics || []).join(', '),
    archived: repo.archived ?? '',
    is_fork: repo.is_fork ?? '',
    license_name: repo.license_name || '',
    contributors_count: repo.contributors_count ?? '',
    contributors_sampled: repo.contributors_sampled ?? '',
    commits_sampled: repo.commits_sampled ?? '',
    releases_sampled: repo.releases_sampled ?? '',
    closed_issues_sampled: repo.closed_issues_sampled ?? '',
    issues_sampled: repo.issues_sampled ?? '',
    top_contributor_share: repo.top_contributor_share ?? '',
    scoring_note: repo.scoring_note || ''
  }
  const rows = Object.entries(base).map(([field, value]) => ({ section: 'Repository details', field, value }))
  Object.entries(repo.scores || {}).forEach(([field, value]) => rows.push({ section: 'O2 indicators', field, value }))
  Object.entries(repo.weights_used || {}).forEach(([field, value]) => rows.push({ section: 'Configured weights (%)', field, value }))
  ;(repo.contributors || []).forEach((person, index) => rows.push({
    section: 'Contributors', field: `${index + 1}. ${person.login}`,
    value: `Contributions: ${person.contributions}; Profile: ${person.profile_url || ''}`
  }))
  ;(repo.recent_authors || []).forEach((person, index) => rows.push({
    section: 'Recent commit authors', field: `${index + 1}. ${person.login}`, value: person.commits
  }))
  ;(repo.releases || []).forEach((release, index) => rows.push({
    section: 'Release details', field: `${index + 1}. ${release.name || release.tag}`,
    value: `Tag: ${release.tag}; Published: ${release.published_at}; Prerelease: ${release.prerelease}; URL: ${release.url}`
  }))
  ;(repo.languages || []).forEach(language => rows.push({
    section: 'Language breakdown', field: language.language,
    value: `Bytes: ${language.bytes}`
  }))
  return rows
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch])
}

function reportWindow(title, body) {
  const win = window.open('', '_blank', 'width=1000,height=800')
  if (!win) {
    alert('Your browser blocked the report window. Allow pop-ups for this site and try again.')
    return
  }
  win.document.open()
  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
*{box-sizing:border-box}body{font:13px/1.55 Arial,sans-serif;color:#172033;margin:34px}
h1{font-size:25px;margin:0 0 5px}h2{font-size:17px;margin:26px 0 9px;border-bottom:1px solid #dce3ed;padding-bottom:7px}
p{color:#526174}.meta{color:#64748b;font-size:11px}.score{font-size:28px;font-weight:700;color:#245fd6}
.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.card{border:1px solid #dce3ed;padding:14px;break-inside:avoid}
table{width:100%;border-collapse:collapse;margin:8px 0 18px}th,td{text-align:left;padding:7px 9px;border-bottom:1px solid #e7edf4;vertical-align:top}th{background:#f3f6fa;font-size:10px;text-transform:uppercase;letter-spacing:.04em}td{font-size:11px;overflow-wrap:anywhere}
.note{background:#f4f7fb;border-left:3px solid #2563eb;padding:10px 13px;margin:18px 0;color:#475569}
@page{size:A4;margin:14mm}
@media print{body{margin:0}.no-print{display:none}.card{break-inside:avoid}tr{break-inside:avoid}}
</style></head><body>
<div class="no-print" style="margin-bottom:18px"><button onclick="window.print()">Print / Save as PDF</button></div>
${body}
<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),450))</script>
</body></html>`)
  win.document.close()
}

export function printRepositoryPDF(repo) {
  const title = `${repo.owner || 'repository'}-${repo.repo_name || 'report'}-SustainScore`
  const details = repositoryCSVRows(repo)
  const groups = details.reduce((acc, row) => {
    ;(acc[row.section] ||= []).push(row)
    return acc
  }, {})
  const body = `<h1>SustainScore — Repository Assessment</h1>
<p class="meta">Generated ${esc(new Date().toLocaleString())} · ${esc(repo.github_url || '')}</p>
<div class="cards">
<div class="card"><div class="meta">REPOSITORY</div><h2>${esc(repo.owner)}/${esc(repo.repo_name)}</h2><p>${esc(repo.description || 'No description provided.')}</p><p><a href="${esc(repo.github_url || '#')}">${esc(repo.github_url || '')}</a></p></div>
<div class="card"><div class="meta">MATURITY ASSESSMENT</div><div class="score">${esc(repo.maturity_score ?? '—')} / 100</div><b>${esc(repo.maturity_level || 'Not classified')}</b><p>${esc(repo.scoring_note || 'Heuristic assessment based on sampled public GitHub data.')}</p></div>
</div>
${Object.entries(groups).map(([section, rows]) => `<h2>${esc(section)}</h2><table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${rows.map(row => `<tr><td>${esc(row.field)}</td><td>${esc(row.value)}</td></tr>`).join('')}</tbody></table>`).join('')}
<div class="note">Interpretation: SustainScore indicators are prototype heuristic measures based on observed GitHub data. They are not a guarantee of future maintenance, security, or adoption suitability.</div>`
  reportWindow(title, body)
}

export function printComparisonPDF(repositories) {
  const [a, b] = repositories || []
  if (!a || !b) return
  const rows = [
    ['Overall maturity score', a.maturity_score, b.maturity_score],
    ['Maturity level', a.maturity_level, b.maturity_level],
    ['Primary language', a.language, b.language],
    ['Stars', a.stars, b.stars],
    ['Forks', a.forks, b.forks],
    ['Open issues', a.open_issues, b.open_issues],
    ['Contributors sampled', a.contributors_sampled, b.contributors_sampled],
    ['Commits sampled', a.commits_sampled, b.commits_sampled],
    ['Releases sampled', a.releases_sampled, b.releases_sampled],
    ['Closed issues sampled', a.closed_issues_sampled, b.closed_issues_sampled],
    ['Issues sampled', a.issues_sampled, b.issues_sampled],
    ['Top contributor share', a.top_contributor_share, b.top_contributor_share],
    ...Object.keys(a.scores || {}).map(key => [key.replaceAll('_', ' '), a.scores[key], b.scores?.[key]])
  ]
  const details = [a, b].map((repo, index) => {
    const detailRows = repositoryCSVRows(repo)
    return `<h2>Repository ${index ? 'B' : 'A'} — Full details: ${esc(repo.owner)}/${esc(repo.repo_name)}</h2>
<table><thead><tr><th>Section / field</th><th>Value</th></tr></thead><tbody>${detailRows.map(row => `<tr><td>${esc(row.section)} · ${esc(row.field)}</td><td>${esc(row.value)}</td></tr>`).join('')}</tbody></table>`
  }).join('')
  const body = `<h1>SustainScore — Repository Comparison</h1>
<p class="meta">Generated ${esc(new Date().toLocaleString())}</p>
<div class="cards">${[a, b].map((repo, i) => `<div class="card"><div class="meta">REPOSITORY ${i ? 'B' : 'A'}</div><h2>${esc(repo.owner)}/${esc(repo.repo_name)}</h2><div class="score">${esc(repo.maturity_score)} / 100</div><b>${esc(repo.maturity_level)} maturity</b><p>${esc(repo.description || 'No description provided.')}</p><p>${esc(repo.github_url)}</p></div>`).join('')}</div>
<h2>Side-by-side metrics</h2><table><thead><tr><th>Metric</th><th>${esc(a.owner)}/${esc(a.repo_name)}</th><th>${esc(b.owner)}/${esc(b.repo_name)}</th></tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${esc(v ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table>
${details}
<div class="note">Popularity metrics such as stars and forks are contextual only. Sustainability scores are heuristic assessments based on sampled public GitHub data, not validated predictions.</div>`
  reportWindow('SustainScore-repository-comparison', body)
}

export function printHistoryPDF(rows) {
  const body = `<h1>SustainScore — Analysis History</h1><p class="meta">Generated ${esc(new Date().toLocaleString())}</p>
<table><thead><tr><th>Repository</th><th>GitHub URL</th><th>Maturity score</th><th>Level</th><th>Analyzed at</th></tr></thead><tbody>${(rows || []).map(r => `<tr><td>${esc(r.repository)}</td><td>${esc(r.github_url)}</td><td>${esc(r.maturity_score)}</td><td>${esc(r.maturity_level)}</td><td>${esc(r.analyzed_at)}</td></tr>`).join('')}</tbody></table>`
  reportWindow('SustainScore-analysis-history', body)
}
