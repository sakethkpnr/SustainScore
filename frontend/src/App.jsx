import { createContext, useContext, useEffect, useState } from 'react'
import { Routes, Route, Navigate, Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ScanSearch, GitCompareArrows, BookmarkPlus, History, Settings, UserRound, LogOut, Cloud, Menu, X } from 'lucide-react'
import api from './services/api'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'
import Compare from './pages/Compare'
import AddRepository from './pages/AddRepository'
import HistoryPage from './pages/History'
import SettingsPage from './pages/Settings'
import Profile from './pages/Profile'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function ProtectedLayout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const links = [
    ['Dashboard', '/', LayoutDashboard],
    ['Analyze Repository', '/analyze', ScanSearch],
    ['Compare Repositories', '/compare', GitCompareArrows],
    ['Add Repository', '/add-repository', BookmarkPlus],
    ['Analysis History', '/history', History],
    ['Settings', '/settings', Settings],
    ['My Profile', '/profile', UserRound],
  ]
  return <div className="app-shell">
    <button className="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-icon"><Cloud size={21}/></span><span>Sustain<span className="brand-accent">Score</span></span></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{links.map(([label, path, Icon]) => <NavLink onClick={() => setOpen(false)} end={path === '/'} key={path} to={path} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom">
        <div className="user-mini"><div className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</div><div className="user-mini-text"><b>{user?.name}</b><small>{user?.email}</small></div></div>
        <button className="nav-link logout" onClick={logout}><LogOut size={18}/>Logout</button>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> {links.find(x => x[1] === location.pathname)?.[0] || 'Dashboard'}</div></header>
      <div className="page-content"><Outlet/></div>
    </main>
  </div>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()
  useEffect(() => {
    const token = localStorage.getItem('sustainscore_token')
    if (!token) { setChecking(false); return }
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('sustainscore_token')).finally(() => setChecking(false))
  }, [])
  const login = (data) => { localStorage.setItem('sustainscore_token', data.access_token); setUser(data.user); navigate('/') }
  const logout = () => { localStorage.removeItem('sustainscore_token'); setUser(null); navigate('/login') }
  if (checking) return <div className="loading-screen">Loading SustainScore…</div>
  return <AuthContext.Provider value={{user, login, logout}}>
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace/> : <Login/>}/>
      <Route path="/register" element={user ? <Navigate to="/" replace/> : <Register/>}/>
      <Route element={user ? <ProtectedLayout/> : <Navigate to="/login" replace/>}>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/analyze" element={<Analyze/>}/>
        <Route path="/compare" element={<Compare/>}/>
        <Route path="/add-repository" element={<AddRepository/>}/>
        <Route path="/history" element={<HistoryPage/>}/>
        <Route path="/settings" element={<SettingsPage/>}/>
        <Route path="/profile" element={<Profile/>}/>
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace/>}/>
    </Routes>
  </AuthContext.Provider>
}
