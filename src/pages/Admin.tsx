import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, Category, Product, withImages, isStoreAdmin } from '../lib/supabase'
import { CURRENCY } from '../config'

const errText = (e: unknown) => e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e)
const splitList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)

async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  const ctx = c.getContext('2d'); if (!ctx) throw new Error('Impossible de traiter cette image')
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((ok, ko) => c.toBlob(b => b ? ok(b) : ko(new Error('Image illisible')), 'image/jpeg', 0.82))
}
async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const f of files.slice(0, 8)) {
    const path = `${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage.from('products').upload(path, await compress(f), { contentType: 'image/jpeg' })
    if (error) throw error
    urls.push(supabase.storage.from('products').getPublicUrl(path).data.publicUrl)
  }
  return urls
}
const pathOf = (url: string) => url.split('/products/')[1]

type Draft = { name: string; price: string; description: string; category_id: string; stock: string; sizes: string; colors: string }
const emptyDraft: Draft = { name: '', price: '', description: '', category_id: '', stock: '0', sizes: '', colors: '' }

export default function Admin() {
  const nav = useNavigate()
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<'products' | 'categories'>('products')
  const [cats, setCats] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [files, setFiles] = useState<File[]>([])
  const [fileKey, setFileKey] = useState(0)
  const [catName, setCatName] = useState('')
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [editingCatName, setEditingCatName] = useState('')

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      supabase.from('categories').select('*').order('created_at'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ])
    if (c.error || p.error) { setMsg('Erreur de chargement : ' + (c.error?.message || p.error?.message)); return }
    setCats((c.data as Category[]) ?? []); setProducts(withImages(p.data))
  }, [])

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!alive) return
      if (error || !data.session) { nav('/login'); return }
      try {
        if (!await isStoreAdmin(data.session.user.id)) { await supabase.auth.signOut(); nav('/login'); return }
        if (alive) { setReady(true); await load() }
      } catch (e) { setMsg('Vérification administrateur impossible : ' + errText(e)); await supabase.auth.signOut(); nav('/login') }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) nav('/login') })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [nav, load])

  async function saveProduct(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    try {
      const newImages = await uploadImages(files)
      const values = {
        name: draft.name.trim(), price: Number(draft.price), description: draft.description.trim(),
        category_id: draft.category_id || null, stock: Math.max(0, Math.floor(Number(draft.stock))),
        sizes: splitList(draft.sizes), colors: splitList(draft.colors),
      }
      if (!values.name || !Number.isFinite(values.price) || values.price < 0 || !Number.isFinite(values.stock)) throw new Error('Vérifiez le nom, le prix et le stock.')
      if (editing) {
        const { error } = await supabase.from('products').update({ ...values, images: [...editing.images, ...newImages] }).eq('id', editing.id)
        if (error) throw error
        setMsg('Produit modifié avec succès.')
      } else {
        const { error } = await supabase.from('products').insert({ ...values, images: newImages })
        if (error) throw error
        setMsg('Produit ajouté avec succès.')
      }
      setDraft(emptyDraft); setEditing(null); setFiles([]); setFileKey(k => k + 1); await load()
    } catch (err) { setMsg('Erreur : ' + errText(err)) }
    finally { setBusy(false) }
  }

  function startEdit(p: Product) {
    setEditing(p); setDraft({ name: p.name, price: String(p.price), description: p.description, category_id: p.category_id ?? '', stock: String(p.stock), sizes: p.sizes.join(', '), colors: p.colors.join(', ') }); setFiles([]); setFileKey(k => k + 1); setMsg('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function cancelEdit() { setEditing(null); setDraft(emptyDraft); setFiles([]); setFileKey(k => k + 1) }

  async function removeImage(p: Product, url: string) {
    if (!confirm('Retirer cette photo du produit ?')) return
    const { error } = await supabase.from('products').update({ images: p.images.filter(x => x !== url) }).eq('id', p.id)
    if (error) { setMsg('Erreur : ' + error.message); return }
    const path = pathOf(url); if (path) await supabase.storage.from('products').remove([path])
    await load(); if (editing?.id === p.id) setEditing({ ...p, images: p.images.filter(x => x !== url) })
  }

  async function removeProduct(p: Product) {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) { setMsg('Erreur : ' + error.message); return }
    const paths = p.images.map(pathOf).filter(Boolean); if (paths.length) await supabase.storage.from('products').remove(paths)
    if (editing?.id === p.id) cancelEdit(); setMsg('Produit supprimé.'); await load()
  }
  async function addCategory(e: FormEvent) {
    e.preventDefault(); const { error } = await supabase.from('categories').insert({ name: catName.trim() })
    if (error) return setMsg('Erreur : ' + error.message)
    setCatName(''); setMsg('Catégorie ajoutée.'); await load()
  }
  async function updateCategory(e: FormEvent) {
    e.preventDefault(); if (!editingCat) return
    const { error } = await supabase.from('categories').update({ name: editingCatName.trim() }).eq('id', editingCat.id)
    if (error) return setMsg('Erreur : ' + error.message)
    setEditingCat(null); setEditingCatName(''); setMsg('Catégorie modifiée.'); await load()
  }
  async function removeCategory(c: Category) {
    if (!confirm(`Supprimer la catégorie « ${c.name} » ? Les produits resteront sans catégorie.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', c.id)
    if (error) { setMsg('Erreur : ' + error.message); return }
    setMsg('Catégorie supprimée.'); await load()
  }
  const set = (key: keyof Draft, value: string) => setDraft(d => ({ ...d, [key]: value }))
  if (!ready) return <div className="wrap"><p className="empty">Vérification de l’accès…</p></div>

  return <div className="wrap">
    <div className="bar"><h1>Administration</h1><div style={{ display: 'flex', gap: 16, fontWeight: 700, alignItems: 'center' }}><Link to="/" className="back" style={{ margin: 0 }}>Voir le site</Link><button className="del" style={{ color: 'var(--ink)' }} onClick={async () => { await supabase.auth.signOut(); nav('/login') }}>Déconnexion</button></div></div>
    <div className="tabs"><button className="tab" aria-pressed={tab === 'products'} onClick={() => { setTab('products'); setMsg('') }}>Produits</button><button className="tab" aria-pressed={tab === 'categories'} onClick={() => { setTab('categories'); setMsg('') }}>Catégories</button></div>
    {msg && <p className="note" role="status">{msg}</p>}
    {tab === 'products' ? <>
      <h2 className="adminTitle">{editing ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
      <form className="form" onSubmit={saveProduct}>
        <input placeholder="Nom du produit" value={draft.name} onChange={e => set('name', e.target.value)} required />
        <input type="number" min="0" step="0.01" placeholder={`Prix (${CURRENCY})`} value={draft.price} onChange={e => set('price', e.target.value)} required />
        <select value={draft.category_id} onChange={e => set('category_id', e.target.value)}><option value="">Sans catégorie</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input type="number" min="0" step="1" placeholder="Stock disponible" value={draft.stock} onChange={e => set('stock', e.target.value)} required />
        <input placeholder="Tailles (ex. S, M, L, XL)" value={draft.sizes} onChange={e => set('sizes', e.target.value)} />
        <input placeholder="Couleurs (ex. Noir, Bleu, Blanc)" value={draft.colors} onChange={e => set('colors', e.target.value)} />
        <textarea className="full" rows={3} placeholder="Description" value={draft.description} onChange={e => set('description', e.target.value)} />
        {editing && editing.images.length > 0 && <div className="full"><small>Photos actuelles — cliquez sur × pour retirer une photo.</small><div className="photoManage">{editing.images.map(url => <div className="photoThumb" key={url}><img src={url} alt="Photo du produit"/><button type="button" onClick={() => removeImage(editing, url)} aria-label="Retirer la photo">×</button></div>)}</div></div>}
        <input key={fileKey} className="full" type="file" accept="image/*" multiple aria-label="Ajouter des photos" onChange={e => setFiles([...(e.target.files ?? [])])} />
        <small className="full" style={{ color: 'var(--mute)' }}>Vous pouvez sélectionner plusieurs photos (maximum 8 à la fois).</small>
        <div className="full" style={{ display: 'flex', gap: 8 }}><button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : editing ? 'Enregistrer les modifications' : 'Ajouter le produit'}</button>{editing && <button type="button" className="tab" onClick={cancelEdit}>Annuler</button>}</div>
      </form>
      {products.map(p => <div className="row" key={p.id}><div className="t">{p.images[0] && <img src={p.images[0]} alt=""/>}</div><div className="i"><b>{p.name}</b><br/><small>{Number(p.price)} {CURRENCY} · Stock : {p.stock} · {cats.find(c => c.id === p.category_id)?.name ?? 'Sans catégorie'}</small></div><button className="mini" onClick={() => startEdit(p)}>Modifier</button><button className="del" onClick={() => removeProduct(p)}>Supprimer</button></div>)}
      {products.length === 0 && <p className="empty">Aucun produit. Ajoutez le premier ci-dessus.</p>}
    </> : <>
      <h2 className="adminTitle">Gérer les catégories</h2>
      <form className="catform" onSubmit={addCategory}><input placeholder="Nouvelle catégorie" value={catName} onChange={e => setCatName(e.target.value)} required/><button className="btn">Ajouter</button></form>
      {editingCat && <form className="catform" onSubmit={updateCategory}><input value={editingCatName} onChange={e => setEditingCatName(e.target.value)} required/><button className="btn">Enregistrer</button><button type="button" className="tab" onClick={() => setEditingCat(null)}>Annuler</button></form>}
      {cats.map(c => <div className="row" key={c.id}><div className="i"><b>{c.name}</b></div><button className="mini" onClick={() => { setEditingCat(c); setEditingCatName(c.name) }}>Modifier</button><button className="del" onClick={() => removeCategory(c)}>Supprimer</button></div>)}
    </>}
  </div>
}
