import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Package, Layers3, Warehouse, ShoppingBag, Users,
  CreditCard, Settings, LogOut, Plus, Search, Pencil, Archive, ImagePlus,
  RefreshCw, Menu, X, CheckCircle2, AlertCircle, LoaderCircle, Upload, Receipt,
  Printer, MessageCircle, Award, TrendingUp, ShieldCheck, Eye, AlertTriangle
} from 'lucide-react';
import { supabase, supabaseConfigured } from './supabase';
import { processImageFile } from './imageProcessing';

const money = (value) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const emptyProduct = { sku: '', name: '', slug: '', collection_id: '', brand: '', brand_id: '', authenticity_status: 'not_yet_verified', product_type: '', color: '', description: '', size: '', price_bdt: '', cost_bdt: '', compare_at_price_bdt: '', badge: '', is_featured: false, is_bestseller: false, is_published: false, availability_mode: 'auto', display_order: 0, stock: 0 };

function Notice({ notice, clear }) {
  if (!notice) return null;
  return <div className={`notice ${notice.type}`} role="status"><span>{notice.message}</span><button onClick={clear} aria-label="Dismiss"><X size={16}/></button></div>;
}

function Login({ onLogin, onReset, busy, resetBusy, error, resetMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return <main className="login-wrap"><section className="login-card">
    <div className="brand-mark">Z</div><p className="eyebrow">ZARIAH STUDIO</p><h1>Admin Portal</h1>
    <p className="muted">Sign in to manage your store.</p>
    <form onSubmit={(e) => { e.preventDefault(); onLogin(email.trim(), password); }}>
      <label>Email address<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com"/></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"/></label>
      <div className="login-help"><button type="button" className="text-button" onClick={() => onReset(email.trim())} disabled={resetBusy || !email.trim()}>{resetBusy ? "Sending reset link…" : "Forgot password?"}</button></div>
      {resetMessage && <p className="tiny muted" role="status">{resetMessage}</p>}
      {error && <p className="form-error">{error}</p>}
      <button className="primary full" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : null} Sign in securely</button>
    </form>
    <p className="tiny muted">Access is restricted to approved staff accounts.</p>
  </section></main>;
}

function PasswordRecovery({ onSave, busy, error }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  return <main className="login-wrap"><section className="login-card"><div className="brand-mark">Z</div><p className="eyebrow">ZARIAH STUDIO</p><h1>Set new password</h1><p className="muted">Choose a new password for your admin account.</p><form onSubmit={e => { e.preventDefault(); if (password !== confirm) return; onSave(password); }}><label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label><label>Confirm password<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter new password"/></label>{confirm && password !== confirm && <p className="form-error">Passwords do not match.</p>}{error && <p className="form-error">{error}</p>}<button className="primary full" disabled={busy || password.length<8 || password!==confirm}>{busy ? 'Updating…' : 'Update password'}</button></form></section></main>;
}

function ProductEditor({ product, collections, brands, products, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => product ? {
    ...emptyProduct, ...product,
    stock: product.inventory?.[0]?.on_hand ?? 0,
    size: product.specifications?.size || '',
    compare_at_price_bdt: product.compare_at_price_bdt ?? '',
    cost_bdt: product.cost_bdt ?? '', purchase_cost: product.purchase_cost ?? product.cost_bdt ?? '', packaging_cost: product.packaging_cost ?? 0, inbound_shipping_cost: product.inbound_shipping_cost ?? 0, other_cost: product.other_cost ?? 0
  } : emptyProduct);
  const [images, setImages] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageError, setImageError] = useState('');
  const [stockTouched, setStockTouched] = useState(false);
  useEffect(() => () => processedImages.forEach(image => URL.revokeObjectURL(image.previewUrl)), [processedImages]);
  const handleImageSelection = async (files) => {
    setImages(files);
    setProcessedImages([]);
    setImageError('');
    if (!files.length) return;
    setImageProcessing(true);
    try {
      const results = await Promise.all(files.map(file => processImageFile(file, {
        width: 1200, height: 1600, background: '#f6f1ed'
      })));
      setProcessedImages(results.map(result => ({
        ...result,
        previewUrl: URL.createObjectURL(result.processedFile)
      })));
    } catch (error) {
      setImageError(error.message || 'Could not process one or more images.');
    } finally {
      setImageProcessing(false);
    }
  };
  const [error, setError] = useState('');
  const change = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.collection_id) return setError('Select a collection.');
    if (!(form.sku ?? '').trim() || !(form.name ?? '').trim() || Number(form.price_bdt) < 0 || form.price_bdt === '') return setError('SKU, name and a valid price are required.');
    if (images.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) return setError('Images must be JPG, PNG or WebP and no larger than 10 MB each.');
    const costParts = ['purchase_cost','packaging_cost','inbound_shipping_cost','other_cost'].map(key => Number(form[key] || 0));
    const calculatedCost = costParts.some(value => value > 0) ? costParts.reduce((sum,value)=>sum+value,0) : (form.cost_bdt === '' ? null : Number(form.cost_bdt));
    const payload = {
      sku: (form.sku ?? '').trim(), name: (form.name ?? '').trim(),
      slug: (form.slug ?? '').trim() || slugify(form.name ?? ''),
      collection_id: form.collection_id,
      brand: brands.find(b => b.id === form.brand_id)?.name || (form.brand ?? '').trim() || null,
      brand_id: form.brand_id || null,
      authenticity_status: form.authenticity_status || 'not_yet_verified',
      product_type: (form.product_type ?? '').trim() || null,
      color: (form.color ?? '').trim() || null,
      description: (form.description ?? '').trim() || null,
      specifications: { size: (form.size ?? '').trim() },
      price_bdt: Number(form.price_bdt),
      cost_bdt: calculatedCost, purchase_cost: form.purchase_cost === '' ? null : Number(form.purchase_cost), packaging_cost: Number(form.packaging_cost || 0), inbound_shipping_cost: Number(form.inbound_shipping_cost || 0), other_cost: Number(form.other_cost || 0),
      compare_at_price_bdt: form.compare_at_price_bdt === '' ? null : Number(form.compare_at_price_bdt),
      badge: (form.badge ?? '').trim() || null,
      is_featured: Boolean(form.is_featured),
      is_bestseller: Boolean(form.is_bestseller),
      is_published: Boolean(form.is_published),
      availability_mode: form.availability_mode === 'pre_order' ? 'pre_order' : 'auto',
      display_order: Number(form.display_order || 0)
    };
    try { await onSave(payload, Number(form.stock || 0), processedImages, stockTouched); }
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
          <label>Bag category<input list="zariah-bag-category-options" value={form.product_type || ''} onChange={e => change('product_type', e.target.value)} placeholder="Choose or add a bag category"/><datalist id="zariah-bag-category-options">{[...new Set(['Shoulder Bag','Crossbody','Tote','Top Handle','East-West','Flap Bag','Satchel','Bucket Bag','Bowling Bag','Underarm Bag',...products.map(item => item.product_type).filter(Boolean)])].sort((x,y)=>x.localeCompare(y)).map(type=><option key={type} value={type}/>)}</datalist></label>
          <label>Brand<select value={form.brand_id || ''} onChange={e=>{const id=e.target.value;change('brand_id',id);change('brand',brands.find(b=>b.id===id)?.name||'');}}><option value="">Unassigned</option>{brands.filter(b=>b.is_active).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <label>Authenticity status<select value={form.authenticity_status || 'not_yet_verified'} onChange={e=>change('authenticity_status',e.target.value)}><option value="not_yet_verified">Not yet verified</option><option value="sourcing_documented">Sourcing documented</option><option value="verified" disabled>Verified — requires evidence review</option><option value="not_applicable">Not applicable</option></select></label>
          <label>Price (BDT) *<input type="number" min="0" step="1" required value={form.price_bdt} onChange={e => change('price_bdt', e.target.value)}/></label>
          <label>Purchase cost (BDT)<input type="number" min="0" step="1" value={form.purchase_cost ?? ''} onChange={e => change('purchase_cost', e.target.value)} placeholder="Supplier purchase price"/></label>
          <label>Packaging cost (BDT)<input type="number" min="0" step="1" value={form.packaging_cost ?? 0} onChange={e => change('packaging_cost', e.target.value)}/></label>
          <label>Inbound shipping (BDT)<input type="number" min="0" step="1" value={form.inbound_shipping_cost ?? 0} onChange={e => change('inbound_shipping_cost', e.target.value)}/></label>
          <label>Other unit cost (BDT)<input type="number" min="0" step="1" value={form.other_cost ?? 0} onChange={e => change('other_cost', e.target.value)}/></label>
          <label>Calculated total unit cost (BDT)<input readOnly value={['purchase_cost','packaging_cost','inbound_shipping_cost','other_cost'].reduce((sum,key)=>sum+Number(form[key]||0),0)||form.cost_bdt||0}/></label>
          <label>Compare-at price (BDT)<input type="number" min="0" step="1" value={form.compare_at_price_bdt} onChange={e => change('compare_at_price_bdt', e.target.value)}/></label>
          <label>Colour<input value={form.color || ''} onChange={e => change('color', e.target.value)} placeholder="Black / Taupe"/></label>
          <label>Availability<select value={form.availability_mode || 'auto'} onChange={e => change('availability_mode', e.target.value)}><option value="auto">Automatic (based on inventory)</option><option value="pre_order">Pre-order available</option></select></label>
          <label>Available stock<input type="number" min="0" step="1" value={form.stock} onChange={e => { change('stock', e.target.value); setStockTouched(true); }}/></label>
          <label className="span-2">Product description<textarea rows="3" value={form.description || ''} onChange={e => change('description', e.target.value)} placeholder="Describe the bag..."/></label>
          <label className="span-2">Size / specifications<input value={form.size || ''} onChange={e => change('size', e.target.value)} placeholder="Medium · L 26cm × H 20cm × D 10cm"/></label>
          <label>Badge<input value={form.badge || ''} onChange={e => change('badge', e.target.value)} placeholder="New / Bestseller"/></label>
          <label>Display order<input type="number" value={form.display_order} onChange={e => change('display_order', e.target.value)}/></label>
          <label className="upload-box span-2"><Upload size={19}/><span><strong>Upload product images</strong><small>JPG, PNG or WebP · up to 10 MB each · auto-fit to 1200 × 1600</small></span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => handleImageSelection(Array.from(e.target.files || []))}/></label>
          {imageProcessing && <p className="span-2 tiny muted">Optimizing images…</p>}
          {imageError && <p className="span-2 form-error">{imageError}</p>}
          {processedImages.length > 0 && <div className="span-2 image-upload-previews">{processedImages.map((image, index) => <div className="image-upload-preview" key={image.originalFile.name + index}><img src={image.previewUrl} alt={image.originalFile.name + ' optimized preview'}/><span>{image.originalFile.name}</span><small>{image.width} × {image.height} · WebP</small></div>)}</div>}
          <div className="checks span-2">
            <label className="check"><input type="checkbox" checked={form.is_featured} onChange={e => change('is_featured', e.target.checked)}/> Featured</label>
            <label className="check"><input type="checkbox" checked={form.is_bestseller} onChange={e => change('is_bestseller', e.target.checked)}/> Bestseller</label>
            <label className="check"><input type="checkbox" checked={form.is_published} onChange={e => change('is_published', e.target.checked)}/> Publish on website</label>
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <footer className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving || imageProcessing || Boolean(imageError) || processedImages.length !== images.length}>{saving || imageProcessing ? <LoaderCircle className="spin" size={16}/> : null} Save product</button></footer>
      </form>
    </section>
  </div>;
}

