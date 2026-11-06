import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Package, Layers3, Warehouse, ShoppingBag, Users,
  CreditCard, Settings, LogOut, Plus, Search, Pencil, Archive, ImagePlus,
  RefreshCw, Menu, X, CheckCircle2, AlertCircle, LoaderCircle, Upload
} from 'lucide-react';
import { supabase, supabaseConfigured } from './supabase';

const money = (value) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const emptyProduct = { sku: '', name: '', slug: '', collection_id: '', product_type: '', color: '', description: '', size: '', price_bdt: '', compare_at_price_bdt: '', badge: '', is_featured: false, is_bestseller: false, is_published: false, display_order: 0, stock: 0 };

function Notice({ notice, clear }) {
  if (!notice) return null;
  return <div className={`notice ${notice.type}`} role="status"><span>{notice.message}</span><button onClick={clear} aria-label="Dismiss"><X size={16}/></button></div>;
}

function Login({ onLogin, busy, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return <main className="login-wrap"><section className="login-card">
    <div className="brand-mark">Z</div><p className="eyebrow">ZARIAH STUDIO</p><h1>Admin Portal</h1>
    <p className="muted">Sign in to manage your store.</p>
    <form onSubmit={(e) => { e.preventDefault(); onLogin(email.trim(), password); }}>
      <label>Email address<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com"/></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"/></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary full" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : null} Sign in securely</button>
    </form>
    <p className="tiny muted">Access is restricted to approved staff accounts.</p>
  </section></main>;
}

function ProductEditor({ product, collections, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => product ? {
    ...emptyProduct, ...product,
    stock: product.inventory?.[0]?.on_hand ?? 0,
    size: product.specifications?.size || '',
    compare_at_price_bdt: product.compare_at_price_bdt ?? ''
  } : emptyProduct);
  const [images, setImages] = useState([]);
  const [stockTouched, setStockTouched] = useState(false);
  const [error, setError] = useState('');
  const change = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.collection_id) return setError('Select a collection.');
    if (!(form.sku ?? '').trim() || !(form.name ?? '').trim() || Number(form.price_bdt) < 0 || form.price_bdt === '') return setError('SKU, name and a valid price are required.');
    if (images.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) return setError('Images must be JPG, PNG or WebP and no larger than 10 MB each.');
    const payload = {
      sku: (form.sku ?? '').trim(), name: (form.name ?? '').trim(),
      slug: (form.slug ?? '').trim() || slugify(form.name ?? ''),
      collection_id: form.collection_id,
      product_type: (form.product_type ?? '').trim() || null,
      color: (form.color ?? '').trim() || null,
      description: (form.description ?? '').trim() || null,
      specifications: { size: (form.size ?? '').trim() },
      price_bdt: Number(form.price_bdt),
      compare_at_price_bdt: form.compare_at_price_bdt === '' ? null : Number(form.compare_at_price_bdt),
      badge: (form.badge ?? '').trim() || null,
      is_featured: Boolean(form.is_featured),
      is_bestseller: Boolean(form.is_bestseller),
      is_published: Boolean(form.is_published),
      display_order: Number(form.display_order || 0)
    };
    try { await onSave(payload, Number(form.stock || 0), images, stockTouched); }
    catch (err) { setError(err.message || 'Could not save product.'); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="editor modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <header className="modal-head"><div><p className="eyebrow">CATALOGUE</p><h2 id="editor-title">{product ? 'Edit product' : 'Add product'}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X/></button></header>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label>Product name *<input required value={form.name} onChange={e => change('name', e.target.value)} placeholder="Crescent Shoulder Bag"/></label>
          <label>SKU *<input required value={form.sku} onChange={e => change('sku', e.target.value)} placeholder="Essence07"/></label>
          <label>Collection *<select required value={form.collection_id} onChange={e => change('collection_id', e.target.value)}><option value="">Choose collection</option>{collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Product type<input value={form.product_type || ''} onChange={e => change('product_type', e.target.value)} placeholder="Shoulder Bag"/></label>
          <label>Price (BDT) *<input type="number" min="0" step="1" required value={form.price_bdt} onChange={e => change('price_bdt', e.target.value)}/></label>
          <label>Compare-at price (BDT)<input type="number" min="0" step="1" value={form.compare_at_price_bdt} onChange={e => change('compare_at_price_bdt', e.target.value)}/></label>
          <label>Colour<input value={form.color || ''} onChange={e => change('color', e.target.value)} placeholder="Black / Taupe"/></label>
          <label>Available stock<input type="number" min="0" step="1" value={form.stock} onChange={e => { change('stock', e.target.value); setStockTouched(true); }}/></label>
          <label className="span-2">Product description<textarea rows="3" value={form.description || ''} onChange={e => change('description', e.target.value)} placeholder="Describe the bag..."/></label>
          <label className="span-2">Size / specifications<input value={form.size || ''} onChange={e => change('size', e.target.value)} placeholder="Medium · L 26cm × H 20cm × D 10cm"/></label>
          <label>Badge<input value={form.badge || ''} onChange={e => change('badge', e.target.value)} placeholder="New / Bestseller"/></label>
          <label>Display order<input type="number" value={form.display_order} onChange={e => change('display_order', e.target.value)}/></label>
          <label className="upload-box span-2"><Upload size={19}/><span><strong>Upload product images</strong><small>JPG, PNG or WebP · up to 10 MB each</small></span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => setImages(Array.from(e.target.files || []))}/></label>
          {images.length > 0 && <p className="span-2 tiny muted">{images.length} new image(s) selected: {images.map(f => f.name).join(', ')}</p>}
          <div className="checks span-2">
            <label className="check"><input type="checkbox" checked={form.is_featured} onChange={e => change('is_featured', e.target.checked)}/> Featured</label>
            <label className="check"><input type="checkbox" checked={form.is_bestseller} onChange={e => change('is_bestseller', e.target.checked)}/> Bestseller</label>
            <label className="check"><input type="checkbox" checked={form.is_published} onChange={e => change('is_published', e.target.checked)}/> Publish on website</label>
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <footer className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16}/> : null} Save product</button></footer>
      </form>
    </section>
  </div>;
}

