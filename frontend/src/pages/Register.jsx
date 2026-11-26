import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserRound, Mail, LockKeyhole, Cloud } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../App'
export default function Register() {
  const { login } = useAuth()
  const [form,setForm] = useState({name:'',email:'',password:''})
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  const submit = async e => { e.preventDefault(); setError(''); setBusy(true); try { const r=await api.post('/auth/register',form); login(r.data) } catch(err) { setError(err.response?.data?.detail || 'Registration failed.') } finally { setBusy(false) } }
  return <div className="auth-page"><div className="auth-art"><div className="brand light"><span className="brand-icon"><Cloud/></span>Sustain<span className="brand-accent">Score</span></div><div className="auth-art-copy"><div className="eyebrow">START YOUR ASSESSMENT</div><h1>Build a clearer picture of open-source sustainability.</h1><p>Create an account to analyze repositories, compare indicators and keep your assessment history in one place.</p></div><div className="art-footer">Evidence beyond popularity metrics.</div></div><div className="auth-form-side"><form className="auth-form" onSubmit={submit}><div className="mobile-brand"><Cloud/> SustainScore</div><div className="eyebrow">GET STARTED</div><h2>Create your account</h2><p className="muted">Use your details to set up your workspace.</p><label>Full name</label><div className="input-icon"><UserRound size={17}/><input required minLength="2" placeholder="Your name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><label>Email address</label><div className="input-icon"><Mail size={17}/><input type="email" required placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><label>Password</label><div className="input-icon"><LockKeyhole size={17}/><input type="password" required minLength="8" placeholder="At least 8 characters" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>{error && <div className="error-box">{Array.isArray(error) ? error.map(x=>x.msg).join(', ') : error}</div>}<button className="primary-btn full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button><p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p></form></div></div>
}