function BrandSupplierPanel({ brands, suppliers, products, sources, evidence, onSaveBrand, onUpdateBrand, onToggleBrand, onSaveSupplier, onToggleSupplier, onSaveSource, onSaveEvidence, onViewEvidence, onVerifyEvidence, saving }) {
 const [brand,setBrand]=useState({name:'',brand_type:'established',authenticity_policy:'mixed',description:'',website_url:''});
 const [editingBrand,setEditingBrand]=useState(null);
 const [supplier,setSupplier]=useState({supplier_name:'',supplier_type:'local',contact_person:'',phone:'',email:'',country:'',internal_notes:''});
 const [source,setSource]=useState({product_id:'',supplier_id:'',supplier_sku:'',purchase_cost_bdt:'',lead_time_days:'',minimum_order_quantity:1,is_preferred:false,confirm_availability:false});
 const [error,setError]=useState('');
 const [evidenceForm,setEvidenceForm]=useState({product_id:'',evidence_type:'purchase_invoice',reference_number:'',notes:''});
 const [evidenceFile,setEvidenceFile]=useState(null);
 const field=(label,key,value,setter,type='text')=><label>{label}<input type={type} value={value[key]??''} onChange={e=>setter(v=>({...v,[key]:e.target.value}))}/></label>;
 return <div className="panel-stack">
  <section className="panel"><div className="panel-head"><div><p className="eyebrow">PUBLIC CATALOGUE</p><h2>Brand Directory</h2><p className="muted">Only active brand names and descriptions can appear publicly.</p></div></div>
   <form className="form-grid" onSubmit={async e=>{e.preventDefault();setError('');try{const payload={...brand,slug:brand.name.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),display_order:editingBrand?.display_order??brands.length};if(editingBrand)await onUpdateBrand(editingBrand.id,payload);else await onSaveBrand(payload);setBrand({name:'',brand_type:'established',authenticity_policy:'mixed',description:'',website_url:''});setEditingBrand(null);}catch(x){setError(x.message);}}}>
    
    <label>Brand name *<input required value={brand.name} onChange={e=>setBrand(v=>({...v,name:e.target.value}))}/></label>
    <label>Brand type<select value={brand.brand_type} onChange={e=>setBrand(v=>({...v,brand_type:e.target.value}))}><option value="established">Established brand</option><option value="zariah_edit">The ZARIAH Edit</option><option value="private_label">Private label</option></select></label>
    <label>Authenticity policy<select value={brand.authenticity_policy} onChange={e=>setBrand(v=>({...v,authenticity_policy:e.target.value}))}><option value="mixed">Mixed / item-level status</option><option value="verified_only">Verified only</option><option value="not_applicable">Not applicable</option></select></label>
    <label>Website<input type="url" value={brand.website_url} onChange={e=>setBrand(v=>({...v,website_url:e.target.value}))}/></label>
    <label className="span-2">Description<textarea rows="2" value={brand.description} onChange={e=>setBrand(v=>({...v,description:e.target.value}))}/></label>
    {error&&<p className="form-error span-2">{error}</p>}<div className="span-2"><button className="primary" disabled={saving||!brand.name.trim()}>{editingBrand?<Pencil size={16}/>:<Plus size={16}/>} {editingBrand?'Update brand':'Create brand'}</button>{editingBrand&&<button type="button" className="secondary" onClick={()=>{setEditingBrand(null);setBrand({name:'',brand_type:'established',authenticity_policy:'mixed',description:'',website_url:''});}}>Cancel edit</button>}</div>
   </form>
   <div className="collection-list">{brands.map(b=><div className="collection-row" key={b.id}><div><strong>{b.name}</strong><small>{b.brand_type.replaceAll('_',' ')} · {b.authenticity_policy.replaceAll('_',' ')}</small></div><span className={b.is_active?'status live':'status'}>{b.is_active?'Active':'Hidden'}</span><button className="secondary small" onClick={()=>{setEditingBrand(b);setBrand({name:b.name,brand_type:b.brand_type,authenticity_policy:b.authenticity_policy,description:b.description||'',website_url:b.website_url||''});setError('');}}><Pencil size={13}/> Edit</button><button className="secondary small" onClick={()=>onToggleBrand(b)}>{b.is_active?'Hide':'Activate'}</button></div>)}{!brands.length&&<div className="empty">No brands created. Existing products remain unassigned.</div>}</div>
  </section>
  <section className="panel"><div className="panel-head"><div><p className="eyebrow">PRIVATE SOURCING</p><h2>Supplier Directory</h2><p className="muted">Supplier identities and contact details are staff-only.</p></div></div>
   <form className="form-grid" onSubmit={async e=>{e.preventDefault();setError('');try{await onSaveSupplier(supplier);setSupplier({supplier_name:'',supplier_type:'local',contact_person:'',phone:'',email:'',country:'',internal_notes:''});}catch(x){setError(x.message);}}}>
    <label>Supplier name *<input required value={supplier.supplier_name} onChange={e=>setSupplier(v=>({...v,supplier_name:e.target.value}))}/></label>
    <label>Type<select value={supplier.supplier_type} onChange={e=>setSupplier(v=>({...v,supplier_type:e.target.value}))}><option value="local">Local</option><option value="international">International</option><option value="brand_authorized">Brand-authorized</option><option value="other">Other</option></select></label>
    <label>Contact person<input value={supplier.contact_person} onChange={e=>setSupplier(v=>({...v,contact_person:e.target.value}))}/></label><label>Phone<input value={supplier.phone} onChange={e=>setSupplier(v=>({...v,phone:e.target.value}))}/></label><label>Email<input type="email" value={supplier.email} onChange={e=>setSupplier(v=>({...v,email:e.target.value}))}/></label><label>Country<input value={supplier.country} onChange={e=>setSupplier(v=>({...v,country:e.target.value}))}/></label>
    <label className="span-2">Internal notes<textarea rows="2" value={supplier.internal_notes} onChange={e=>setSupplier(v=>({...v,internal_notes:e.target.value}))}/></label>
    {error&&<p className="form-error span-2">{error}</p>}<div className="span-2"><button className="primary" disabled={saving||!supplier.supplier_name.trim()}><Plus size={16}/> Add supplier</button></div>
   </form>
   <div className="collection-list">{suppliers.map(s=><div className="collection-row" key={s.id}><div><strong>{s.supplier_name}</strong><small>{s.supplier_type.replaceAll('_',' ')} · {[s.country,s.phone].filter(Boolean).join(' · ')}</small></div><span className={s.is_active?'status live':'status'}>{s.is_active?'Active':'Inactive'}</span><button className="secondary small" onClick={()=>onToggleSupplier(s)}>{s.is_active?'Deactivate':'Activate'}</button></div>)}</div>
  </section>
  <section className="panel"><div className="panel-head"><div><p className="eyebrow">SUPPLIER MAPPING</p><h2>Product Sources</h2><p className="muted">Internal supplier SKU, purchase cost, MOQ and lead time; never exposed to customers.</p></div></div>
   <form className="form-grid" onSubmit={async e=>{e.preventDefault();setError('');try{await onSaveSource({...source,purchase_cost_bdt:source.purchase_cost_bdt===''?null:Number(source.purchase_cost_bdt),lead_time_days:source.lead_time_days===''?null:Number(source.lead_time_days),minimum_order_quantity:Number(source.minimum_order_quantity),availability_confirmed_at:source.confirm_availability?new Date().toISOString():null});setSource({product_id:'',supplier_id:'',supplier_sku:'',purchase_cost_bdt:'',lead_time_days:'',minimum_order_quantity:1,is_preferred:false,confirm_availability:false});}catch(x){setError(x.message);}}}>
    <label>Product *<select required value={source.product_id} onChange={e=>setSource(v=>({...v,product_id:e.target.value}))}><option value="">Choose product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}</select></label>
    <label>Supplier *<select required value={source.supplier_id} onChange={e=>setSource(v=>({...v,supplier_id:e.target.value}))}><option value="">Choose supplier</option>{suppliers.filter(s=>s.is_active).map(s=><option key={s.id} value={s.id}>{s.supplier_name}</option>)}</select></label>
    <label>Supplier SKU<input value={source.supplier_sku} onChange={e=>setSource(v=>({...v,supplier_sku:e.target.value}))}/></label>
    <label>Purchase cost (BDT)<input type="number" min="0" value={source.purchase_cost_bdt} onChange={e=>setSource(v=>({...v,purchase_cost_bdt:e.target.value}))}/></label>
    <label>Lead time (days)<input type="number" min="0" value={source.lead_time_days} onChange={e=>setSource(v=>({...v,lead_time_days:e.target.value}))}/></label>
    <label>MOQ<input type="number" min="1" value={source.minimum_order_quantity} onChange={e=>setSource(v=>({...v,minimum_order_quantity:e.target.value}))}/></label>
    <label className="check"><input type="checkbox" checked={source.is_preferred} onChange={e=>setSource(v=>({...v,is_preferred:e.target.checked}))}/> Preferred supplier</label><label className="check"><input type="checkbox" checked={source.confirm_availability} onChange={e=>setSource(v=>({...v,confirm_availability:e.target.checked}))}/> Supplier availability confirmed now</label>
    {error&&<p className="form-error span-2">{error}</p>}<div className="span-2"><button className="primary" disabled={saving||!source.product_id||!source.supplier_id}><Plus size={16}/> Save source link</button></div>
   </form>
   <div className="table-wrap"><table><thead><tr><th>Product</th><th>Supplier</th><th>SKU</th><th>Cost</th><th>Lead time</th><th>Availability confirmation</th><th>Preferred</th></tr></thead><tbody>{sources.map(s=><tr key={s.id}><td>{s.products?.name||'—'}</td><td>{s.suppliers?.supplier_name||'—'}</td><td>{s.supplier_sku||'—'}</td><td>{s.purchase_cost_bdt==null?'—':money(s.purchase_cost_bdt)}</td><td>{s.lead_time_days==null?'—':s.lead_time_days+' days'}</td><td>{s.availability_confirmed_at && Date.now()-new Date(s.availability_confirmed_at).getTime()<86400000?<span className="status live">Confirmed · {new Date(s.availability_confirmed_at).toLocaleString('en-GB')}</span>:<span className="status warning">Confirmation required</span>}</td><td>{s.is_preferred?'Yes':'No'}</td></tr>)}</tbody></table></div>
  </section>
  <section className="panel"><div className="panel-head"><div><p className="eyebrow">AUTHENTICITY CONTROL</p><h2>Evidence & Verification</h2><p className="muted">Private invoices, certificates and supplier declarations. Verification must be an explicit staff review.</p></div></div>
   <form className="form-grid" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;setError('');try{if(!evidenceFile)throw new Error('Choose a supporting PDF or image.');await onSaveEvidence(evidenceForm,evidenceFile);setEvidenceForm({product_id:'',evidence_type:'purchase_invoice',reference_number:'',notes:''});setEvidenceFile(null);form.reset();}catch(x){setError(x.message);}}}>
    <label>Product *<select required value={evidenceForm.product_id} onChange={e=>setEvidenceForm(v=>({...v,product_id:e.target.value}))}><option value="">Choose product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.sku}</option>)}</select></label>
    <label>Evidence type<select value={evidenceForm.evidence_type} onChange={e=>setEvidenceForm(v=>({...v,evidence_type:e.target.value}))}><option value="purchase_invoice">Purchase invoice</option><option value="authorization">Brand authorization</option><option value="certificate">Certificate</option><option value="supplier_declaration">Supplier declaration</option><option value="other">Other</option></select></label>
    <label>Reference number<input value={evidenceForm.reference_number} onChange={e=>setEvidenceForm(v=>({...v,reference_number:e.target.value}))}/></label>
    <label>Supporting file *<input required type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e=>setEvidenceFile(e.target.files?.[0]||null)}/><small>Private storage · PDF/JPG/PNG/WebP · max 10 MB</small></label>
    <label className="span-2">Internal review notes<textarea rows="2" value={evidenceForm.notes} onChange={e=>setEvidenceForm(v=>({...v,notes:e.target.value}))}/></label>
    {error&&<p className="form-error span-2">{error}</p>}<div className="span-2"><button className="primary" disabled={saving||!evidenceForm.product_id||!evidenceFile}><Upload size={16}/> Upload evidence</button></div>
   </form>
   <div className="table-wrap"><table><thead><tr><th>Product</th><th>Evidence</th><th>Reference</th><th>Review</th><th>Action</th></tr></thead><tbody>{evidence.map(e=><tr key={e.id}><td><strong>{e.products?.name||'Product'}</strong><small className="muted" style={{display:'block'}}>{e.products?.sku||''}</small></td><td>{e.evidence_type.replaceAll('_',' ')}</td><td>{e.reference_number||'—'}</td><td>{e.verified_at?<span className="status live">Verified</span>:<span className="status warning">Pending review</span>}</td><td><button className="secondary small" onClick={()=>onViewEvidence(e)}>View file</button> {!e.verified_at&&<button className="secondary small" onClick={()=>onVerifyEvidence(e)}>Approve evidence</button>}</td></tr>)}</tbody></table>{!evidence.length&&<div className="empty">No evidence uploaded yet.</div>}</div>
  </section>
 </div>;
}

