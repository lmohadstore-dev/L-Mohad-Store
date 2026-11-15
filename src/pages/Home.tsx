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
            <header>
      <style>{`
        header{position:relative}
        .owner-frame{width:104px;height:104px;margin:0 auto 16px;border-radius:50%;overflow:hidden;border:4px solid var(--door);box-shadow:0 0 0 4px rgba(255,255,255,.28),0 8px 20px rgba(0,0,0,.35);background:var(--card)}
        .owner-frame img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.08)}
        @media(min-width:1200px){.owner-frame{position:absolute;left:12%;top:50%;transform:translateY(-50%);width:140px;height:140px;margin:0}}
      `}</style>
      <div className="owner-frame"><img src="/owner.jpg" alt="Photo de profil" /></div>
      <h1>{STORE_NAME}</h1>
      <p dir="rtl" lang="ar"><strong>وجهتكم الأولى للملابس الداخلية الرجالية والنسائية، وملابس الأطفال المميزة.</strong><br/>جودة عالية وطلب سريع عبر واتساب</p>
      <a
        href="https://wa.me/212667153776"
        target="_blank"
        rel="noopener noreferrer"
        dir="ltr"
        aria-label="Contacter sur WhatsApp : 0667-153776"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '6px 16px 6px 8px', borderRadius: 99, background: 'rgba(255,255,255,.14)', color: 'inherit', textDecoration: 'none', font: '700 17px Manrope, sans-serif', letterSpacing: '.5px' }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', background: '#fff' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </span>
        0667-153776
      </a>
    </header>
    <Link to="/login" className="lock" aria-label="Espace propriétaire" title="Espace propriétaire">🔒</Link>
    <main>
      <input className="storeSearch" type="search" placeholder="Rechercher un produit…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Rechercher un produit"/>
      <div className="chips"><button className="chip" aria-pressed={active === null} onClick={() => setActive(null)}>Tout</button>{cats.map(c => <button key={c.id} className="chip" aria-pressed={active === c.id} onClick={() => setActive(c.id)}>{c.name}</button>)}</div>
      {loading ? <p className="empty">Chargement…</p> : error ? <p className="empty">{error}</p> : list.length === 0 ? <p className="empty">Aucun produit disponible pour le moment.</p> : <div className="grid">{list.map(p => <article className="card" key={p.id}><Link to={`/p/${p.id}`} className="ph" aria-label={`Voir ${p.name}`}>{p.images[0] && <img src={p.images[0]} alt={p.name} loading="lazy"/>}{p.images.length > 1 && <span className="more">1/{p.images.length}</span>}</Link><div className="body"><Link to={`/p/${p.id}`} className="title">{p.name}</Link><div className="price">{Number(p.price)} {CURRENCY}</div>{p.description ? <p className="desc">{p.description}</p> : <span className="desc"/>}<BuyBox product={p}/></div></article>)}</div>}
    </main>
  </>
}
