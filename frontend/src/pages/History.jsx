import { downloadCSV, printHistoryPDF } from '../utils/exports'
import { useEffect,useState } from 'react'
import { ExternalLink, Trash2, History as HistoryIcon } from 'lucide-react'
import api from '../services/api'
import { Empty } from './Dashboard'
export default function HistoryPage(){
 const [rows,setRows]=useState([]);const [error,setError]=useState('')
 const load=()=>api.get('/history').then(r=>setRows(r.data)).catch(()=>setError('Could not load history.'))
 useEffect(()=>{load()},[])
 const remove=async id=>{if(!confirm('Delete this analysis from your history?'))return;try{await api.delete(`/history/${id}`);load()}catch(e){setError('Could not delete entry.')}}
 return <><div className="page-heading"><div><div className="eyebrow">YOUR ACTIVITY</div><h1>Analysis history</h1><p className="muted">Review repository assessments saved to your account.</p></div></div>{error&&<div className="error-box">{error}</div>}<section className="panel"><div className="panel-heading"><div><h3>Saved assessments</h3><p className="muted">Export your analysis history.</p></div><div className="table-actions"><button className="secondary-btn" disabled={!rows.length} onClick={()=>downloadCSV('sustainscore-analysis-history.csv',rows)}>Export CSV</button><button className="secondary-btn" disabled={!rows.length} onClick={()=>printHistoryPDF(rows)}>Export PDF</button></div></div>{rows.length===0?<Empty text="Your analysis history will appear here after you analyze a repository."/>:<div className="table-wrap"><table><thead><tr><th>Repository</th><th>Maturity score</th><th>Level</th><th>Analyzed</th><th>Actions</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><b>{r.repository}</b></td><td>{Number(r.maturity_score).toFixed(1)}</td><td><span className="level-pill">{r.maturity_level}</span></td><td>{new Date(r.analyzed_at).toLocaleString()}</td><td><div className="table-actions"><a href={r.github_url} target="_blank" rel="noreferrer" title="Open repository"><ExternalLink size={16}/></a><button onClick={()=>remove(r.id)} title="Delete history"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>}</section></>
}
