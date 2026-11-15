import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase, Product, withImages, subscribeToStore } from '../lib/supabase'
import { CURRENCY } from '../config'
import Carousel from '../components/Carousel'
import BuyBox from '../components/BuyBox'

export default function ProductPage() {
  const { id } = useParams()
  const [p, setP] = useState<Product | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading')
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
    if (error) { setState('error'); return }
    if (data) { setP(withImages([data])[0]); setState('ok') } else { setP(null); setState('missing') }
  }, [id])
  useEffect(() => {
    void load(); const unsubscribe = subscribeToStore(() => { void load() })
    const onFocus = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', onFocus)
    return () => { unsubscribe(); document.removeEventListener('visibilitychange', onFocus) }
  }, [load])
  useEffect(() => { if (p) document.title = `${p.name} — L’Mohad Store` }, [p])
  return <div className="page"><Link to="/" className="back">← Retour à la boutique</Link>{state === 'loading' && <p className="empty">Chargement…</p>}{state === 'error' && <p className="empty">Impossible de charger ce produit. Vérifiez votre connexion.</p>}{state === 'missing' && <p className="empty">Ce produit n’existe plus.</p>}{p && <><Carousel images={p.images} alt={p.name}/><h1>{p.name}</h1><div className="price" style={{ margin: '0 4px' }}>{Number(p.price)} {CURRENCY}</div>{p.description && <p className="desc">{p.description}</p>}<div style={{ padding: '0 4px' }}><BuyBox product={p}/></div></>}</div>
}
