import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, Category, Product, withImages, subscribeToStore, supabaseConfigured } from '../lib/supabase'
import { STORE_NAME, CURRENCY } from '../config'
import BuyBox from '../components/BuyBox'

export default function Home() {
  const [cats, setCats] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from('categories').select('*').order('created_at'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ])
    if (c.error || p.error) { setError(c.error?.message || p.error?.message || 'Erreur de chargement'); setLoading(false); return }
    setError(''); setCats((c.data as Category[]) ?? []); setProducts(withImages(p.data)); setLoading(false)
  }, [])
  useEffect(() => {
    if (!supabaseConfigured) { setError('Le site doit être configuré avec Supabase avant sa publication.'); setLoading(false); return }
    void load()
    const unsubscribe = subscribeToStore(() => { void load() })
    const onFocus = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', onFocus)
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load() }, 30000)
    return () => { unsubscribe(); document.removeEventListener('visibilitychange', onFocus); window.clearInterval(timer) }
  }, [load])
  const term = search.trim().toLocaleLowerCase()
  const list = products.filter(p => (!active || p.category_id === active) && (!term || `${p.name} ${p.description}`.toLocaleLowerCase().includes(term)))

  return <>
    <header><img className="owner" src="/owner.jpg" alt="Photo de profil" width="120" height="120" /><h1>{STORE_NAME}</h1><p dir="rtl" lang="ar"><strong>اكتشف ما تحب، واختر ما يناسبك!</strong><br/>تشكيلة متنوعة، اختيارات مميزة، وطلب سهل ومباشر عبر واتساب.</p></header>
    <Link to="/login" className="lock" aria-label="Espace propriétaire" title="Espace propriétaire">🔒</Link>
    <main>
      <input className="storeSearch" type="search" placeholder="Rechercher un produit…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Rechercher un produit"/>
      <div className="chips"><button className="chip" aria-pressed={active === null} onClick={() => setActive(null)}>Tout</button>{cats.map(c => <button key={c.id} className="chip" aria-pressed={active === c.id} onClick={() => setActive(c.id)}>{c.name}</button>)}</div>
      {loading ? <p className="empty">Chargement…</p> : error ? <p className="empty">{error}</p> : list.length === 0 ? <p className="empty">Aucun produit disponible pour le moment.</p> : <div className="grid">{list.map(p => <article className="card" key={p.id}><Link to={`/p/${p.id}`} className="ph" aria-label={`Voir ${p.name}`}>{p.images[0] && <img src={p.images[0]} alt={p.name} loading="lazy"/>}{p.images.length > 1 && <span className="more">1/{p.images.length}</span>}</Link><div className="body"><Link to={`/p/${p.id}`} className="title">{p.name}</Link><div className="price">{Number(p.price)} {CURRENCY}</div>{p.description ? <p className="desc">{p.description}</p> : <span className="desc"/>}<BuyBox product={p}/></div></article>)}</div>}
    </main>
  </>
}
