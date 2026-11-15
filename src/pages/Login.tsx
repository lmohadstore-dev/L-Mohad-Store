import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isStoreAdmin, supabaseConfigured } from '../lib/supabase'

export default function Login() {
  const nav = useNavigate(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    if (!supabaseConfigured) { setError('Le site n’est pas encore configuré.'); setBusy(false); return }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) { setError('Email ou mot de passe incorrect.'); setBusy(false); return }
    try { if (!await isStoreAdmin(data.user.id)) { await supabase.auth.signOut(); setError('Ce compte n’a pas les droits administrateur.'); setBusy(false); return } nav('/admin') }
    catch { await supabase.auth.signOut(); setError('Impossible de vérifier les droits. Vérifiez la configuration Supabase.'); setBusy(false) }
  }
  return <div className="login"><form onSubmit={submit}><h1>Espace propriétaire</h1><input type="email" placeholder="Email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required/><input type="password" placeholder="Mot de passe" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required/>{error && <p style={{ color: '#D43A3A', margin: 0 }}>{error}</p>}<button className="btn" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button><Link to="/" className="back" style={{ margin: 0 }}>← Retour au site</Link></form></div>
}