function CollectionPanel({ collections, onCreate, onUpdate, onToggle, saving }) {
  const emptyForm = { name: '', description: '' };
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    setError('');
    try {
      if (editing) await onUpdate(editing.id, name, form.description.trim());
      else await onCreate(name, form.description.trim());
      setForm(emptyForm);
      setEditing(null);
    } catch (err) { setError(err.message || 'Could not save collection.'); }
  };
  const startEdit = collection => {
    setEditing(collection);
    setForm({ name: collection.name, description: collection.description || '' });
    setError('');
  };
  const cancelEdit = () => { setEditing(null); setForm(emptyForm); setError(''); };
  return <section className="panel">
    <div className="panel-head"><div><p className="eyebrow">CATALOGUE ORGANISATION</p><h2>Collections</h2><p className="muted">Create, edit and manage the collections shown in the published catalogue. Hiding a collection does not delete its products.</p></div></div>
    <form className="inline-create" onSubmit={submit}>
      <input required maxLength="60" value={form.name} onChange={e => setForm(v => ({...v, name:e.target.value}))} placeholder="Collection name"/>
      <input maxLength="240" value={form.description} onChange={e => setForm(v => ({...v, description:e.target.value}))} placeholder="Short description (optional)"/>
      <button className="primary" disabled={saving || !form.name.trim()}>{editing ? <Pencil size={16}/> : <Plus size={16}/>} {editing ? 'Save changes' : 'Add collection'}</button>
      {editing && <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button>}
    </form>
    {error && <p className="form-error">{error}</p>}
    <div className="collection-list">{collections.map(c => <div className="collection-row" key={c.id}><div><strong>{c.name}</strong><small>{c.slug}{c.description ? ' · ' + c.description : ''}</small></div><span className={c.is_active ? 'status live' : 'status'}>{c.is_active ? 'Active' : 'Hidden'}</span><button className="secondary small" onClick={() => startEdit(c)}><Pencil size={13}/> Edit</button><button className="secondary small" onClick={() => onToggle(c)}>{c.is_active ? 'Hide' : 'Activate'}</button></div>)}</div>
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
function mediaDimensions(slotKey) {
  return ({
    'hero.desktop': [1920,1080], 'hero.mobile': [1080,1600],
    'campaign.main': [1920,900], 'lookbook.main': [1200,1800],
    'about.main': [1600,1200], 'brand.footer': [1600,900],
    'collection.essence.cover': [1200,1600],
    'collection.signature.cover': [1200,1600],
    'collection.noir.cover': [1200,1600]
  })[slotKey] || [1920,1920];
}
function MediaPanel({assets,onUpload,onToggle,saving}) {
 const [files,setFiles]=useState({}); const [alts,setAlts]=useState({}); const [processing,setProcessing]=useState({});
 const chooseFile=async(slot,file)=>{
   if(!file)return;
   setProcessing(v=>({...v,[slot.key]:true}));
   try{
     const [width,height]=mediaDimensions(slot.key);
     const result=await processImageFile(file,{width,height,background:'#f6f1ed'});
     setFiles(v=>{if(v[slot.key]?.previewUrl)URL.revokeObjectURL(v[slot.key].previewUrl);return {...v,[slot.key]:{...result,previewUrl:URL.createObjectURL(result.processedFile)}};});
   }catch(error){setFiles(v=>({...v,[slot.key]:null}));window.alert(error.message||'Image processing failed.');}
   finally{setProcessing(v=>({...v,[slot.key]:false}));}
 };
 return <section className="panel"><div className="panel-head"><div><p className="eyebrow">WEBSITE CONTENT</p><h2>Media Library</h2><p className="muted">Replace website images without editing code. Images are automatically fitted, compressed and converted to WebP. Original uploads are backed up.</p></div></div>
 <div className="media-grid">{MEDIA_SLOTS.map(slot=>{const asset=assets.find(a=>a.slot_key===slot.key);const selected=files[slot.key];return <article className="media-card" key={slot.key}><div className="media-preview">{selected?.previewUrl?<img src={selected.previewUrl} alt={slot.label+' optimized preview'}/>:asset?.public_url?<img src={asset.public_url} alt={asset.alt_text||slot.label}/>:<div className="thumb-placeholder"><ImagePlus size={24}/><span>Current website image</span></div>}</div><div className="media-meta"><small>{slot.group}</small><strong>{slot.label}</strong><span className={asset?.is_published?'status live':'status'}>{asset?.is_published?'Published':'Using website default'}</span></div><label className="field-label">Alt text<input value={alts[slot.key]??asset?.alt_text??''} onChange={e=>setAlts(v=>({...v,[slot.key]:e.target.value}))} placeholder="Describe this image"/></label><label className="upload-box"><Upload size={17}/><span><strong>{asset?'Replace image':'Upload image'}</strong><small>JPG, PNG or WebP · max 10 MB · auto-fit to slot dimensions</small></span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseFile(slot,e.target.files?.[0])}/></label>{processing[slot.key]&&<small className="muted">Optimizing preview…</small>}{selected&&<><small className="muted">{selected.originalFile.name} · {selected.width} × {selected.height} WebP</small><button className="primary full" disabled={saving||processing[slot.key]} onClick={async()=>{const uploaded=await onUpload(slot,selected,alts[slot.key]??asset?.alt_text??'');if(uploaded){URL.revokeObjectURL(selected.previewUrl);setFiles(v=>({...v,[slot.key]:null}));}}}>Upload & publish</button></>}{asset&&<button className="secondary small" onClick={()=>onToggle(asset)}>{asset.is_published?'Unpublish':'Publish'}</button>}</article>})}</div></section>;
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [resetMode, setResetMode] = useState(() => new URLSearchParams(window.location.search).has('reset-password'));
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [notice, setNotice] = useState(null);
  const [section, setSection] = useState('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productSources, setProductSources] = useState([]);
  const [authenticityEvidence, setAuthenticityEvidence] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerEditor, setCustomerEditor] = useState(null);
  const [analyticsOrders, setAnalyticsOrders] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [posOpen, setPosOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState('new');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingMessage, setTrackingMessage] = useState('');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const notify = (type, message) => setNotice({ type, message });
  const loadData = useCallback(async () => {
    if (!supabase || !session) return;
    setDataLoading(true);
    const [p, c, m, costs, b, s, ps, ev] = await Promise.all([
      supabase.from('products').select('*, collections(name), product_images(*), inventory(on_hand,reserved,stock_counted,low_stock_threshold)').order('display_order').order('created_at', { ascending: false }),
      supabase.from('collections').select('*').order('display_order').order('name'),
      supabase.from('site_media').select('*').order('slot_key'),
      supabase.from('product_costs').select('product_id,cost_bdt,purchase_cost,packaging_cost,inbound_shipping_cost,other_cost'),
      supabase.from('brands').select('*').order('display_order').order('name'),
      supabase.from('suppliers').select('*').order('supplier_name'),
      supabase.from('product_sources').select('*,products(name,sku),suppliers(supplier_name)').order('created_at',{ascending:false}),
      supabase.from('authenticity_evidence').select('*,products(name,sku)').order('created_at',{ascending:false})
    ]);
    if (p.error) notify('error', p.error.message);
    else {
      if (costs.error) notify('error', 'Product costs: ' + costs.error.message);
      const costByProduct = new Map((costs.data || []).map(row => [row.product_id, row]));
      setProducts((p.data || []).map(product => ({ ...product, ...(costByProduct.get(product.id) || {}), cost_bdt: costByProduct.get(product.id)?.cost_bdt ?? '' })));
    }
    if (c.error) notify('error', c.error.message); else setCollections(c.data || []);
    if (m.error) notify('error', 'Media library: '+m.error.message); else setMediaAssets(m.data || []);
    if (b.error) notify('error','Brands: '+b.error.message); else setBrands(b.data||[]);
    if (s.error) notify('error','Suppliers: '+s.error.message); else setSuppliers(s.data||[]);
    if (ps.error) notify('error','Product sources: '+ps.error.message); else setProductSources(ps.data||[]);
    if (ev.error) notify('error','Authenticity evidence: '+ev.error.message); else setAuthenticityEvidence(ev.data||[]);
    setDataLoading(false);
  }, [session]);

  const loadOrders = useCallback(async () => {
    if (!supabase || !session) return;
    setDataLoading(true);
    const { data, error } = await supabase.from('orders')
      .select('id,order_number,receipt_number,source,status,subtotal_bdt,discount_bdt,delivery_fee_bdt,total_bdt,payment_status,payment_method,payment_reference,notes,created_at,updated_at,courier_name,courier_tracking_number,shipped_at,delivered_at,customers(full_name,phone,email,address,district),order_items(name_snapshot,sku_snapshot,quantity,unit_price_bdt,line_total_bdt),payments(id,method,amount_bdt,status,reference,created_at:received_at,verified_at),order_tracking_events(id,status,message,event_time)')
      .order('created_at', { ascending: false });
    if (error) notify('error', 'Orders: ' + error.message);
    else setOrders(data || []);
    setDataLoading(false);
  }, [session]);

  const loadAnalytics = useCallback(async () => {
    if (!supabase || !session) return;
    setAnalyticsLoading(true);
    const [orderResult, movementResult] = await Promise.all([
      supabase.from('orders')
        .select('id,status,created_at,source,total_bdt,order_items(product_id,sku_snapshot,name_snapshot,quantity,line_total_bdt,unit_cost_snapshot,brand_snapshot)')
        .order('created_at', { ascending: false }).limit(5000),
      supabase.from('inventory_movements')
        .select('id,product_id,quantity_delta,reason,reference,created_at,products(name,sku)')
        .order('created_at', { ascending: false }).limit(100)
    ]);
    if (orderResult.error) notify('error', 'Sales analytics: ' + orderResult.error.message);
    else setAnalyticsOrders(orderResult.data || []);
    if (movementResult.error) notify('error', 'Inventory movements: ' + movementResult.error.message);
    else setStockMovements(movementResult.data || []);
    setAnalyticsLoading(false);
  }, [session]);

  const loadCustomers = useCallback(async () => {
    if (!supabase || !session) return;
    setCustomersLoading(true);
    const { data, error } = await supabase.from('customers')
      .select('id,full_name,phone,email,address,district,created_at,loyalty:customer_loyalty_accounts(points_balance,lifetime_points,lifetime_spend_bdt,tier,updated_at),loyalty_transactions(points_delta,spend_delta_bdt,status,created_at,payment_id),orders(id,order_number,receipt_number,source,status,total_bdt,payment_status,created_at,payments(amount_bdt,status))')
      .order('created_at', { ascending: false });
    if (error) notify('error', 'Customers: ' + error.message);
    else setCustomers(data || []);
    setCustomersLoading(false);
  }, [session]);

  const fetchReceiptOrder = async (orderId) => {
    const { data, error } = await supabase.from('orders')
      .select('id,order_number,receipt_number,source,status,subtotal_bdt,discount_bdt,delivery_fee_bdt,total_bdt,payment_status,payment_method,payment_reference,notes,created_at,customers(full_name,phone,email,address,district),order_items(name_snapshot,sku_snapshot,quantity,unit_price_bdt,line_total_bdt),payments(id,method,amount_bdt,status,reference,created_at:received_at,verified_at)')
      .eq('id', orderId).single();
    if (error) throw error;
    setReceiptOrder(data);
  };

  const reviewPayment = async (payment, decision, reason) => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('review_order_payment', {
        p_payment_id: payment.id,
        p_decision: decision,
        p_reason: reason || null
      });
      if (error) throw error;
      await Promise.all([loadOrders(), loadCustomers()]);
      notify('success', decision === 'verify' ? 'Payment verified successfully.' : 'Payment rejected and reason recorded.');
    } catch (e) { notify('error', e.message || 'Could not review payment.'); }
    finally { setSaving(false); }
  };

  const recordPayment = async (order, payment) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('record_order_payment', {
        p_order_id: order.id, p_amount_bdt: Number(payment.amount), p_method: payment.method,
        p_reference: payment.reference || null, p_notes: payment.notes || null
      });
      if (error) throw error;
      setPaymentOrder(null);
      await Promise.all([loadOrders(), loadCustomers()]);
      await fetchReceiptOrder(order.id);
      notify('success', `Payment recorded. Remaining due: ${money(data.due_bdt)}.`);
    } catch (e) { notify('error', e.message || 'Could not record payment.'); }
    finally { setSaving(false); }
  };

  const createPosSale = async (sale) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('create_pos_sale', {
        p_customer: { full_name: sale.name, phone: sale.phone, email: sale.email || null },
        p_items: sale.items.map(item => ({ sku: item.sku, quantity: Number(item.quantity) })),
        p_payment_amount_bdt: Number(sale.amount || 0), p_payment_method: sale.method,
        p_payment_reference: sale.reference || null, p_notes: sale.notes || null
      });
      if (error) throw error;
      setPosOpen(false);
      await Promise.all([loadOrders(), loadData(), loadCustomers()]);
      await fetchReceiptOrder(data.order_id);
      notify('success', `Store sale saved. Receipt ${data.receipt_number} created.`);
    } catch (e) { notify('error', e.message || 'Could not create store sale.'); }
    finally { setSaving(false); }
  };

  const saveCustomer = async (customerId, payload) => {
    setSaving(true);
    try {
      const clean = {
        full_name: payload.full_name.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim() || null,
        address: payload.address.trim() || null,
        district: payload.district.trim() || null
      };
      if (!clean.full_name || !clean.phone) throw new Error('Customer name and mobile number are required.');
      const { error } = await supabase.from('customers').update(clean).eq('id', customerId);
      if (error) throw error;
      await loadCustomers();
      setCustomerEditor(null);
      setSelectedCustomer(current => current ? { ...current, ...clean } : current);
      notify('success', 'Customer details updated.');
    } catch (e) {
      notify('error', e.message || 'Could not update customer.');
    } finally {
      setSaving(false);
    }
  };

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
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setResetMode(true);
      if (next) { setSession(next); setTimeout(() => verifySession(next), 0); }
      else { setSession(null); setProfile(null); setLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, [verifySession]);

  useEffect(() => { if (session && profile) { loadData(); loadOrders(); loadCustomers(); } }, [session, profile, loadData, loadOrders, loadCustomers]);
  useEffect(() => { if (session && profile && section === 'customers') loadCustomers(); }, [section, session, profile, loadCustomers]);
  useEffect(() => { if (session && profile && section === 'intelligence') loadAnalytics(); }, [section, session, profile, loadAnalytics]);

  const requestPasswordReset = async (email) => {
    if (!email || !supabase) return;
    setResetBusy(true); setResetMessage(''); setLoginError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/admin/?reset-password=1' });
    if (error) setLoginError(error.message);
    else setResetMessage('If this email belongs to an approved account, a password reset link has been sent. Check your inbox and spam folder.');
    setResetBusy(false);
  };

  const updateRecoveredPassword = async (password) => {
    setResetBusy(true); setLoginError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setLoginError(error.message);
    else { setResetMode(false); setLoginError(''); window.history.replaceState({}, document.title, window.location.origin + '/admin/'); setNotice({type:'success',message:'Password updated successfully. Your admin session is active.'}); }
    setResetBusy(false);
  };

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
      const { cost_bdt: productCostBdt, purchase_cost, packaging_cost, inbound_shipping_cost, other_cost, ...productPayload } = payload;
      let productId = editor?.id;
      if (productId) {
        const { error } = await supabase.from('products').update(productPayload).eq('id', productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('products').insert(productPayload).select('id').single();
        if (error) throw error;
        productId = data.id;
      }
      if (productCostBdt === null || productCostBdt === undefined || productCostBdt === '') {
        const { error: costDeleteError } = await supabase.from('product_costs').delete().eq('product_id', productId);
        if (costDeleteError) throw costDeleteError;
      } else {
        const { error: costSaveError } = await supabase.from('product_costs').upsert({
          product_id: productId, cost_bdt: Number(productCostBdt), purchase_cost: purchase_cost == null ? null : Number(purchase_cost), packaging_cost: Number(packaging_cost || 0), inbound_shipping_cost: Number(inbound_shipping_cost || 0), other_cost: Number(other_cost || 0), updated_at: new Date().toISOString()
        }, { onConflict: 'product_id' });
        if (costSaveError) throw costSaveError;
      }
      if (stockTouched) {
        const { error: stockError } = await supabase.rpc('adjust_inventory_stock', {
          p_product_id: productId, p_new_on_hand: stock, p_reason: 'product_editor_adjustment'
        });
        if (stockError) throw stockError;
      } else if (!editor?.id) {
        const { error: stockError } = await supabase.from('inventory').upsert({
          product_id: productId, on_hand: 0, reserved: 0, low_stock_threshold: 2, stock_counted: false
        }, { onConflict: 'product_id' });
        if (stockError) throw stockError;
      }
      for (let i = 0; i < imageFiles.length; i++) {
        const image = imageFiles[i];
        const imageId = crypto.randomUUID();
        const originalExtension = image.originalFile.name.split('.').pop().toLowerCase();
        const originalPath = `${productId}/originals/${imageId}.${originalExtension}`;
        const { error: originalError } = await supabase.storage.from('product-images').upload(
          originalPath, image.originalFile, { contentType: image.originalFile.type, upsert: false }
        );
        if (originalError) throw originalError;

        const path = `${productId}/${imageId}.webp`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(
          path, image.processedFile, { contentType: 'image/webp', upsert: false }
        );
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

  const uploadMedia = async (slot,image,altText) => {
    if (!image?.originalFile || !['image/jpeg','image/png','image/webp'].includes(image.originalFile.type) || image.originalFile.size > 10*1024*1024) { notify('error','Choose JPG, PNG or WebP up to 10 MB.'); return false; }
    setSaving(true); try {
      const originalFile = image.originalFile;
      if (!originalFile || !image.processedFile) throw new Error('Select an image and wait for optimization to finish.');
      const imageId = crypto.randomUUID();
      const originalExt = originalFile.name.split('.').pop().toLowerCase();
      const originalPath = 'site-media/'+slot.key+'/originals/'+imageId+'.'+originalExt;
      const {error:originalError}=await supabase.storage.from('product-images').upload(
        originalPath,originalFile,{contentType:originalFile.type,upsert:false}
      );
      if(originalError) throw originalError;
      const path='site-media/'+slot.key+'/'+imageId+'.webp';
      const {error:upErr}=await supabase.storage.from('product-images').upload(
        path,image.processedFile,{contentType:'image/webp',upsert:false}
      );
      if(upErr) throw upErr;
      const {data:urlData}=supabase.storage.from('product-images').getPublicUrl(path);
      const {error}=await supabase.from('site_media').upsert({slot_key:slot.key,label:slot.label,storage_path:path,public_url:urlData.publicUrl,alt_text:altText,is_published:true,updated_at:new Date().toISOString()},{onConflict:'slot_key'});
      if(error) throw error;
      await loadData(); notify('success',slot.label+' optimized and published. Original image backed up.');
      return true;
    } catch(e){notify('error',e.message||'Image upload failed.'); return false;} finally{setSaving(false);}
  };
  const toggleMedia = async (asset) => {const {error}=await supabase.from('site_media').update({is_published:!asset.is_published,updated_at:new Date().toISOString()}).eq('id',asset.id);if(error)notify('error',error.message);else{await loadData();notify('success','Image visibility updated.');}};

  const archiveProduct = async (product) => {
    if (!window.confirm(`Archive “${product.name}”? It will no longer appear on the storefront.`)) return;
    const { error } = await supabase.from('products').update({ is_published: false }).eq('id', product.id);
    if (error) notify('error', error.message); else { await loadData(); notify('success', 'Product archived (not permanently deleted).'); }
  };

  const createCollection = async (name, description) => {
    setSaving(true);
    try {
      const slug = slugify(name);
      const { error } = await supabase.from('collections').insert({ name, slug, description, display_order: collections.length, sort_order: collections.length });
      if (error) throw error;
      await loadData();
      notify('success', 'Collection created.');
    } catch (error) { notify('error', error.message || 'Could not create collection.'); throw error; }
    finally { setSaving(false); }
  };
  const updateCollection = async (id, name, description) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('collections').update({
        name, slug: slugify(name), description,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      await loadData();
      notify('success', 'Collection details updated.');
    } catch (error) { notify('error', error.message || 'Could not update collection.'); throw error; }
    finally { setSaving(false); }
  };

  const saveAuthenticityEvidence = async (payload,file) => {
    if(!file || file.size>10*1024*1024 || !['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Evidence must be PDF/JPG/PNG/WebP and no larger than 10 MB.');
    const path=payload.product_id+'/'+crypto.randomUUID()+'/'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
    const {error:uploadError}=await supabase.storage.from('authenticity-evidence').upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError) throw uploadError;
    const {error}=await supabase.from('authenticity_evidence').insert({...payload,storage_path:path});
    if(error){await supabase.storage.from('authenticity-evidence').remove([path]);throw error;}
    await loadData();notify('success','Evidence uploaded to private storage.');
  };
  const viewAuthenticityEvidence = async evidence => {
    const popup=window.open('about:blank','_blank');
    if(!popup){notify('error','Allow pop-ups to view private evidence.');return;}
    const {data,error}=await supabase.storage.from('authenticity-evidence').createSignedUrl(evidence.storage_path,60);
    if(error){popup.close();notify('error',error.message);return;}
    popup.location.href=data.signedUrl;
  };
  const verifyAuthenticityEvidence = async evidence => {
    if(!window.confirm('Confirm that you reviewed this document and it supports the product authenticity claim?'))return;
    setSaving(true);
    try{
      const now=new Date().toISOString();
      const {error:evidenceError}=await supabase.from('authenticity_evidence').update({verified_by:session.user.id,verified_at:now}).eq('id',evidence.id);
      if(evidenceError)throw evidenceError;
      const {error:productError}=await supabase.from('products').update({authenticity_status:'verified'}).eq('id',evidence.product_id);
      if(productError)throw productError;
      await loadData();notify('success','Evidence reviewed and product marked verified.');
    }catch(e){notify('error',e.message||'Could not verify evidence.');}
    finally{setSaving(false);}
  };

  const saveBrand = async payload => { const {error}=await supabase.from('brands').insert(payload); if(error) throw error; await loadData(); notify('success','Brand created.'); };
  const updateBrand = async (id, payload) => { const {error}=await supabase.from('brands').update({...payload,updated_at:new Date().toISOString()}).eq('id',id); if(error) throw error; await loadData(); notify('success','Brand details updated.'); };
  const toggleBrand = async brand => { const {error}=await supabase.from('brands').update({is_active:!brand.is_active,updated_at:new Date().toISOString()}).eq('id',brand.id); if(error)notify('error',error.message);else{await loadData();notify('success','Brand visibility updated.');} };
  const saveSupplier = async payload => { const {error}=await supabase.from('suppliers').insert(payload); if(error)throw error; await loadData();notify('success','Supplier saved privately.'); };
  const toggleSupplier = async supplier => { const {error}=await supabase.from('suppliers').update({is_active:!supplier.is_active,updated_at:new Date().toISOString()}).eq('id',supplier.id); if(error)notify('error',error.message);else{await loadData();notify('success','Supplier status updated.');} };
  const saveProductSource = async payload => { const {error}=await supabase.from('product_sources').upsert({...payload,updated_at:new Date().toISOString()},{onConflict:'product_id,supplier_id'}); if(error)throw error;await loadData();notify('success','Product sourcing link saved.'); };

  const toggleCollection = async (collection) => {
    const { error } = await supabase.from('collections').update({ is_active: !collection.is_active }).eq('id', collection.id);
    if (error) notify('error', error.message); else { await loadData(); notify('success', 'Collection updated.'); }
  };

  const adjustStock = async (product, nextValue) => {
    const quantity = Number(nextValue);
    if (!Number.isInteger(quantity) || quantity < 0) return notify('error', 'Stock must be a non-negative whole number.');
    setSaving(true);
    const { error } = await supabase.rpc('adjust_inventory_stock', {
      p_product_id: product.id,
      p_new_on_hand: quantity,
      p_reason: 'admin_stock_adjustment'
    });
    if (error) notify('error', error.message);
    else { await Promise.all([loadData(), loadAnalytics()]); notify('success', 'Stock updated and movement recorded.'); }
    setSaving(false);
  };

  const filtered = useMemo(() => products.filter(p => [p.name,p.sku,p.brand,p.collections?.name].join(' ').toLowerCase().includes(search.toLowerCase())), [products, search]);
  const published = products.filter(p => p.is_published).length;
  const lowStock = products.filter(p => { const i=p.inventory?.[0]; return i?.stock_counted && Number(i.on_hand||0)-Number(i.reserved||0) <= Number(i.low_stock_threshold ?? 2); }).length;

  if (!supabaseConfigured) return <main className="setup-wrap"><section className="setup-card"><div className="brand-mark">Z</div><p className="eyebrow">ZARIAH STUDIO</p><h1>Admin setup required</h1><p className="muted">The Admin app is deployed, but its Supabase public configuration is missing. Add VITE_SUPABASE_URL as a GitHub Actions variable and VITE_SUPABASE_ANON_KEY as a repository Actions secret, then rerun the Pages deployment. For local testing, use admin-app/.env.local. Never use the service_role key in the browser.</p><p className="tiny muted">Project: zariah-studio-sg · Region: Singapore</p></section></main>;
  if (loading) return <main className="setup-wrap"><LoaderCircle className="spin" size={28}/><span className="muted">Checking secure admin session…</span></main>;
  if (resetMode) return <PasswordRecovery onSave={updateRecoveredPassword} busy={resetBusy} error={loginError}/>;
  if (!session || !profile) return <><Login onLogin={signIn} onReset={requestPasswordReset} busy={loginBusy} resetBusy={resetBusy} resetMessage={resetMessage} error={loginError}/></>;

  const nav = [
    ['dashboard','Overview',LayoutDashboard],['products','Products',Package],['collections','Collections',Layers3],['brands','Brands & Suppliers',Users],['media','Website Images',ImagePlus],['inventory','Inventory',Warehouse],
    ['orders','Orders',ShoppingBag],['customers','Customers & Members',Users],['loyalty','Loyalty & Rewards',Award],['intelligence','Sales Intelligence',TrendingUp],['fraud','Visitor Intelligence',Eye],['payments','Payments',CreditCard]
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
      <header className="topbar"><button className="icon-btn menu-toggle" onClick={() => setMobileNav(true)}><Menu/></button><div><p className="eyebrow">ZARIAH STUDIO / ADMIN</p><h1>{title}</h1></div><button className="secondary refresh" onClick={() => { loadData(); loadOrders(); }}><RefreshCw size={15}/> Refresh</button></header>
      <div className="content"><Notice notice={notice} clear={() => setNotice(null)}/>
        {section === 'dashboard' && <><div className="welcome"><div><p className="eyebrow">STORE OVERVIEW</p><h2>Good to see you, {profile.display_name || 'Admin'}.</h2><p className="muted">Your store management workspace.</p></div><span className="live-pill"><CheckCircle2 size={14}/> Secure session active</span></div>
          <div className="stat-grid"><Stat icon={Package} label="Total products" value={products.length}/><Stat icon={CheckCircle2} label="Published" value={published}/><Stat icon={Layers3} label="Collections" value={collections.length}/><Stat icon={AlertCircle} label="Low stock" value={lowStock}/></div>
          <section className="panel"><div className="panel-head"><div><p className="eyebrow">QUICK ACTIONS</p><h2>Manage your catalogue</h2></div></div><div className="quick-actions"><button className="quick-card" onClick={() => { setEditor({}); setSection('products'); }}><Plus/><strong>Add a product</strong><small>Publish a new bag without code changes</small></button><button className="quick-card" onClick={() => setSection('collections')}><Layers3/><strong>Manage collections</strong><small>Create and organise product ranges</small></button><button className="quick-card" onClick={() => setSection('inventory')}><Warehouse/><strong>Update inventory</strong><small>Adjust available stock</small></button></div></section>
        </>}
        {section === 'products' && <section className="panel"><div className="panel-head split"><div><p className="eyebrow">CATALOGUE</p><h2>Products <span className="count">{products.length}</span></h2><p className="muted">Add, edit, publish or archive products. No website code edits needed.</p></div><button className="primary" onClick={() => setEditor({})}><Plus size={16}/> Add product</button></div><div className="toolbar"><div className="searchbox"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, SKU, brand or collection"/></div><button className="secondary" onClick={loadData}><RefreshCw size={15}/> Refresh</button></div>
          {dataLoading ? <Loading/> : <div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>Collection</th><th>Brand</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(p => <tr key={p.id}><td><div className="product-cell">{p.product_images?.[0]?.public_url ? <img src={p.product_images[0].public_url} alt="" /> : <div className="thumb-placeholder"><ImagePlus size={16}/></div>}<div><strong>{p.name}</strong><small>{p.product_type || '—'}</small></div></div></td><td>{p.sku}</td><td>{p.collections?.name || '—'}</td><td>{p.brand || 'Independent / Unbranded'}</td><td>{money(p.price_bdt)}</td><td>{p.inventory?.[0]?.on_hand ?? 0}</td><td><span className={`status ${p.is_published ? 'live' : ''}`}>{p.is_published ? 'Published' : 'Draft'}</span></td><td><div className="row-actions"><button className="icon-btn" title="Edit" onClick={() => setEditor(p)}><Pencil size={16}/></button><button className="icon-btn" title="Archive" onClick={() => archiveProduct(p)}><Archive size={16}/></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty">No products found. Add your first product.</div>}</div>}
        </section>}
        {section === 'collections' && <CollectionPanel collections={collections} onCreate={createCollection} onUpdate={updateCollection} onToggle={toggleCollection} saving={saving}/>}
        {section === 'brands' && <BrandSupplierPanel brands={brands} suppliers={suppliers} products={products} sources={productSources} evidence={authenticityEvidence} onSaveEvidence={saveAuthenticityEvidence} onViewEvidence={viewAuthenticityEvidence} onVerifyEvidence={verifyAuthenticityEvidence} onSaveBrand={saveBrand} onUpdateBrand={updateBrand} onToggleBrand={toggleBrand} onSaveSupplier={saveSupplier} onToggleSupplier={toggleSupplier} onSaveSource={saveProductSource} saving={saving}/>} 
        {section === 'media' && <MediaPanel assets={mediaAssets} onUpload={uploadMedia} onToggle={toggleMedia} saving={saving}/>}
        {section === 'inventory' && <section className="panel"><div className="panel-head"><div><p className="eyebrow">STOCK CONTROL</p><h2>Inventory</h2><p className="muted">Set the current on-hand quantity for each product.</p></div></div><div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>On hand</th><th>Stock level</th><th>Update quantity</th></tr></thead><tbody>{products.map(p => { const inv=p.inventory?.[0]||{}; const qty = inv.on_hand ?? 0; const available=Number(qty)-Number(inv.reserved||0); const low=Boolean(inv.stock_counted)&&available<=Number(inv.low_stock_threshold??2); return <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.sku}</td><td>{qty}</td><td><span className={`status ${low ? 'warning' : 'live'}`}>{!inv.stock_counted ? 'Not tracked' : low ? 'Low stock' : 'In stock'}</span></td><td><StockInput initial={qty} onSave={v => adjustStock(p,v)}/></td></tr>; })}</tbody></table></div></section>}
        {section === 'orders' && <section className="panel">
          <div className="panel-head split"><div><p className="eyebrow">ORDER OPERATIONS</p><h2>Orders <span className="count">{orders.length}</span></h2><p className="muted">Search, filter and manage orders with a consistent status history.</p></div><button className="secondary" onClick={loadOrders}><RefreshCw size={15}/> Refresh orders</button></div>
          <div className="order-kpis"><article><small>Total orders</small><strong>{orders.length}</strong></article><article><small>New orders</small><strong>{orders.filter(o=>['new','pending'].includes(o.status)).length}</strong></article><article><small>In progress</small><strong>{orders.filter(o=>['confirmed','processing','shipped'].includes(o.status)).length}</strong></article><article><small>Unpaid / partial</small><strong>{orders.filter(o=>['unpaid','partial','partially_paid'].includes(o.payment_status)).length}</strong></article></div>
          <div className="toolbar order-toolbar"><div className="searchbox"><Search size={16}/><input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search order number, customer or phone"/></div><div className="order-filter-fields"><select aria-label="Filter by order status" value={orderStatusFilter} onChange={e=>setOrderStatusFilter(e.target.value)}><option value="all">All statuses</option>{['new','confirmed','processing','ready_to_ship','shipped','delivered','cancelled','returned'].map(v=><option key={v} value={v}>{v.replace('_',' ')}</option>)}</select><select aria-label="Filter by payment status" value={orderPaymentFilter} onChange={e=>setOrderPaymentFilter(e.target.value)}><option value="all">All payments</option>{['unpaid','partial','partially_paid','paid','refunded'].map(v=><option key={v} value={v}>{v.replace('_',' ')}</option>)}</select></div></div>
          {dataLoading ? <Loading/> : <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Payment</th><th>Status</th><th></th></tr></thead><tbody>{orders.filter(o => [o.order_number,o.customers?.full_name,o.customers?.phone].join(' ').toLowerCase().includes(orderSearch.toLowerCase()) && (orderStatusFilter==='all'||o.status===orderStatusFilter) && (orderPaymentFilter==='all'||o.payment_status===orderPaymentFilter)).map(o => {const paid=(o.payments||[]).filter(p=>p.status==='verified').reduce((sum,p)=>sum+Number(p.amount_bdt||0),0);return <tr key={o.id}><td><strong>{o.order_number}</strong><small className="muted" style={{display:'block',marginTop:4}}>{o.source}</small></td><td>{o.customers?.full_name || '—'}<small className="muted" style={{display:'block',marginTop:4}}>{o.customers?.phone || ''}</small></td><td>{new Date(o.created_at).toLocaleDateString('en-GB')}</td><td>{money(o.total_bdt)}</td><td>{money(paid)}</td><td><span className={`status ${o.payment_status === 'paid' ? 'live' : 'warning'}`}>{o.payment_status?.replace('_',' ')}</span></td><td><span className={`status ${['shipped','delivered'].includes(o.status) ? 'live' : o.status === 'cancelled' ? 'warning' : ''}`}>{o.status}</span></td><td><button className="secondary small" onClick={() => { setSelectedOrder(o); setOrderStatus(o.status); setCourierName(o.courier_name || ''); setTrackingNumber(o.courier_tracking_number || ''); setTrackingMessage(''); }}>View / Manage</button></td></tr>})}</tbody></table>{orders.length===0&&<div className="empty">No orders found yet.</div>}</div>}
        </section>}
        {section === 'payments' && <PaymentPanel orders={orders} onNewSale={() => setPosOpen(true)} onRecordPayment={setPaymentOrder} onReceipt={order => fetchReceiptOrder(order.id).catch(e => notify('error',e.message))} onReviewPayment={reviewPayment} saving={saving} /> }
        {section === 'customers' && <CustomerPanel customers={customers} loading={customersLoading} onRefresh={loadCustomers} onSelect={setSelectedCustomer} />}
        {section === 'loyalty' && <LoyaltyPanel customers={customers} loading={customersLoading} onRefresh={loadCustomers} onSelect={setSelectedCustomer} />}
        {section === 'intelligence' && <SalesIntelligencePanel products={products} orders={analyticsOrders} movements={stockMovements} loading={analyticsLoading} onRefresh={loadAnalytics} />}
        {section === 'fraud' && <FraudRiskPanel />}

      </div>
    </main>
    {paymentOrder && <PaymentEntry order={paymentOrder} saving={saving} onClose={() => setPaymentOrder(null)} onSubmit={payment => recordPayment(paymentOrder,payment)} />}
    {posOpen && <PosSaleModal products={products.filter(p => p.is_published)} saving={saving} onClose={() => setPosOpen(false)} onSubmit={createPosSale} />}
    {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
    {selectedCustomer && <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onEdit={() => setCustomerEditor(selectedCustomer)} onReceipt={orderId => fetchReceiptOrder(orderId).catch(e => notify('error', e.message))} />}
    {customerEditor && <CustomerEditor customer={customerEditor} saving={saving} onClose={() => setCustomerEditor(null)} onSave={payload => saveCustomer(customerEditor.id, payload)} />}
    {selectedOrder && <OrderManager order={selectedOrder} status={orderStatus} setStatus={setOrderStatus} courier={courierName} setCourier={setCourierName} tracking={trackingNumber} setTracking={setTrackingNumber} message={trackingMessage} setMessage={setTrackingMessage} saving={saving} onClose={() => setSelectedOrder(null)} onSave={async () => {
      setSaving(true);
      try {
        const { error } = await supabase.rpc('update_order_status', {
          p_order_id: selectedOrder.id,
          p_new_status: orderStatus,
          p_message: trackingMessage.trim() || null,
          p_courier_name: courierName.trim() || null,
          p_tracking_number: trackingNumber.trim() || null
        });
        if (error) throw error;
        await loadOrders(); setSelectedOrder(null); notify('success', `Order updated: ${selectedOrder.order_number}.`);
      } catch (e) { notify('error', e.message || 'Could not update order.'); }
      finally { setSaving(false); }
    }} />}
    {editor && <ProductEditor product={editor.id ? editor : null} collections={collections.filter(c => c.is_active)} brands={brands} products={products} onClose={() => setEditor(null)} onSave={saveProduct} saving={saving}/>}
  </div>;
}

function SalesIntelligencePanel({ products, orders, movements, loading, onRefresh }) {
  const [range, setRange] = useState('6');
  const activeOrders = orders.filter(order => !['cancelled','returned'].includes(order.status));
  const productById = new Map(products.map(product => [product.id, product]));
  const productBySku = new Map(products.map(product => [product.sku, product]));
  const salesLines = activeOrders.flatMap(order => (order.order_items || []).map(item => ({ ...item, order })));
  const totalRevenue = salesLines.reduce((sum,line) => sum + Number(line.line_total_bdt || 0),0);
  const totalUnits = salesLines.reduce((sum,line) => sum + Number(line.quantity || 0),0);
  const knownCostLines = salesLines.filter(line => {
    const product = productById.get(line.product_id) || productBySku.get(line.sku_snapshot);
    return line.unit_cost_snapshot !== null && line.unit_cost_snapshot !== undefined || (product?.cost_bdt !== null && product?.cost_bdt !== undefined && product?.cost_bdt !== '');
  });
  const costCoverage = salesLines.length ? knownCostLines.length / salesLines.length : 0;
  const knownRevenue = knownCostLines.reduce((sum,line) => sum + Number(line.line_total_bdt || 0),0);
  const knownCost = knownCostLines.reduce((sum,line) => {
    const product = productById.get(line.product_id) || productBySku.get(line.sku_snapshot);
    return sum + Number(line.unit_cost_snapshot ?? product.cost_bdt ?? 0) * Number(line.quantity || 0);
  },0);
  const grossProfit = knownRevenue - knownCost;
  const grossMargin = knownRevenue > 0 ? grossProfit / knownRevenue * 100 : 0;

  const now = new Date();
  const monthRows = Array.from({length:Number(range)},(_,index) => {
    const date = new Date(now.getFullYear(),now.getMonth()-(Number(range)-1-index),1);
    return { key:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`, label:date.toLocaleDateString('en-GB',{month:'short'}), revenue:0, units:0 };
  });
  const monthMap = new Map(monthRows.map(row => [row.key,row]));
  for (const line of salesLines) {
    const date = new Date(line.order.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    const row = monthMap.get(key);
    if (row) { row.revenue += Number(line.line_total_bdt || 0); row.units += Number(line.quantity || 0); }
  }
  const maxRevenue = Math.max(1,...monthRows.map(row => row.revenue));
  const productMap = new Map();
  for (const line of salesLines) {
    const key = line.product_id || line.sku_snapshot;
    const item = productMap.get(key) || { name:line.name_snapshot, sku:line.sku_snapshot, units:0, revenue:0 };
    item.units += Number(line.quantity || 0);
    item.revenue += Number(line.line_total_bdt || 0);
    productMap.set(key,item);
  }
  const bestsellers = [...productMap.values()].sort((a,b) => b.units-a.units).slice(0,8);
  const brandMap = new Map();
  for (const line of salesLines) {
    const product = productById.get(line.product_id) || productBySku.get(line.sku_snapshot);
    const brandName = line.brand_snapshot || product?.brand || 'Unassigned / legacy';
    const row = brandMap.get(brandName) || { brand:brandName, revenue:0, units:0, knownCost:0, knownRevenue:0 };
    const revenue = Number(line.line_total_bdt || 0);
    const quantity = Number(line.quantity || 0);
    row.revenue += revenue; row.units += quantity;
    if (line.unit_cost_snapshot !== null && line.unit_cost_snapshot !== undefined || (product?.cost_bdt !== null && product?.cost_bdt !== undefined && product?.cost_bdt !== '')) {
      row.knownCost += Number(line.unit_cost_snapshot ?? product.cost_bdt ?? 0) * quantity; row.knownRevenue += revenue;
    }
    brandMap.set(brandName,row);
  }
  const brandPerformance = [...brandMap.values()].sort((a,b)=>b.revenue-a.revenue);
  const lowStock = products.filter(product => {
    const inv=product.inventory?.[0];
    return inv?.stock_counted && Number(inv.on_hand || 0)-Number(inv.reserved || 0) <= Number(inv.low_stock_threshold ?? 2);
  }).sort((a,b) => {
    const ai=a.inventory?.[0],bi=b.inventory?.[0];
    return (Number(ai?.on_hand||0)-Number(ai?.reserved||0))-(Number(bi?.on_hand||0)-Number(bi?.reserved||0));
  });
  const movementReason = reason => String(reason || '').replaceAll('_',' ');
  return <section className="panel">
    <div className="panel-head split">
      <div><p className="eyebrow">BUSINESS PERFORMANCE</p><h2>Sales Intelligence</h2><p className="muted">Product sales, estimated gross margin, stock health and inventory movement.</p></div>
      <button className="secondary" onClick={onRefresh}><RefreshCw size={15}/> Refresh data</button>
    </div>
    {loading ? <Loading/> : <>
      <div className="intelligence-kpis">
        <div><small>Product sales revenue</small><strong>{money(totalRevenue)}</strong><span>{activeOrders.length} non-cancelled orders</span></div>
        <div><small>Units sold</small><strong>{totalUnits.toLocaleString('en-BD')}</strong><span>From recorded order items</span></div>
        <div><small>Estimated gross profit</small><strong>{money(grossProfit)}</strong><span>{costCoverage ? `${(costCoverage*100).toFixed(0)}% line coverage` : 'Add product costs to calculate'}</span></div>
        <div><small>Gross margin</small><strong>{costCoverage ? `${grossMargin.toFixed(1)}%` : '—'}</strong><span>Only products with cost entered</span></div>
      </div>
      {costCoverage < 1 && <div className="analytics-notice"><AlertCircle size={16}/><span>Profit and margin are partial estimates. Product cost is missing for {salesLines.length-knownCostLines.length} of {salesLines.length} sales lines. Add Product Cost (BDT) in Products to improve coverage.</span></div>}
      <div className="intelligence-grid">
        <section className="analytics-card">
          <div className="analytics-card-head"><div><p className="eyebrow">SALES TREND</p><h3>Product revenue by month</h3></div><select value={range} onChange={e=>setRange(e.target.value)}><option value="6">Last 6 months</option><option value="12">Last 12 months</option></select></div>
          <div className="revenue-bars">{monthRows.map(row=><div className="revenue-bar-col" key={row.key}><strong>{row.revenue ? money(row.revenue) : '—'}</strong><div className="revenue-bar-track"><div className="revenue-bar-fill" style={{height:`${Math.max(row.revenue ? 5 : 0,row.revenue/maxRevenue*100)}%`}}/></div><small>{row.label}</small></div>)}</div>
        </section>
        <section className="analytics-card">
          <div className="analytics-card-head"><div><p className="eyebrow">PRODUCT PERFORMANCE</p><h3>Bestsellers by units</h3></div></div>
          {bestsellers.length ? <div className="bestseller-list">{bestsellers.map((item,index)=><div className="bestseller-row" key={item.sku}><span className="bestseller-rank">{index+1}</span><div className="bestseller-info"><strong>{item.name}</strong><small>{item.sku} · {money(item.revenue)}</small></div><b>{item.units} units</b></div>)}</div> : <div className="empty">No order item sales found yet.</div>}
        </section>
      </div>
      <section className="analytics-card">
        <div className="analytics-card-head"><div><p className="eyebrow">MERCHANDISING PERFORMANCE</p><h3>Brand-wise sales & margin</h3></div></div>
        {brandPerformance.length ? <div className="table-wrap"><table><thead><tr><th>Brand / catalogue group</th><th>Units</th><th>Revenue</th><th>Estimated gross profit</th><th>Margin</th></tr></thead><tbody>{brandPerformance.map(row=>{const profit=row.knownRevenue-row.knownCost;const margin=row.knownRevenue?profit/row.knownRevenue*100:null;return <tr key={row.brand}><td><strong>{row.brand}</strong></td><td>{row.units}</td><td>{money(row.revenue)}</td><td>{row.knownRevenue?money(profit):'—'}</td><td>{margin===null?'—':margin.toFixed(1)+'%'}</td></tr>})}</tbody></table></div> : <div className="empty">Brand performance will appear after product sales are recorded.</div>}
        <p className="tiny muted">Margins use the current landed unit cost and are shown only where cost data exists. Historical accounting cost requires order-item cost snapshots.</p>
      </section>
      <section className="analytics-card stock-alert-card">
        <div className="analytics-card-head"><div><p className="eyebrow">INVENTORY CONTROL</p><h3>Low-stock alerts <span className="count">{lowStock.length}</span></h3></div></div>
        {lowStock.length ? <div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Threshold</th></tr></thead><tbody>{lowStock.map(product=>{const inv=product.inventory?.[0]||{};const available=Number(inv.on_hand||0)-Number(inv.reserved||0);return <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.sku}</td><td>{inv.on_hand}</td><td>{inv.reserved}</td><td><span className="status warning">{available}</span></td><td>{inv.low_stock_threshold??2}</td></tr>})}</tbody></table></div> : <div className="empty">No stock-counted products are currently below their alert threshold.</div>}
      </section>
      <section className="analytics-card">
        <div className="analytics-card-head"><div><p className="eyebrow">AUDIT TRAIL</p><h3>Recent inventory movements</h3></div></div>
        {movements.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Product</th><th>Reason</th><th>Quantity change</th><th>Reference</th></tr></thead><tbody>{movements.slice(0,30).map(movement=><tr key={movement.id}><td>{new Date(movement.created_at).toLocaleString('en-GB')}</td><td><strong>{movement.products?.name || 'Product'}</strong><small className="muted" style={{display:'block'}}>{movement.products?.sku || ''}</small></td><td>{movementReason(movement.reason)}</td><td><span className={`status ${movement.quantity_delta>0?'live':'warning'}`}>{movement.quantity_delta>0?'+':''}{movement.quantity_delta}</span></td><td><small>{movement.reference || '—'}</small></td></tr>)}</tbody></table></div> : <div className="empty">No inventory movement records found.</div>}
      </section>
      <p className="tiny muted">Revenue is calculated from order-item line totals and excludes cancelled/returned orders. It excludes delivery fees and discounts at order level. Gross profit is an estimate based on current product cost, not historical cost at time of sale. For accounting-grade margins, cost must be snapshotted on each order item at checkout.</p>
    </>}
  </section>;
}

const LOYALTY_TIERS = [
  { key: 'bronze', label: 'Bronze', min: 0, next: 10000, benefit: 'Entry membership' },
  { key: 'silver', label: 'Silver', min: 10000, next: 25000, benefit: 'Silver membership' },
  { key: 'gold', label: 'Gold', min: 25000, next: 50000, benefit: 'Gold membership' },
  { key: 'platinum', label: 'Platinum', min: 50000, next: null, benefit: 'Top-tier membership' }
];
const tierLabel = tier => LOYALTY_TIERS.find(item => item.key === tier)?.label || 'Bronze';

function LoyaltyPanel({ customers, loading, onRefresh, onSelect }) {
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [sort, setSort] = useState('points');
  const rows = useMemo(() => {
    const filtered = customers.filter(customer => {
      const tier = customer.loyalty?.tier || 'bronze';
      const text = [customer.full_name, customer.phone, customer.email].join(' ').toLowerCase();
      return text.includes(query.toLowerCase()) && (tierFilter === 'all' || tier === tierFilter);
    });
    return filtered.sort((a,b) => {
      const av = a.loyalty || {}, bv = b.loyalty || {};
      if (sort === 'spend') return Number(bv.lifetime_spend_bdt || 0) - Number(av.lifetime_spend_bdt || 0);
      if (sort === 'tier') return LOYALTY_TIERS.findIndex(t => t.key === bv.tier) - LOYALTY_TIERS.findIndex(t => t.key === av.tier);
      return Number(bv.points_balance || 0) - Number(av.points_balance || 0);
    });
  }, [customers, query, tierFilter, sort]);

  const countByTier = key => customers.filter(c => (c.loyalty?.tier || 'bronze') === key).length;
  const pointsOutstanding = customers.reduce((sum,c) => sum + Number(c.loyalty?.points_balance || 0),0);
  const qualifyingSpend = customers.reduce((sum,c) => sum + Number(c.loyalty?.lifetime_spend_bdt || 0),0);

  return <section className="panel">
    <div className="panel-head split">
      <div><p className="eyebrow">CUSTOMER RETENTION</p><h2>Loyalty & Membership</h2><p className="muted">Points are earned only from verified payments. Membership tier is based on cumulative verified spend.</p></div>
      <button className="secondary" onClick={onRefresh}><RefreshCw size={15}/> Refresh</button>
    </div>
    <div className="loyalty-summary-grid">
      <div><small>Members enrolled</small><strong>{customers.length}</strong></div>
      <div><small>Points outstanding</small><strong>{pointsOutstanding.toLocaleString('en-BD')}</strong></div>
      <div><small>Qualifying spend</small><strong>{money(qualifyingSpend)}</strong></div>
    </div>
    <div className="loyalty-tier-grid">
      {LOYALTY_TIERS.map(tier => <article className={`loyalty-tier-card tier-card-${tier.key}`} key={tier.key}>
        <div><Award size={18}/><span>{tier.label}</span></div>
        <strong>{countByTier(tier.key)}</strong>
        <small>{tier.next ? `${money(tier.min)} – ${money(tier.next - 1)}` : `${money(tier.min)}+ qualifying spend`}</small>
      </article>)}
    </div>
    <div className="loyalty-rules">
      <strong>Current earning rules</strong>
      <p>1 point for each complete ৳100 in an individual verified payment. Tier qualification uses cumulative verified payments, net of refunded or rejected payments.</p>
      <small>Bronze: ৳0 · Silver: ৳10,000 · Gold: ৳25,000 · Platinum: ৳50,000</small>
      <small>Points are tracked but cannot yet be redeemed for discounts or cash. Redemption rules must be approved before activation.</small>
    </div>
    <div className="toolbar customer-toolbar">
      <div className="searchbox"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customer name or mobile"/></div>
      <select aria-label="Filter membership tier" value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
        <option value="all">All tiers</option>{LOYALTY_TIERS.map(t => <option value={t.key} key={t.key}>{t.label}</option>)}
      </select>
      <select aria-label="Sort loyalty members" value={sort} onChange={e => setSort(e.target.value)}>
        <option value="points">Most points</option><option value="spend">Highest spend</option><option value="tier">Highest tier</option>
      </select>
    </div>
    {loading ? <Loading/> : <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Membership</th><th>Points balance</th><th>Lifetime points</th><th>Qualifying spend</th><th></th></tr></thead><tbody>
      {rows.map(customer => {
        const loyalty = customer.loyalty || {};
        const tier = loyalty.tier || 'bronze';
        return <tr key={customer.id}>
          <td><strong>{customer.full_name}</strong><small className="muted" style={{display:'block',marginTop:4}}>{customer.phone}</small></td>
          <td><span className={`tier-pill tier-${tier}`}>{tierLabel(tier)}</span></td>
          <td><strong>{Number(loyalty.points_balance || 0).toLocaleString('en-BD')}</strong></td>
          <td>{Number(loyalty.lifetime_points || 0).toLocaleString('en-BD')}</td>
          <td>{money(loyalty.lifetime_spend_bdt || 0)}</td>
          <td><button className="secondary small" onClick={() => onSelect(customer)}>View profile</button></td>
        </tr>;
      })}
    </tbody></table>{rows.length === 0 && <div className="empty">No loyalty members match these filters.</div>}</div>}
  </section>;
}

function customerOrderStats(customer) {
  const orders = customer.orders || [];
  const validOrders = orders.filter(order => !['cancelled', 'returned'].includes(order.status));
  const spend = validOrders.reduce((sum, order) => sum + Number(order.total_bdt || 0), 0);
  const paid = validOrders.reduce((sum, order) => sum + (order.payments || []).filter(p => p.status === 'verified').reduce((n, p) => n + Number(p.amount_bdt || 0), 0), 0);
  const due = Math.max(spend - paid, 0);
  const lastOrder = [...validOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
  return { orders: validOrders, spend, paid, due, lastOrder };
}

function CustomerPanel({ customers, loading, onRefresh, onSelect }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const rows = useMemo(() => {
    const filtered = customers.filter(customer =>
      [customer.full_name, customer.phone, customer.email, customer.district].join(' ').toLowerCase().includes(query.toLowerCase())
    );
    return filtered.sort((a, b) => {
      const A = customerOrderStats(a), B = customerOrderStats(b);
      if (sort === 'spend') return B.spend - A.spend;
      if (sort === 'orders') return B.orders.length - A.orders.length;
      if (sort === 'due') return B.due - A.due;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [customers, query, sort]);
  const repeatCount = customers.filter(c => customerOrderStats(c).orders.length > 1).length;
  const totalSpend = customers.reduce((sum, c) => sum + customerOrderStats(c).spend, 0);
  const totalDue = customers.reduce((sum, c) => sum + customerOrderStats(c).due, 0);
  return <section className="panel">
    <div className="panel-head split">
      <div><p className="eyebrow">CUSTOMER RELATIONSHIP MANAGEMENT</p><h2>Customers <span className="count">{customers.length}</span></h2><p className="muted">Customer profiles, purchase history, lifetime spending and outstanding balances.</p></div>
      <button className="secondary" onClick={onRefresh}><RefreshCw size={15}/> Refresh customers</button>
    </div>
    <div className="customer-stat-grid">
      <div><small>Total customers</small><strong>{customers.length}</strong></div>
      <div><small>Repeat customers</small><strong>{repeatCount}</strong></div>
      <div><small>Lifetime sales</small><strong>{money(totalSpend)}</strong></div>
      <div><small>Outstanding due</small><strong>{money(totalDue)}</strong></div>
    </div>
    <div className="toolbar customer-toolbar">
      <div className="searchbox"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, mobile, email or district"/></div>
      <select aria-label="Sort customers" value={sort} onChange={e => setSort(e.target.value)}>
        <option value="recent">Recently added</option><option value="spend">Highest spending</option><option value="orders">Most orders</option><option value="due">Highest due</option>
      </select>
    </div>
    {loading ? <Loading/> : <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Lifetime spend</th><th>Outstanding due</th><th>Last purchase</th><th></th></tr></thead><tbody>
      {rows.map(customer => {
        const stats = customerOrderStats(customer);
        return <tr key={customer.id}>
          <td><strong>{customer.full_name}</strong><small className="muted" style={{display:'block',marginTop:4}}>{customer.district || 'District not provided'}</small></td>
          <td>{customer.phone}<small className="muted" style={{display:'block',marginTop:4}}>{customer.email || ''}</small></td>
          <td>{stats.orders.length}</td><td><strong>{money(stats.spend)}</strong></td>
          <td><span className={`status ${stats.due > 0 ? 'warning' : 'live'}`}>{money(stats.due)}</span></td>
          <td>{stats.lastOrder ? new Date(stats.lastOrder.created_at).toLocaleDateString('en-GB') : '—'}</td>
          <td><button className="secondary small" onClick={() => onSelect(customer)}>View profile</button></td>
        </tr>;
      })}
    </tbody></table>{rows.length === 0 && <div className="empty">{customers.length ? 'No customers match your search.' : 'No customer records found yet.'}</div>}</div>}
    <p className="tiny muted">Lifetime sales exclude cancelled and returned orders. Outstanding due is calculated from verified payments against non-cancelled, non-returned orders.</p>
  </section>;
}

function CustomerDetailModal({ customer, onClose, onEdit, onReceipt }) {
  const stats = customerOrderStats(customer);
  const phone = (customer.phone || '').replace(/[^0-9]/g, '').replace(/^0/, '880');
  const whatsappUrl = phone ? `https://wa.me/${phone}` : null;
  const orders = [...stats.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal customer-modal" role="dialog" aria-modal="true" aria-labelledby="customer-profile-title">
      <header className="modal-head"><div><p className="eyebrow">CUSTOMER PROFILE</p><h2 id="customer-profile-title">{customer.full_name}</h2><p className="muted">{customer.phone} · {customer.email || 'No email'}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X/></button></header>
      <div className="customer-profile-actions"><button className="secondary" onClick={onEdit}><Pencil size={14}/> Edit details</button>{whatsappUrl && <a className="secondary" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={14}/> WhatsApp</a>}</div>
      <div className="customer-stat-grid profile-stats">
        <div><small>Orders</small><strong>{stats.orders.length}</strong></div><div><small>Lifetime spend</small><strong>{money(stats.spend)}</strong></div><div><small>Paid</small><strong>{money(stats.paid)}</strong></div><div><small>Outstanding due</small><strong>{money(stats.due)}</strong></div>
      </div>
      <div className="customer-address"><strong>Customer details</strong><p>{customer.address || 'Address not provided'}</p><p>{customer.district || 'District not provided'}</p><small>Customer since {new Date(customer.created_at).toLocaleDateString('en-GB')}</small></div>
      <div className="customer-loyalty-card">
        <div><p className="eyebrow">LOYALTY MEMBERSHIP</p><strong className={`tier-name tier-${customer.loyalty?.tier || 'bronze'}`}>{tierLabel(customer.loyalty?.tier)}</strong><small>{Number(customer.loyalty?.points_balance || 0).toLocaleString('en-BD')} available points</small></div>
        <div className="loyalty-profile-numbers"><span><small>Lifetime points</small><b>{Number(customer.loyalty?.lifetime_points || 0).toLocaleString('en-BD')}</b></span><span><small>Qualifying spend</small><b>{money(customer.loyalty?.lifetime_spend_bdt || 0)}</b></span></div>
      </div>
      <div className="loyalty-activity">
        <div className="panel-head"><div><p className="eyebrow">POINTS LEDGER</p><h3>Recent points activity</h3></div></div>
        <div className="table-wrap"><table><thead><tr><th>Date</th><th>Payment</th><th>Qualifying spend</th><th>Points</th><th>Status</th></tr></thead><tbody>
          {[...(customer.loyalty_transactions || [])].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)).slice(0,10).map(tx => <tr key={tx.payment_id}><td>{new Date(tx.created_at).toLocaleDateString('en-GB')}</td><td><small>{tx.payment_id.slice(0,8).toUpperCase()}</small></td><td>{money(tx.spend_delta_bdt)}</td><td>{tx.status === 'earned' ? '+' : '−'}{Number(tx.points_delta || 0)}</td><td><span className={`status ${tx.status === 'earned' ? 'live' : 'warning'}`}>{tx.status}</span></td></tr>)}
        </tbody></table>{!(customer.loyalty_transactions || []).length && <div className="empty">No points activity yet. Points are earned when payments are verified.</div>}</div>
      </div>
      <div className="panel-head"><p className="eyebrow">PURCHASE & RECEIPT HISTORY</p><h3>All orders</h3></div>
      <div className="table-wrap"><table><thead><tr><th>Receipt / Order</th><th>Date</th><th>Channel</th><th>Total</th><th>Payment</th><th></th></tr></thead><tbody>
        {orders.map(order => {
          const paid = (order.payments || []).filter(p => p.status === 'verified').reduce((sum, p) => sum + Number(p.amount_bdt || 0), 0);
          const due = Math.max(Number(order.total_bdt || 0) - paid, 0);
          return <tr key={order.id}><td><strong>{order.receipt_number || order.order_number}</strong><small className="muted" style={{display:'block',marginTop:4}}>{order.order_number}</small></td><td>{new Date(order.created_at).toLocaleDateString('en-GB')}</td><td>{order.source === 'manual' ? 'In-store' : 'Online'}</td><td>{money(order.total_bdt)}</td><td><span className={`status ${due === 0 ? 'live' : 'warning'}`}>{due === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Due'}</span></td><td><button className="secondary small" onClick={() => onReceipt(order.id)}><Receipt size={13}/> Receipt</button></td></tr>;
        })}
      </tbody></table>{orders.length === 0 && <div className="empty">No purchases recorded for this customer.</div>}</div>
      <footer className="modal-actions"><button className="secondary" onClick={onClose}>Close</button></footer>
    </section>
  </div>;
}

function CustomerEditor({ customer, saving, onClose, onSave }) {
  const [form, setForm] = useState({ full_name: customer.full_name || '', phone: customer.phone || '', email: customer.email || '', address: customer.address || '', district: customer.district || '' });
  const [error, setError] = useState('');
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="customer-edit-title">
      <header className="modal-head"><div><p className="eyebrow">CUSTOMER MANAGEMENT</p><h2 id="customer-edit-title">Edit customer</h2></div><button className="icon-btn" onClick={onClose}><X/></button></header>
      <form onSubmit={e => { e.preventDefault(); if (!form.full_name.trim() || !form.phone.trim()) return setError('Customer name and mobile number are required.'); onSave(form); }}>
        <div className="form-grid"><label>Full name *<input required maxLength="80" value={form.full_name} onChange={e => setForm(v => ({...v,full_name:e.target.value}))}/></label><label>Mobile number *<input required maxLength="20" value={form.phone} onChange={e => setForm(v => ({...v,phone:e.target.value}))}/></label><label>Email<input type="email" value={form.email} onChange={e => setForm(v => ({...v,email:e.target.value}))}/></label><label>District<input value={form.district} onChange={e => setForm(v => ({...v,district:e.target.value}))}/></label><label className="span-2">Address<textarea rows="3" value={form.address} onChange={e => setForm(v => ({...v,address:e.target.value}))}/></label></div>
        {error && <p className="form-error">{error}</p>}
        <footer className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save customer'}</button></footer>
      </form>
    </section>
  </div>;
}

function paidTotal(order) {
  return (order.payments || []).filter(p => p.status === 'verified').reduce((sum, p) => sum + Number(p.amount_bdt || 0), 0);
}


function FraudRiskPanel() {
  const [view, setView] = useState('summary');
  const [visitorEvents, setVisitorEvents] = useState([]);
  const [visitorLoading, setVisitorLoading] = useState(false);
  const [visitorError, setVisitorError] = useState('');
  const [range, setRange] = useState('7');
  const [search, setSearch] = useState('');
  const loadVisitorEvents = async () => {
    setVisitorLoading(true); setVisitorError('');
    let query = supabase.from('visitor_events').select('id,visitor_id,event_type,page_path,referrer_host,device_type,product_slug,created_at').order('created_at',{ascending:false}).limit(500);
    if (range !== 'all') query = query.gte('created_at', new Date(Date.now() - Number(range)*86400000).toISOString());
    const { data, error } = await query;
    if (error) { setVisitorError(error.message || 'Visitor event data is unavailable.'); setVisitorEvents([]); }
    else setVisitorEvents(data || []);
    setVisitorLoading(false);
  };
  useEffect(() => { loadVisitorEvents(); }, [range]);
  const uniqueVisitors = new Set(visitorEvents.map(e=>e.visitor_id)).size;
  const productEvents = visitorEvents.filter(e=>e.event_type==='product_view');
  const checkoutEvents = visitorEvents.filter(e=>e.event_type==='checkout_view');
  const referrers = Object.entries(visitorEvents.reduce((acc,e)=>{const key=e.referrer_host||'Direct / None';acc[key]=(acc[key]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const topProducts = Object.entries(productEvents.reduce((acc,e)=>{const key=e.product_slug||e.page_path;acc[key]=(acc[key]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const devices = Object.entries(visitorEvents.reduce((acc,e)=>{acc[e.device_type]=(acc[e.device_type]||0)+1;return acc;},{})).sort((a,b)=>b[1]-a[1]);
  const filteredEvents = visitorEvents.filter(e=>[e.visitor_id,e.page_path,e.referrer_host,e.event_type,e.device_type,e.product_slug].join(' ').toLowerCase().includes(search.toLowerCase()));
  const ranges=[['1','Today'],['7','7 Days'],['30','30 Days'],['all','All Time']];
  return <section className="panel fraud-risk-panel visitor-intelligence-panel">
    <div className="panel-head split"><div><p className="eyebrow">STORE ANALYTICS</p><h2>Visitor Intelligence &amp; Trackers</h2><p className="muted">First-party visitor activity, page engagement and checkout visits.</p></div><button className="secondary" onClick={loadVisitorEvents} disabled={visitorLoading}><RefreshCw size={15}/> Refresh logs</button></div>
    <div className="visitor-topbar"><div className="visitor-tabs"><button className={view==='summary'?'active':''} onClick={()=>setView('summary')}><TrendingUp size={15}/> Executive Summary</button><button className={view==='checkout'?'active':''} onClick={()=>setView('checkout')}><ShoppingBag size={15}/> Checkout Activity</button><button className={view==='logs'?'active':''} onClick={()=>setView('logs')}><Eye size={15}/> All Visitor Logs ({visitorEvents.length})</button></div><div className="visitor-range">{ranges.map(([v,label])=><button key={v} className={range===v?'active':''} onClick={()=>setRange(v)}>{label}</button>)}</div></div>
    {visitorError ? <div className="visitor-empty"><AlertTriangle size={24}/><h3>Visitor tracking is awaiting database setup</h3><p>{visitorError.includes('visitor_events')?'Apply the visitor-intelligence migration before visitor data can appear.':visitorError}</p><small>No existing visitor data has been changed.</small></div> : <>
      {view==='summary' && <>
        <div className="fraud-kpis visitor-kpis"><article><small>Unique visitors / sessions</small><strong>{uniqueVisitors.toLocaleString()}</strong><span>{visitorEvents.length.toLocaleString()} tracked events</span></article><article><small>Product views</small><strong>{productEvents.length.toLocaleString()}</strong><span>Product detail page visits</span></article><article><small>Checkout visits</small><strong>{checkoutEvents.length.toLocaleString()}</strong><span>Checkout page views</span></article><article><small>Mobile sessions</small><strong>{visitorEvents.filter(e=>e.device_type==='mobile').length.toLocaleString()}</strong><span>Recorded mobile events</span></article></div>
        <div className="visitor-summary-grid"><section className="visitor-sources"><div className="panel-head"><h3>Customer Acquisition Sources</h3><small>Top channels</small></div>{referrers.length?referrers.map(([name,count])=><div className="visitor-source-row" key={name}><span>{name}</span><strong>{count} events</strong></div>):<p className="muted">No referrer data in this period.</p>}</section><section className="visitor-sources"><div className="panel-head"><h3>Most Viewed Products</h3><small>Trending</small></div>{topProducts.length?topProducts.map(([name,count],i)=><div className="visitor-source-row" key={name}><span>#{i+1} {name}</span><strong>{count} views</strong></div>):<p className="muted">No product views recorded yet.</p>}</section></div>
        <section className="visitor-sources"><div className="panel-head"><h3>Device Breakdown</h3><small>Recorded events</small></div>{devices.map(([name,count])=><div className="visitor-source-row" key={name}><span>{name}</span><strong>{count}</strong></div>)}</section>
      </>}
      {view==='checkout' && <><div className="fraud-kpis visitor-kpis"><article><small>Checkout page visits</small><strong>{checkoutEvents.length}</strong></article><article><small>Unique checkout sessions</small><strong>{new Set(checkoutEvents.map(e=>e.visitor_id)).size}</strong></article><article><small>Mobile checkout visits</small><strong>{checkoutEvents.filter(e=>e.device_type==='mobile').length}</strong></article><article><small>Desktop checkout visits</small><strong>{checkoutEvents.filter(e=>e.device_type==='desktop').length}</strong></article></div><p className="fraud-disclaimer">These are checkout page visits, not confirmed abandoned carts or identified leads. No customer form data is collected by this tracker.</p><VisitorEventTable events={checkoutEvents} search={search} setSearch={setSearch}/></>}
      {view==='logs' && <VisitorEventTable events={filteredEvents} search={search} setSearch={setSearch}/>}
      {visitorLoading && <div className="visitor-loading"><Loading/></div>}
      <p className="fraud-disclaimer">First-party session analytics only. No IP address, phone number, precise location or form contents are collected. Visitor IDs are session-scoped and are not linked to customer identities. Showing up to the latest 500 events.</p>
    </>}
  </section>;
}

function VisitorEventTable({ events, search, setSearch }) {
  return <><div className="toolbar"><div className="searchbox"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by visitor, page, referrer, device or product"/></div><span className="muted tiny">{events.length} events</span></div><div className="table-wrap"><table><thead><tr><th>Visitor / Session</th><th>Page / Product</th><th>Referrer</th><th>Device</th><th>Event</th><th>Timestamp</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td><code>{e.visitor_id.slice(0,8)}…</code></td><td><strong>{e.page_path}</strong>{e.product_slug&&<small className="muted" style={{display:'block'}}>{e.product_slug}</small>}</td><td>{e.referrer_host||'Direct / None'}</td><td><span className="status">{e.device_type}</span></td><td>{e.event_type.replace('_',' ')}</td><td>{new Date(e.created_at).toLocaleString('en-GB')}</td></tr>)}</tbody></table>{events.length===0&&<div className="empty">No visitor events found for this period.</div>}</div></>;
}

function PaymentPanel({ orders, onNewSale, onRecordPayment, onReceipt, onReviewPayment, saving }) {
  const [filter, setFilter] = useState('all');
  const [reasons, setReasons] = useState({});
  const rows = orders.filter(order => filter === 'all' || (filter === 'due' ? ['unpaid','partially_paid','partial'].includes(order.payment_status) : order.source === 'manual'));
  const pending = orders.flatMap(order => (order.payments || []).filter(p => p.status === 'pending').map(payment => ({...payment, order})));
  return <section className="panel">
    <div className="panel-head split"><div><p className="eyebrow">PAYMENTS & DIGITAL RECEIPTS</p><h2>Money Receipts</h2><p className="muted">Review transfer payments before they affect verified paid totals.</p></div><button className="primary" onClick={onNewSale}><Plus size={16}/> New POS Sale</button></div>
    <section className="payment-review"><div className="panel-head"><p className="eyebrow">MANUAL VERIFICATION</p><h2>Pending payment reviews <span className="count">{pending.length}</span></h2><p className="muted">Only verified payments count toward the order's paid balance.</p></div>
      {pending.length===0?<div className="empty">No pending payment submissions.</div>:<div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Method</th><th>Amount</th><th>Transaction reference</th><th>Review</th></tr></thead><tbody>
        {pending.map(p=><tr key={p.id}><td><strong>{p.order.order_number}</strong></td><td>{p.order.customers?.full_name||'—'}<small className="muted" style={{display:'block'}}>{p.order.customers?.phone||''}</small></td><td>{p.method}</td><td>{money(p.amount_bdt)}</td><td>{p.reference||'—'}</td><td><div className="payment-review-actions"><input aria-label="Rejection reason" placeholder="Reason if rejecting" value={reasons[p.id]||''} onChange={e=>setReasons(v=>({...v,[p.id]:e.target.value}))}/><button className="primary small" disabled={saving||!p.reference||!['bkash','nagad','rocket','bank_transfer'].includes(p.method)} onClick={()=>onReviewPayment(p,'verify',null)}>Verify</button><button className="secondary small" disabled={saving||!(reasons[p.id]||'').trim()} onClick={()=>onReviewPayment(p,'reject',reasons[p.id])}>Reject</button></div></td></tr>)}
      </tbody></table></div>}
    </section>
    <div className="toolbar"><div className="filter-tabs"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All sales</button><button className={filter==='due'?'active':''} onClick={()=>setFilter('due')}>Outstanding due</button><button className={filter==='store'?'active':''} onClick={()=>setFilter('store')}>Store sales</button></div></div>
    <div className="table-wrap"><table><thead><tr><th>Receipt / Order</th><th>Customer</th><th>Channel</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {rows.map(order => { const paid=paidTotal(order); const due=Math.max(Number(order.total_bdt||0)-paid,0); return <tr key={order.id}><td><strong>{order.receipt_number || order.order_number}</strong><small className="muted" style={{display:'block',marginTop:4}}>{order.order_number}</small></td><td>{order.customers?.full_name || '—'}<small className="muted" style={{display:'block',marginTop:4}}>{order.customers?.phone || ''}</small></td><td><span className="status">{order.source==='manual'?'In-store':'Online'}</span></td><td>{money(order.total_bdt)}</td><td>{money(paid)}</td><td><strong>{money(due)}</strong></td><td><span className={`status ${due===0?'live':'warning'}`}>{due===0?'paid':paid>0?'partially paid':'due'}</span></td><td><div className="row-actions"><button className="secondary small" onClick={()=>onReceipt(order)}><Receipt size={13}/> Receipt</button>{due>0 && <button className="primary small" onClick={()=>onRecordPayment(order)}>Paid / Add payment</button>}</div></td></tr>; })}
    </tbody></table>{rows.length===0&&<div className="empty">No matching receipts yet.</div>}</div>
    <p className="tiny muted">WhatsApp sharing opens a prepared message for staff to send. Fully automatic WhatsApp delivery requires an approved WhatsApp Business API integration.</p>
  </section>;
}

function PaymentEntry({ order, saving, onClose, onSubmit }) {
  const paid=paidTotal(order); const due=Math.max(Number(order.total_bdt||0)-paid,0);
  const [amount,setAmount]=useState(String(due)); const [method,setMethod]=useState('cash_on_delivery'); const [reference,setReference]=useState(''); const [notes,setNotes]=useState(''); const [error,setError]=useState('');
  return <div className="modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal" role="dialog" aria-modal="true"><header className="modal-head"><div><p className="eyebrow">RECORD PAYMENT</p><h2>{order.receipt_number||order.order_number}</h2><p className="muted">Outstanding balance: {money(due)}</p></div><button className="icon-btn" onClick={onClose}><X/></button></header><form onSubmit={e=>{e.preventDefault();const n=Number(amount);if(!Number.isInteger(n)||n<=0||n>due)return setError('Enter an amount within the outstanding balance.');onSubmit({amount:n,method,reference,notes});}}><div className="form-grid"><label>Amount received (BDT)<input type="number" min="1" max={due} step="1" required value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Payment method<select value={method} onChange={e=>setMethod(e.target.value)}><option value="cash_on_delivery">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></label><label className="span-2">Transaction reference (optional)<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Transaction ID / reference"/></label><label className="span-2">Notes (optional)<textarea rows="2" value={notes} onChange={e=>setNotes(e.target.value)}/></label></div>{error&&<p className="form-error">{error}</p>}<footer className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving?'Saving…':'Confirm payment'}</button></footer></form></section></div>;
}

function PosSaleModal({ products, saving, onClose, onSubmit }) {
  const [name,setName]=useState(''); const [phone,setPhone]=useState(''); const [email,setEmail]=useState('');
  const [sku,setSku]=useState(products[0]?.sku||''); const [qty,setQty]=useState('1'); const [items,setItems]=useState([]);
  const [amount,setAmount]=useState(''); const [method,setMethod]=useState('cash_on_delivery'); const [reference,setReference]=useState(''); const [notes,setNotes]=useState(''); const [error,setError]=useState('');
  const selected=products.find(p=>p.sku===sku); const total=items.reduce((sum,item)=>sum+Number(item.price_bdt)*Number(item.quantity),0);
  const addItem=()=>{const q=Number(qty);if(!selected||!Number.isInteger(q)||q<1||q>20)return setError('Choose a product and valid quantity.');setItems(old=>{const found=old.find(i=>i.sku===selected.sku);return found?old.map(i=>i.sku===selected.sku?{...i,quantity:i.quantity+q}:i):[...old,{sku:selected.sku,name:selected.name,price_bdt:selected.price_bdt,quantity:q}];});setError('');};
  return <div className="modal-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal order-modal" role="dialog" aria-modal="true"><header className="modal-head"><div><p className="eyebrow">POINT OF SALE</p><h2>New Store Sale</h2><p className="muted">Create a customer receipt for an in-store purchase.</p></div><button className="icon-btn" onClick={onClose}><X/></button></header>
    <form onSubmit={e=>{e.preventDefault();setError('');const paid=Number(amount||0);if(!name.trim()||!/^((\+?880)?1[3-9]\d{8}|01[3-9]\d{8})$/.test(phone.replace(/[\s-]/g,'')))return setError('Enter customer name and valid Bangladesh mobile number.');if(!items.length)return setError('Add at least one product.');if(!Number.isInteger(paid)||paid<0||paid>total)return setError('Payment must be between 0 and the sale total.');onSubmit({name,phone,email,items,amount:paid,method,reference,notes});}}>
      <div className="form-grid"><label>Customer name *<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>Mobile number *<input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="01XXXXXXXXX"/></label><label className="span-2">Email (optional)<input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label className="span-2">Product<select value={sku} onChange={e=>setSku(e.target.value)}>{products.map(p=><option key={p.id} value={p.sku}>{p.name} · {p.sku} · {money(p.price_bdt)}</option>)}</select></label><label>Quantity<input type="number" min="1" max="20" value={qty} onChange={e=>setQty(e.target.value)}/></label><div className="form-field-action"><button type="button" className="secondary" onClick={addItem}>Add product</button></div>
      </div>
      <div className="pos-lines">{items.map(item=><div key={item.sku}><span>{item.name} × {item.quantity}</span><strong>{money(item.price_bdt*item.quantity)}</strong><button type="button" className="icon-btn" onClick={()=>setItems(old=>old.filter(i=>i.sku!==item.sku))}><X size={14}/></button></div>)}{items.length===0&&<p className="muted tiny">No products added yet.</p>}</div>
      <div className="pos-total"><span>Sale total</span><strong>{money(total)}</strong></div>
      <div className="form-grid"><label>Amount received (BDT)<input type="number" min="0" max={total} step="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0 for full due"/></label><label>Payment method<select value={method} onChange={e=>setMethod(e.target.value)}><option value="cash_on_delivery">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></label><label className="span-2">Transaction reference (optional)<input value={reference} onChange={e=>setReference(e.target.value)}/></label><label className="span-2">Notes (optional)<textarea rows="2" value={notes} onChange={e=>setNotes(e.target.value)}/></label></div>
      <p className="tiny muted">Prices are loaded from the published catalogue. Counted stock is checked and reduced automatically when the sale is saved.</p>{error&&<p className="form-error">{error}</p>}<footer className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving||!products.length}>{saving?'Saving sale…':'Create sale & receipt'}</button></footer>
    </form></section></div>;
}

function ReceiptModal({ order, onClose }) {
  const paid=paidTotal(order); const due=Math.max(Number(order.total_bdt||0)-paid,0);
  const phone=(order.customers?.phone||'').replace(/[^0-9]/g,'').replace(/^0/,'880');
  const message=`ZARIAH STUDIO\nDigital Money Receipt: ${order.receipt_number||order.order_number}\nOrder: ${order.order_number}\nCustomer: ${order.customers?.full_name||''}\nTotal: BDT ${order.total_bdt}\nPaid: BDT ${paid}\nDue: BDT ${due}\nThank you for shopping with ZARIAH Studio.`;
  const whatsappUrl=phone?`https://wa.me/${phone}?text=${encodeURIComponent(message)}`:null;
  return <div className="modal-backdrop receipt-backdrop" role="presentation" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title"><div className="receipt-actions no-print"><button className="secondary" onClick={()=>window.print()}><Printer size={15}/> Print / Save PDF</button>{whatsappUrl&&<a className="primary" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={15}/> Share on WhatsApp</a>}<button className="icon-btn" onClick={onClose}><X/></button></div>
    <article className="receipt-sheet"><header><div className="receipt-monogram">Z</div><h2 id="receipt-title">ZARIAH STUDIO</h2><p>DIGITAL MONEY RECEIPT</p></header><div className="receipt-meta"><div><small>Receipt No.</small><strong>{order.receipt_number||'Pending migration'}</strong></div><div><small>Order No.</small><strong>{order.order_number}</strong></div><div><small>Date</small><strong>{new Date(order.created_at).toLocaleString('en-GB')}</strong></div><div><small>Sale channel</small><strong>{order.source==='manual'?'In-store':'Online order'}</strong></div></div><div className="receipt-customer"><strong>{order.customers?.full_name||'Customer'}</strong><span>{order.customers?.phone||''}</span>{order.customers?.address&&<span>{order.customers.address}</span>}</div><table><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>{(order.order_items||[]).map((item,i)=><tr key={i}><td>{item.name_snapshot}<small>{item.sku_snapshot}</small></td><td>{item.quantity}</td><td>{money(item.line_total_bdt)}</td></tr>)}</tbody></table><div className="receipt-totals"><div><span>Subtotal</span><strong>{money(order.subtotal_bdt)}</strong></div>{Number(order.discount_bdt)>0&&<div><span>Discount</span><strong>-{money(order.discount_bdt)}</strong></div>}{Number(order.delivery_fee_bdt)>0&&<div><span>Delivery</span><strong>{money(order.delivery_fee_bdt)}</strong></div>}<div className="receipt-grand"><span>Total</span><strong>{money(order.total_bdt)}</strong></div><div><span>Amount paid</span><strong>{money(paid)}</strong></div><div className="receipt-due"><span>Due amount</span><strong>{money(due)}</strong></div></div><div className="receipt-payment-history"><strong>Payment history</strong>{(order.payments||[]).filter(p=>p.status==='verified').map(p=><div key={p.id}><span>{p.method.replace('_',' ')} · {new Date(p.created_at).toLocaleDateString('en-GB')}</span><strong>{money(p.amount_bdt)}</strong></div>)}{paid===0&&<p>No payment recorded yet.</p>}</div><footer>Thank you for choosing ZARIAH Studio.<br/><small>Keep this digital receipt for your records.</small></footer></article>
  </section></div>;
}

function OrderManager({ order, status, setStatus, courier, setCourier, tracking, setTracking, message, setMessage, saving, onClose, onSave }) {
  const [error, setError] = useState('');
  const submit = async (e) => { e.preventDefault(); setError(''); if (status === 'shipped' && !courier.trim()) return setError('Add the courier name before marking this order as shipped.'); if (status === 'shipped' && !tracking.trim()) return setError('Add the courier tracking number before marking this order as shipped.'); await onSave(); };
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal order-modal" role="dialog" aria-modal="true" aria-labelledby="order-modal-title">
    <header className="modal-head"><div><p className="eyebrow">ORDER MANAGEMENT</p><h2 id="order-modal-title">{order.order_number}</h2><p className="muted">{order.customers?.full_name || 'Customer'} · {order.customers?.phone || 'No phone'}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X/></button></header>
    <div className="order-summary"><div><small>Order total</small><strong>{money(order.total_bdt)}</strong></div><div><small>Payment</small><strong>{order.payment_status?.replace('_',' ')}</strong></div><div><small>Placed</small><strong>{new Date(order.created_at).toLocaleDateString('en-GB')}</strong></div></div>
    <div className="order-delivery-details"><strong>Delivery details</strong><p>{order.customers?.district || 'District not provided'}</p><p>{order.customers?.address || 'Address not provided'}</p>{order.customers?.email && <p>{order.customers.email}</p>}</div>
    <div className="order-items"><strong>Items</strong>{(order.order_items || []).map((item,i) => <div key={i}><span>{item.name_snapshot} <small>({item.sku_snapshot}) × {item.quantity}</small></span><b>{money(item.line_total_bdt)}</b></div>)}</div>
    <form onSubmit={submit}><div className="form-grid"><label>Order status<select value={status} onChange={e => setStatus(e.target.value)}>{['new','confirmed','processing','ready_to_ship','shipped','delivered','cancelled','returned'].map(v => <option key={v} value={v}>{v.replace('_',' ').replace(/^./, c => c.toUpperCase())}</option>)}</select></label><label>Courier name<input value={courier} onChange={e => setCourier(e.target.value)} placeholder="e.g. Pathao / Steadfast"/></label><label className="span-2">Courier tracking number<input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Enter courier consignment / tracking ID"/></label><label className="span-2">Customer-visible update message<textarea rows="3" value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. Your parcel has been handed over to the courier."/></label></div>
      {error && <p className="form-error">{error}</p>}<div className="tracking-history"><strong>Tracking history</strong>{(order.order_tracking_events || []).length ? order.order_tracking_events.map(ev => <div key={ev.id}><span className="status">{ev.status}</span><p>{ev.message}</p><small>{new Date(ev.event_time).toLocaleString('en-GB')}</small></div>) : <p className="muted tiny">No tracking updates recorded yet.</p>}</div>
      <footer className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16}/> : null} Save tracking update</button></footer>
    </form>
  </section></div>;
}

function Stat({ icon: Icon, label, value }) { return <article className="stat-card"><span className="stat-icon"><Icon size={19}/></span><div><small>{label}</small><strong>{value}</strong></div></article>; }
function Loading() { return <div className="loading"><LoaderCircle className="spin"/><span>Loading catalogue…</span></div>; }
function StockInput({ initial, onSave }) { const [value,setValue] = useState(initial); useEffect(()=>setValue(initial),[initial]); return <div className="stock-edit"><input type="number" min="0" step="1" value={value} onChange={e=>setValue(e.target.value)}/><button className="secondary small" onClick={()=>onSave(value)}>Save</button></div>; }

export default App;
