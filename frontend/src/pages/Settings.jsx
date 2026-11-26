import { useEffect, useState } from 'react'
import { Moon, Sun, Palette, SlidersHorizontal } from 'lucide-react'
import api from '../services/api'

const fields = [
  ['contributor_weight', 'Contributor diversity', 'Distribution of observed contributors'],
  ['release_weight', 'Release continuity', 'Observed release activity'],
  ['commit_weight', 'Commit activity', 'Sampled commit activity'],
  ['issue_weight', 'Issue maintenance', 'Closed versus observed issues'],
  ['maintainer_weight', 'Maintainer distribution', 'Concentration among top contributors'],
]
const themes = ['light', 'dark']
const accents = [{name:'Blue',value:'#2563eb'},{name:'Violet',value:'#7c3aed'},{name:'Teal',value:'#0f9f8f'},{name:'Rose',value:'#e11d48'},{name:'Amber',value:'#d97706'}]

export default function SettingsPage() {
  const [weights,setWeights] = useState({})
  const [error,setError] = useState('')
  const [message,setMessage] = useState('')
  const [theme,setTheme] = useState(localStorage.getItem('sustainscore_theme') || 'light')
  const [accent,setAccent] = useState(localStorage.getItem('sustainscore_accent') || '#2563eb')
  useEffect(() => { api.get('/settings/weights').then(r=>setWeights(r.data)).catch(()=>setError('Could not load scoring settings.')) },[])
  const total = fields.reduce((sum,[key])=>sum+Number(weights[key]||0),0)
  const changeTheme = value => { setTheme(value); localStorage.setItem('sustainscore_theme',value); document.documentElement.dataset.theme=value }
  const changeAccent = value => { setAccent(value); localStorage.setItem('sustainscore_accent',value); document.documentElement.style.setProperty('--accent',value) }
  const save = async () => { setError(''); setMessage(''); try { await api.put('/settings/weights',weights); setMessage('Indicator percentages saved. New analyses will use these weights.') } catch(e) { setError(e.response?.data?.detail || 'Could not save weights.') } }
  return <>
    <div className="page-heading"><div><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p className="muted">Customize assessment weights, appearance and accent colour.</p></div></div>
    <section className="panel settings-panel"><div className="panel-heading"><div><h3><SlidersHorizontal size={18}/> Indicator percentages</h3><p className="muted">Choose how much each indicator contributes to the overall maturity score. Total must equal 100%.</p></div></div>
      {fields.map(([key,label,description])=><div className="weight-row" key={key}><div className="weight-label"><label htmlFor={key}>{label}</label><small>{description}</small></div><div className="weight-slider"><input id={key} type="range" min="0" max="100" step="1" value={weights[key]??0} onChange={e=>setWeights({...weights,[key]:Number(e.target.value)})}/><input aria-label={`${label} percentage`} type="number" min="0" max="100" step="1" value={weights[key]??0} onChange={e=>setWeights({...weights,[key]:Math.max(0,Math.min(100,Number(e.target.value)))})}/><b>%</b></div></div>)}
      <div className="weight-total"><b>Total weight</b><strong className={total===100?'good':'bad'}>{total}%</strong></div>{total!==100&&<p className="fine-print">Adjust the percentages until the total is exactly 100%.</p>}
      {error&&<div className="error-box">{error}</div>}{message&&<div className="success-box">{message}</div>}<button className="primary-btn" disabled={total!==100} onClick={save}>Save indicator settings</button>
      <p className="fine-print">Changes apply to future analyses. Existing history records keep the scores calculated at the time of analysis.</p>
    </section>
    <section className="panel settings-panel"><h3><Palette size={18}/> Appearance</h3><p className="muted">Choose light or dark mode and an accent colour for buttons and highlights.</p><div className="appearance-row"><div><b>Theme</b><small>Switch the application appearance</small></div><div className="theme-options"><button className={theme==='light'?'selected':''} onClick={()=>changeTheme('light')}><Sun size={16}/> Light</button><button className={theme==='dark'?'selected':''} onClick={()=>changeTheme('dark')}><Moon size={16}/> Dark</button></div></div><div className="appearance-row"><div><b>Accent colour</b><small>Personalize the primary interface colour</small></div><div className="accent-options">{accents.map(c=><button key={c.value} title={c.name} aria-label={c.name} className={accent===c.value?'selected':''} style={{'--swatch':c.value}} onClick={()=>changeAccent(c.value)}/>)}</div></div></section>
  </>
}
