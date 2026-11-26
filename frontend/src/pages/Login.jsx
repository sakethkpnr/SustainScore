import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cloud, LockKeyhole, Mail } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../App'
export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({email:'', password:''})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async e => { e.preventDefault(); setError(''); setBusy(true); try { const r = await api.post('/auth/login', form); login(r.data) } catch(err) { setError(err.response?.data?.detail || 'Could not log in. Check the API and database.') } finally { setBusy(false) } }
  return <div className="auth-page"><div className="auth-art"><div className="brand light"><span className="brand-icon"><Cloud/></span>Sustain<span className="brand-accent">Score</span></div><div className="auth-art-copy"><div className="eyebrow">SUSTAINABLE INFRASTRUCTURE INTELLIGENCE</div><h1>Make smarter infrastructure adoption decisions.</h1><p>Understand repository health, maintenance continuity and sustainability through evidence-based analysis.</p><div className="art-stat"><span>01</span> Repository intelligence <span>02</span> Maturity assessment</div></div><div className="art-footer">Sustainable Cloud Infrastructure Maturity Assessment</div></div><div className="auth-form-side"><form className="auth-form" onSubmit={submit}><div className="mobile-brand"><Cloud/> SustainScore</div><div className="eyebrow">WELCOME BACK</div><h2>Sign in to your account</h2><p className="muted">Enter your details to continue to your workspace.</p><label>Email address</label><div className="input-icon"><Mail size={17}/><input type="email" required placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><label>Password</label><div className="input-icon"><LockKeyhole size={17}/><input type="password" required placeholder="Enter your password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>{error && <div className="error-box">{error}</div>}<button className="primary-btn full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><p className="auth-switch">Don't have an account? <Link to="/register">Create account</Link></p></form></div></div>
}
