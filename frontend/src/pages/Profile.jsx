import { useAuth } from '../App'
import { UserRound,Mail,ShieldCheck } from 'lucide-react'
export default function Profile(){
 const {user}=useAuth()
 return <><div className="page-heading"><div><div className="eyebrow">ACCOUNT</div><h1>My profile</h1><p className="muted">Your SustainScore account information.</p></div></div><section className="panel profile-panel"><div className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div><h2>{user?.name}</h2><p className="muted">{user?.email}</p><div className="profile-detail"><UserRound/> <span>Full name</span><b>{user?.name}</b></div><div className="profile-detail"><Mail/> <span>Email</span><b>{user?.email}</b></div><div className="profile-detail"><ShieldCheck/> <span>Account status</span><b>Authenticated</b></div></section></>
}