function CollectionPanel({ collections, onCreate, onToggle, saving }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  return <section className="panel">
    <div className="panel-head"><div><p className="eyebrow">CATALOGUE ORGANISATION</p><h2>Collections</h2><p className="muted">Create and manage collections without editing website code.</p></div></div>
    <form className="inline-create" onSubmit={async e => { e.preventDefault(); if (!name.trim()) return; await onCreate(name.trim(), description.trim()); setName(''); setDescription(''); }}>
      <input required value={name} onChange={e => setName(e.target.value)} placeholder="New collection name"/>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)"/>
      <button className="primary" disabled={saving}><Plus size={16}/> Add collection</button>
    </form>
    <div className="collection-list">{collections.map(c => <div className="collection-row" key={c.id}><div><strong>{c.name}</strong><small>{c.slug}</small></div><span className={c.is_active ? 'status live' : 'status'}>{c.is_active ? 'Active' : 'Hidden'}</span><button className="secondary small" onClick={() => onToggle(c)}>{c.is_active ? 'Hide' : 'Activate'}</button></div>)}</div>
  </section>;
}


const MEDIA_SLOTS = [
  {key:'hero.desktop',label:'Hero — Desktop',group:'Hero'},
  {key:'hero.mobile',label:'Hero — Mobile',group:'Hero'},
  {key:'collection.essence.cover',label:'Essence Collection Cover',group:'Collections'},
  {key:'collection.signature.cover',label:'Signature Collection Cover',group:'Collections'},
  {key:'collection.noir.cover',label:'Noir Collection Cover',group:'Collections'},
  {key:'campaign.main',label:'Main Promotional Banner',group:'Campaigns'},
  {key:'lookbook.main',label:'Lookbook Editorial Image',group:'Editorial'},
  {key:'about.main',label:'About Us Image',group:'Editorial'},
  {key:'brand.footer',label:'Footer Brand Visual',group:'Brand'}
];
function MediaPanel({assets,onUpload,onToggle,saving}) {
 const [files,setFiles]=useState({}); const [alts,setAlts]=useState({});
 return <section className="panel"><div className="panel-head"><div><p className="eyebrow">WEBSITE CONTENT</p><h2>Media Library</h2><p className="muted">Replace website images without editing code. Existing images remain as fallback until a replacement is published.</p></div></div>
 <div className="media-grid">{MEDIA_SLOTS.map(slot=>{const asset=assets.find(a=>a.slot_key===slot.key);return <article className="media-card" key={slot.key}><div className="media-preview">{asset?.public_url?<img src={asset.public_url} alt={asset.alt_text||slot.label}/>:<div className="thumb-placeholder"><ImagePlus size={24}/><span>Current website image</span></div>}</div><div className="media-meta"><small>{slot.group}</small><strong>{slot.label}</strong><span className={asset?.is_published?'status live':'status'}>{asset?.is_published?'Published':'Using website default'}</span></div><label className="field-label">Alt text<input value={alts[slot.key]??asset?.alt_text??''} onChange={e=>setAlts(v=>({...v,[slot.key]:e.target.value}))} placeholder="Describe this image"/></label><label className="upload-box"><Upload size={17}/><span><strong>{asset?'Replace image':'Upload image'}</strong><small>JPG, PNG or WebP · max 10 MB</small></span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFiles(v=>({...v,[slot.key]:e.target.files?.[0]||null}))}/></label>{files[slot.key]&&<><small className="muted">{files[slot.key].name}</small><button className="primary full" disabled={saving} onClick={()=>onUpload(slot,files[slot.key],alts[slot.key]??asset?.alt_text??'')}>Upload & publish</button></>}{asset&&<button className="secondary small" onClick={()=>onToggle(asset)}>{asset.is_published?'Unpublish':'Publish'}</button>}</article>})}</div></section>;
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [notice, setNotice] = useState(null);
  const [section, setSection] = useState('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const notify = (type, message) => setNotice({ type, message });
  const loadData = useCallback(async () => {
    if (!supabase || !session) return;
    setDataLoading(true);
    const [p, c, m] = await Promise.all([
      supabase.from('products').select('*, collections(name), product_images(*), inventory(on_hand,reserved,stock_counted)').order('display_order').order('created_at', { ascending: false }),
      supabase.from('collections').select('*').order('display_order').order('name'),
      supabase.from('site_media').select('*').order('slot_key')
    ]);
    if (p.error) notify('error', p.error.message); else setProducts(p.data || []);
    if (c.error) notify('error', c.error.message); else setCollections(c.data || []);
    if (m.error) notify('error', 'Media library: '+m.error.message); else setMediaAssets(m.data || []);
    setDataLoading(false);
  }, [session]);

  const verifySession = useCallback(async (current) => {
    if (!current || !supabase) { setSession(null); setProfile(null); setLoading(false); return; }
    setSession(current);
    const { data, error } = await supabase.from('profiles').select('id,display_name,role').eq('id', current.user.id).single();
    if (error || !data || !['admin','staff'].includes(data.role)) {
      await supabase.auth.signOut();
      setSession(null); setProfile(null);
      setLoginError('This account is not authorised for ZARIAH Studio Admin.');
    } else setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => verifySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (next) { setSession(next); setTimeout(() => verifySession(next), 0); }
      else { setSession(null); setProfile(null); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, [verifySession]);

  useEffect(() => { if (session && profile) loadData(); }, [session, profile, loadData]);

  const signIn = async (email, password) => {
    setLoginBusy(true); setLoginError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
    else await verifySession(data.session);
    setLoginBusy(false);
  };

  const saveProduct = async (payload, stock, imageFiles, stockTouched) => {
    setSaving(true);
    try {
      let productId = editor?.id;
      if (productId) {
        const { error } = await supabase.from('products').update(payload).eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = data.id;
      }
      const existingReserved = editor?.inventory?.[0]?.reserved ?? 0;
      const stockCounted = stockTouched || !editor?.id ? Boolean(stockTouched) : Boolean(editor?.inventory?.[0]?.stock_counted);
      const { error: stockError } = await supabase.from('inventory').upsert({ product_id: productId, on_hand: stock, reserved: existingReserved, low_stock_threshold: 2, stock_counted: stockCounted }, { onConflict: 'product_id' });
      if (stockError) throw stockError;
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const extension = file.name.split('.').pop().toLowerCase();
        const path = `${productId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(path);
        const { error: imageError } = await supabase.from('product_images').insert({
          product_id: productId, storage_path: path, public_url: publicData.publicUrl,
          alt_text: `${payload.name} product image`, image_role: i === 0 ? 'front' : 'gallery', display_order: i
        });
        if (imageError) throw imageError;
      }
      await loadData(); setEditor(null);
      notify('success', editor ? 'Product updated.' : 'Product created.');
    } finally { setSaving(false); }
  };

  const uploadMedia = async (slot,file,altText) => {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10*1024*1024) return notify('error','Choose JPG, PNG or WebP up to 10 MB.');
    setSaving(true); try {
      const ext=file.name.split('.').pop().toLowerCase(); const path='site-media/'+slot.key+'/'+crypto.randomUUID()+'.'+ext;
      const {error:upErr}=await supabase.storage.from('product-images').upload(path,file,{contentType:file.type,upsert:false}); if(upErr) throw upErr;
      const {data:urlData}=supabase.storage.from('product-images').getPublicUrl(path);
      const {error}=await supabase.from('site_media').upsert({slot_key:slot.key,label:slot.label,storage_path:path,public_url:urlData.publicUrl,alt_text:altText,is_published:true,updated_at:new Date().toISOString()},{onConflict:'slot_key'}); if(error) throw error;
      await loadData(); notify('success',slot.label+' published.');
    } catch(e){notify('error',e.message||'Image upload failed.');} finally{setSaving(false);}
  };
  const toggleMedia = async (asset) => {const {error}=await supabase.from('site_media').update({is_published:!asset.is_published,updated_at:new Date().toISOString()}).eq('id',asset.id);if(error)notify('error',error.message);else{await loadData();notify('success','Image visibility updated.');}};

  const archiveProduct = async (product) => {
    if (!window.confirm(`Archive “${product.name}”? It will no longer appear on the storefront.`)) return;
    const { error } = await supabase.from('products').update({ is_published: false }).eq('id', product.id);
    if (error) notify('error', error.message); else { await loadData(); notify('success', 'Product archived (not permanently deleted).'); }
  };

  const createCollection = async (name, description) => {
    setSaving(true);
    const slug = slugify(name);
    const { error } = await supabase.from('collections').insert({ name, slug, description, display_order: collections.length });
    setSaving(false);
    if (error) notify('error', error.message); else { await loadData(); notify('success', 'Collection created.'); }
  };

  const toggleCollection = async (collection) => {
    const { error } = await supabase.from('collections').update({ is_active: !collection.is_active }).eq('id', collection.id);
    if (error) notify('error', error.message); else { await loadData(); notify('success', 'Collection updated.'); }
  };

  const adjustStock = async (product, nextValue) => {
    const quantity = Number(nextValue);
    if (!Number.isInteger(quantity) || quantity < 0) return notify('error', 'Stock must be a non-negative whole number.');
    const { error } = await supabase.from('inventory').upsert({ product_id: product.id, on_hand: quantity, reserved: product.inventory?.[0]?.reserved || 0, low_stock_threshold: 2, stock_counted: true }, { onConflict: 'product_id' });
    if (error) notify('error', error.message); else { await loadData(); notify('success', 'Stock updated.'); }
  };

  const filtered = useMemo(() => products.filter(p => [p.name,p.sku,p.collections?.name].join(' ').toLowerCase().includes(search.toLowerCase())), [products, search]);
  const published = products.filter(p => p.is_published).length;
  const lowStock = products.filter(p => (p.inventory?.[0]?.on_hand ?? 0) <= 2).length;

  if (!supabaseConfigured) return <main className="setup-wrap"><section className="setup-card"><div className="brand-mark">Z</div><p className="eyebrow">ZARIAH STUDIO</p><h1>Admin setup required</h1><p className="muted">The admin app is ready for configuration. Add the Supabase Project URL and anon/public key to <code>admin-app/.env.local</code> for local testing. Never use the service_role key in the browser.</p><p className="tiny muted">Project: zariah-studio-sg · Region: Singapore</p></section></main>;
  if (loading) return <main className="setup-wrap"><LoaderCircle className="spin" size={28}/><span className="muted">Checking secure admin session…</span></main>;
  if (!session || !profile) return <><Login onLogin={signIn} busy={loginBusy} error={loginError}/></>;

  const nav = [
    ['dashboard','Overview',LayoutDashboard],['products','Products',Package],['collections','Collections',Layers3],['media','Website Images',ImagePlus],['inventory','Inventory',Warehouse],
    ['orders','Orders',ShoppingBag],['customers','Customers & Members',Users],['payments','Payments',CreditCard]
  ];
  const title = nav.find(n => n[0] === section)?.[1] || 'Overview';

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="side-brand"><div className="brand-mark small-mark">Z</div><div><strong>ZARIAH</strong><small>STUDIO ADMIN</small></div><button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X/></button></div>
      <p className="nav-label">MANAGEMENT</p>
      {nav.map(([key,label,Icon]) => <button key={key} className={`nav-item ${section === key ? 'active' : ''}`} onClick={() => { setSection(key); setMobileNav(false); }}><Icon size={18}/><span>{label}</span>{key === 'products' && <em>{products.length}</em>}</button>)}
      <div className="side-bottom"><div className="profile-mini"><div className="avatar">Z</div><div><strong>{profile.display_name || 'Admin'}</strong><small>{session.user.email}</small></div></div><button className="nav-item logout" onClick={() => supabase.auth.signOut()}><LogOut size={18}/> Sign out</button></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu"/>}
    <main className="main-area">
      <header className="topbar"><button className="icon-btn menu-toggle" onClick={() => setMobileNav(true)}><Menu/></button><div><p className="eyebrow">ZARIAH STUDIO / ADMIN</p><h1>{title}</h1></div><button className="secondary refresh" onClick={loadData}><RefreshCw size={15}/> Refresh</button></header>
      <div className="content"><Notice notice={notice} clear={() => setNotice(null)}/>
        {section === 'dashboard' && <><div className="welcome"><div><p className="eyebrow">STORE OVERVIEW</p><h2>Good to see you, {profile.display_name || 'Admin'}.</h2><p className="muted">Your store management workspace.</p></div><span className="live-pill"><CheckCircle2 size={14}/> Secure session active</span></div>
          <div className="stat-grid"><Stat icon={Package} label="Total products" value={products.length}/><Stat icon={CheckCircle2} label="Published" value={published}/><Stat icon={Layers3} label="Collections" value={collections.length}/><Stat icon={AlertCircle} label="Low stock" value={lowStock}/></div>
          <section className="panel"><div className="panel-head"><div><p className="eyebrow">QUICK ACTIONS</p><h2>Manage your catalogue</h2></div></div><div className="quick-actions"><button className="quick-card" onClick={() => { setEditor({}); setSection('products'); }}><Plus/><strong>Add a product</strong><small>Publish a new bag without code changes</small></button><button className="quick-card" onClick={() => setSection('collections')}><Layers3/><strong>Manage collections</strong><small>Create and organise product ranges</small></button><button className="quick-card" onClick={() => setSection('inventory')}><Warehouse/><strong>Update inventory</strong><small>Adjust available stock</small></button></div></section>
        </>}
        {section === 'products' && <section className="panel"><div className="panel-head split"><div><p className="eyebrow">CATALOGUE</p><h2>Products <span className="count">{products.length}</span></h2><p className="muted">Add, edit, publish or archive products. No website code edits needed.</p></div><button className="primary" onClick={() => setEditor({})}><Plus size={16}/> Add product</button></div><div className="toolbar"><div className="searchbox"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, SKU or collection"/></div><button className="secondary" onClick={loadData}><RefreshCw size={15}/> Refresh</button></div>
          {dataLoading ? <Loading/> : <div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>Collection</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(p => <tr key={p.id}><td><div className="product-cell">{p.product_images?.[0]?.public_url ? <img src={p.product_images[0].public_url} alt="" /> : <div className="thumb-placeholder"><ImagePlus size={16}/></div>}<div><strong>{p.name}</strong><small>{p.product_type || '—'}</small></div></div></td><td>{p.sku}</td><td>{p.collections?.name || '—'}</td><td>{money(p.price_bdt)}</td><td>{p.inventory?.[0]?.on_hand ?? 0}</td><td><span className={`status ${p.is_published ? 'live' : ''}`}>{p.is_published ? 'Published' : 'Draft'}</span></td><td><div className="row-actions"><button className="icon-btn" title="Edit" onClick={() => setEditor(p)}><Pencil size={16}/></button><button className="icon-btn" title="Archive" onClick={() => archiveProduct(p)}><Archive size={16}/></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty">No products found. Add your first product.</div>}</div>}
        </section>}
        {section === 'collections' && <CollectionPanel collections={collections} onCreate={createCollection} onToggle={toggleCollection} saving={saving}/>}
        {section === 'media' && <MediaPanel assets={mediaAssets} onUpload={uploadMedia} onToggle={toggleMedia} saving={saving}/>}
        {section === 'inventory' && <section className="panel"><div className="panel-head"><div><p className="eyebrow">STOCK CONTROL</p><h2>Inventory</h2><p className="muted">Set the current on-hand quantity for each product.</p></div></div><div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>On hand</th><th>Stock level</th><th>Update quantity</th></tr></thead><tbody>{products.map(p => { const qty = p.inventory?.[0]?.on_hand ?? 0; return <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.sku}</td><td>{qty}</td><td><span className={`status ${qty > 2 ? 'live' : 'warning'}`}>{qty > 2 ? 'In stock' : 'Low stock'}</span></td><td><StockInput initial={qty} onSave={v => adjustStock(p,v)}/></td></tr>; })}</tbody></table></div></section>}
        {['orders','customers','payments'].includes(section) && <section className="panel coming"><div className="brand-mark">Z</div><p className="eyebrow">NEXT DEVELOPMENT MODULE</p><h2>{title}</h2><p className="muted">This module is reserved in the admin navigation. It will be enabled after secure order processing, customer records and payment verification workflows are implemented.</p></section>}
      </div>
    </main>
    {editor && <ProductEditor product={editor.id ? editor : null} collections={collections.filter(c => c.is_active)} onClose={() => setEditor(null)} onSave={saveProduct} saving={saving}/>}
  </div>;
}

function Stat({ icon: Icon, label, value }) { return <article className="stat-card"><span className="stat-icon"><Icon size={19}/></span><div><small>{label}</small><strong>{value}</strong></div></article>; }
function Loading() { return <div className="loading"><LoaderCircle className="spin"/><span>Loading catalogue…</span></div>; }
function StockInput({ initial, onSave }) { const [value,setValue] = useState(initial); useEffect(()=>setValue(initial),[initial]); return <div className="stock-edit"><input type="number" min="0" step="1" value={value} onChange={e=>setValue(e.target.value)}/><button className="secondary small" onClick={()=>onSave(value)}>Save</button></div>; }

export default App;
