import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Package, Layers3, Warehouse, ShoppingBag, Users,
  CreditCard, Settings, LogOut, Plus, Search, Pencil, Archive, ImagePlus, Wallet,
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

function CostRow({ product, cost, onSave, saving }) {
  const [values, setValues] = useState(() => ({
    purchase_cost: cost?.purchase_cost ?? 0,
    packaging_cost: cost?.packaging_cost ?? 0,
    inbound_shipping_cost: cost?.inbound_shipping_cost ?? 0,
    other_cost: cost?.other_cost ?? 0
  }));
  useEffect(() => setValues({
    purchase_cost: cost?.purchase_cost ?? 0,
    packaging_cost: cost?.packaging_cost ?? 0,
    inbound_shipping_cost: cost?.inbound_shipping_cost ?? 0,
    other_cost: cost?.other_cost ?? 0
  }), [cost]);
  const total = Object.values(values).reduce((sum, value) => sum + Number(value || 0), 0);
  const margin = Number(product.price_bdt || 0) - total;
  const change = (key, value) => setValues(old => ({ ...old, [key]: value }));
  return <tr>
    <td><strong>{product.name}</strong><small style={{display:'block',color:'var(--muted)',marginTop:4}}>{product.sku}</small></td>
    <td>{money(product.price_bdt)}</td>
    <td><input aria-label={`${product.name} purchase cost`} type="number" min="0" step="0.01" value={values.purchase_cost} onChange={e => change('purchase_cost', e.target.value)} /></td>
    <td><input aria-label={`${product.name} packaging cost`} type="number" min="0" step="0.01" value={values.packaging_cost} onChange={e => change('packaging_cost', e.target.value)} /></td>
    <td><input aria-label={`${product.name} inbound shipping cost`} type="number" min="0" step="0.01" value={values.inbound_shipping_cost} onChange={e => change('inbound_shipping_cost', e.target.value)} /></td>
    <td><input aria-label={`${product.name} other cost`} type="number" min="0" step="0.01" value={values.other_cost} onChange={e => change('other_cost', e.target.value)} /></td>
    <td><strong>{money(total)}</strong></td>
    <td><span className={`status ${margin >= 0 ? 'live' : 'warning'}`}>{money(margin)}</span></td>
    <td><button className="secondary small" disabled={saving} onClick={() => onSave(product.id, values)}>Save</button></td>
  </tr>;
}

function FinancePanel({ products, costs, orders, expenses, investments, onSaveCost, onAddExpense, onAddInvestment, saving }) {
  const [expense, setExpense] = useState({ expense_date: new Date().toISOString().slice(0,10), category: '', description: '', amount: '', payment_method: 'cash', notes: '' });
  const [investment, setInvestment] = useState({ transaction_date: '', category: 'other', description: '', amount: '', is_refundable: false, notes: '' });
  const activeOrders = orders.filter(order => !['cancelled','returned'].includes(order.order_status));
  const orderValue = activeOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const collected = activeOrders.reduce((sum, order) => sum + Number(order.amount_paid || 0), 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const investmentTotal = investments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const investmentLabels = { shop_advance: 'Shop advance', website_development: 'Website development', store_decoration: 'Store decoration', inventory_purchase: 'Inventory purchase', equipment: 'Equipment', other: 'Other' };
  const updateExpense = (key, value) => setExpense(old => ({ ...old, [key]: value }));
  const updateInvestment = (key, value) => setInvestment(old => ({ ...old, [key]: value }));
  const submitExpense = async (e) => {
    e.preventDefault();
    if (!expense.category.trim() || !expense.description.trim() || Number(expense.amount) <= 0) return;
    const saved = await onAddExpense({ ...expense, amount: Number(expense.amount) });
    if (saved) setExpense(old => ({ ...old, category: '', description: '', amount: '', notes: '' }));
  };
  const submitInvestment = async (e) => {
    e.preventDefault();
    if (!investment.description.trim() || Number(investment.amount) <= 0) return;
    const saved = await onAddInvestment({ ...investment, transaction_date: investment.transaction_date || null, amount: Number(investment.amount) });
    if (saved) setInvestment(old => ({ ...old, transaction_date: '', description: '', amount: '', notes: '' }));
  };
  const costByProduct = new Map(costs.map(item => [item.product_id, item]));
  return <>
    <div className="stat-grid">
      <Stat icon={ShoppingBag} label="Order value" value={money(orderValue)} />
      <Stat icon={CreditCard} label="Recorded as paid" value={money(collected)} />
      <Stat icon={Wallet} label="Recorded expenses" value={money(expenseTotal)} />
      <Stat icon={Wallet} label="Cash after expenses" value={money(collected - expenseTotal)} />
    </div>
    <section className="panel"><div className="panel-head"><div><p className="eyebrow">CAPITAL & ADVANCES</p><h2>Recorded investment <span className="count">{money(investmentTotal)}</span></h2><p className="muted">One-time setup, inventory purchases and refundable advances are tracked separately from operating expenses and per-unit product costs.</p></div></div>
      <form className="form-grid" onSubmit={submitInvestment}>
        <label>Type<select value={investment.category} onChange={e => updateInvestment('category',e.target.value)}><option value="shop_advance">Shop advance</option><option value="website_development">Website development</option><option value="store_decoration">Store decoration</option><option value="inventory_purchase">Inventory purchase</option><option value="equipment">Equipment</option><option value="other">Other</option></select></label>
        <label>Amount (BDT)<input required type="number" min="0.01" step="0.01" value={investment.amount} onChange={e => updateInvestment('amount',e.target.value)} /></label>
        <label>Description<input required value={investment.description} onChange={e => updateInvestment('description',e.target.value)} placeholder="Investment description" /></label>
        <label>Payment date (optional)<input type="date" value={investment.transaction_date} onChange={e => updateInvestment('transaction_date',e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={investment.is_refundable} onChange={e => updateInvestment('is_refundable',e.target.checked)} /> Refundable advance / deposit</label>
        <label>Notes<input value={investment.notes} onChange={e => updateInvestment('notes',e.target.value)} placeholder="Optional note" /></label>
        <div className="span-2"><button className="primary" disabled={saving || !investment.amount}>Record investment</button></div>
      </form>
      <div className="table-wrap" style={{marginTop:22}}><table><thead><tr><th>Type</th><th>Description</th><th>Payment date</th><th>Classification</th><th>Amount</th></tr></thead><tbody>
        {investments.map(item => <tr key={item.id}><td>{investmentLabels[item.category] || item.category}</td><td>{item.description}<small style={{display:'block',color:'var(--muted)',marginTop:4}}>{item.notes || ''}</small></td><td>{item.transaction_date || 'Not recorded'}</td><td>{item.is_refundable ? 'Refundable advance' : 'Capital / one-time'}</td><td><strong>{money(item.amount)}</strong></td></tr>)}
      </tbody></table>{investments.length===0 && <div className="empty">No investments recorded yet.</div>}</div>
    </section>
    <section className="panel">
      <div className="panel-head"><div><p className="eyebrow">UNIT ECONOMICS</p><h2>Product costing</h2><p className="muted">Record purchase, packaging, inbound shipping and other per-unit costs. Margin shown here excludes marketing and operating expenses.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Product</th><th>Retail price</th><th>Purchase</th><th>Packaging</th><th>Inbound shipping</th><th>Other</th><th>Total unit cost</th><th>Est. unit margin</th><th></th></tr></thead><tbody>
        {products.map(product => <CostRow key={product.id} product={product} cost={costByProduct.get(product.id)} onSave={onSaveCost} saving={saving} />)}
      </tbody></table></div>
    </section>
    <section className="panel">
      <div className="panel-head"><div><p className="eyebrow">OPERATING COSTS</p><h2>Expenses</h2><p className="muted">Record shop rent, decoration, marketing, delivery and other business expenses.</p></div></div>
      <form className="form-grid" onSubmit={submitExpense}>
        <label>Date<input type="date" required value={expense.expense_date} onChange={e => updateExpense('expense_date',e.target.value)} /></label>
        <label>Category<input required value={expense.category} onChange={e => updateExpense('category',e.target.value)} placeholder="Rent / Marketing / Decoration" /></label>
        <label className="span-2">Description<input required value={expense.description} onChange={e => updateExpense('description',e.target.value)} placeholder="Describe the expense" /></label>
        <label>Amount (BDT)<input required type="number" min="0.01" step="0.01" value={expense.amount} onChange={e => updateExpense('amount',e.target.value)} placeholder="0" /></label>
        <label>Payment method<select value={expense.payment_method} onChange={e => updateExpense('payment_method',e.target.value)}><option value="cash">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="bank_transfer">Bank transfer</option><option value="other">Other</option></select></label>
        <label className="span-2">Notes (optional)<input value={expense.notes} onChange={e => updateExpense('notes',e.target.value)} placeholder="Reference or additional details" /></label>
        <div className="span-2"><button className="primary" disabled={saving || !expense.amount}>Record expense</button></div>
      </form>
      <div className="table-wrap" style={{marginTop:22}}><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Method</th><th>Amount</th></tr></thead><tbody>
        {expenses.map(item => <tr key={item.id}><td>{item.expense_date}</td><td>{item.category}</td><td>{item.description}</td><td>{item.payment_method || '—'}</td><td><strong>{money(item.amount)}</strong></td></tr>)}
      </tbody></table>{expenses.length===0 && <div className="empty">No expenses recorded yet.</div>}</div>
    </section>
    <section className="panel">
      <div className="panel-head"><div><p className="eyebrow">SALES SUMMARY</p><h2>Recent orders</h2><p className="muted">Order value and collection totals are based on recorded orders. Cancelled and returned orders are excluded.</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Payment</th><th>Order value</th><th>Collected</th></tr></thead><tbody>
        {orders.slice(0,20).map(order => <tr key={order.id}><td>{order.order_number}</td><td>{new Date(order.created_at).toLocaleDateString('en-GB')}</td><td>{order.order_status}</td><td>{order.payment_status}</td><td>{money(order.total_amount)}</td><td>{money(order.amount_paid)}</td></tr>)}
      </tbody></table>{orders.length===0 && <div className="empty">No orders recorded yet. Sales will appear here when orders are connected.</div>}</div>
    </section>
  </>;
}


function OrdersPanel({ orders, products, onCreateSale, onUpdateStatus, onRecordPayment, saving }) {
  const [form,setForm]=useState({full_name:'',phone:'',sku:'',quantity:1,paid:0,method:'cash',reference:'',notes:''});
  const [editing,setEditing]=useState(null);
  const [payment,setPayment]=useState(null);
  const [query,setQuery]=useState('');
  const update=(key,value)=>setForm(old=>({...old,[key]:value}));
  const visible=orders.filter(o=>[o.order_number,o.customer_name,o.customer_phone,o.order_status].join(' ').toLowerCase().includes(query.toLowerCase()));
  const submit=async e=>{e.preventDefault();if(!form.sku)return;const ok=await onCreateSale({full_name:form.full_name,phone:form.phone},[{sku:form.sku,quantity:Number(form.quantity)}],Number(form.paid||0),form.method,form.reference,form.notes);if(ok)setForm({full_name:'',phone:'',sku:'',quantity:1,paid:0,method:'cash',reference:'',notes:''});};
  return <>
    <section className="panel">
      <div className="panel-head"><div><p className="eyebrow">IN-STORE SALES</p><h2>Record a sale</h2><p className="muted">Create a POS order, record collection and update counted stock in one transaction.</p></div></div>
      <form className="form-grid" onSubmit={submit}>
        <label>Customer name *<input required value={form.full_name} onChange={e=>update('full_name',e.target.value)} placeholder="Customer name"/></label>
        <label>Mobile number *<input required value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder="01XXXXXXXXX"/></label>
        <label>Product *<select required value={form.sku} onChange={e=>update('sku',e.target.value)}><option value="">Select product</option>{products.filter(p=>p.is_published).map(p=><option key={p.id} value={p.sku}>{p.sku} · {p.name} · {money(p.price_bdt)}</option>)}</select></label>
        <label>Quantity<input required type="number" min="1" max="20" value={form.quantity} onChange={e=>update('quantity',e.target.value)}/></label>
        <label>Amount received (BDT)<input type="number" min="0" step="1" value={form.paid} onChange={e=>update('paid',e.target.value)}/></label>
        <label>Payment method<select value={form.method} onChange={e=>update('method',e.target.value)}><option value="cash">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></select></label>
        <label>Transaction reference<input value={form.reference} onChange={e=>update('reference',e.target.value)} placeholder="Optional"/></label>
        <label>Notes<input value={form.notes} onChange={e=>update('notes',e.target.value)} placeholder="Optional"/></label>
        <div className="span-2"><button className="primary" disabled={saving||!form.sku}><Plus size={16}/> Create POS sale</button></div>
      </form>
    </section>
    <section className="panel">
      <div className="panel-head split"><div><p className="eyebrow">ORDER MANAGEMENT</p><h2>Orders <span className="count">{orders.length}</span></h2><p className="muted">Review orders, update fulfilment and record additional payments.</p></div><div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order / customer"/></div></div>
      <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Paid</th><th>Due</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {visible.map(o=><tr key={o.id}>
        <td><strong>{o.order_number}</strong><small style={{display:'block',color:'var(--muted)',marginTop:4}}>{o.receipt_number||'Receipt pending'}</small></td>
        <td>{o.customer_name}<small style={{display:'block',color:'var(--muted)',marginTop:4}}>{o.customer_phone}</small></td>
        <td>{new Date(o.created_at).toLocaleDateString('en-GB')}</td><td>{money(o.total_amount)}</td><td>{money(o.amount_paid)}</td><td>{money(Math.max(0,Number(o.total_amount||0)-Number(o.amount_paid||0)))}</td>
        <td><span className="status">{o.payment_status}</span></td>
        <td><select aria-label={'Status for '+o.order_number} value={o.order_status} onChange={e=>setEditing({id:o.id,status:e.target.value,courier:o.courier_name||'',tracking:o.courier_tracking_number||''})}>{['pending','confirmed','processing','ready_to_ship','shipped','delivered','cancelled','returned'].map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></td>
        <td><div className="row-actions"><button className="secondary small" disabled={!editing||editing.id!==o.id||saving} onClick={()=>onUpdateStatus(o.id,editing.status,editing.courier,editing.tracking).then(ok=>ok&&setEditing(null))}>Save</button><button className="secondary small" disabled={['cancelled','returned'].includes(o.order_status)||Number(o.total_amount)<=Number(o.amount_paid)} onClick={()=>setPayment(o)}>Payment</button></div></td>
      </tr>)}
      </tbody></table>{visible.length===0&&<div className="empty">No matching orders.</div>}</div>
      {editing&&<div className="form-grid" style={{marginTop:18}}><label>Courier name<input value={editing.courier} onChange={e=>setEditing(v=>({...v,courier:e.target.value}))} placeholder="Courier / delivery partner"/></label><label>Tracking number<input value={editing.tracking} onChange={e=>setEditing(v=>({...v,tracking:e.target.value}))} placeholder="Tracking ID"/></label></div>}
    </section>
    {payment&&<PaymentEntryModal order={payment} onClose={()=>setPayment(null)} onSave={async payload=>{const ok=await onRecordPayment(payment.id,payload);if(ok)setPayment(null);}} saving={saving}/>}
  </>;
}

function PaymentEntryModal({order,onClose,onSave,saving}) {
 const [amount,setAmount]=useState(String(Math.max(0,Number(order.total_amount||0)-Number(order.amount_paid||0))));
 const [method,setMethod]=useState('cash');const [reference,setReference]=useState('');const [notes,setNotes]=useState('');
 return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal" role="dialog" aria-modal="true">
  <header className="modal-head"><div><p className="eyebrow">PAYMENT COLLECTION</p><h2>Record payment</h2><p className="muted">{order.order_number} · Due {money(Number(order.total_amount||0)-Number(order.amount_paid||0))}</p></div><button className="icon-btn" onClick={onClose}><X/></button></header>
  <form onSubmit={e=>{e.preventDefault();onSave({amount_bdt:Number(amount),method,reference,notes});}}>
   <div className="form-grid"><label>Amount (BDT) *<input required type="number" min="1" max={Math.max(0,Number(order.total_amount||0)-Number(order.amount_paid||0))} step="1" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
   <label>Method<select value={method} onChange={e=>setMethod(e.target.value)}><option value="cash">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></select></label>
   <label>Reference<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Transaction ID (optional)"/></label><label>Notes<input value={notes} onChange={e=>setNotes(e.target.value)}/></label></div>
   <footer className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving||Number(amount)<=0}>Verify & record payment</button></footer>
  </form>
 </section></div>;
}

function CustomersPanel({customers,onSave,saving}) {
 const [query,setQuery]=useState('');const [selected,setSelected]=useState(null);
 const [form,setForm]=useState({full_name:'',phone:'',email:'',address:'',district:'',city:'',notes:''});
 const start=c=>{setSelected(c?.id||null);setForm(c?{full_name:c.full_name||'',phone:c.phone||'',email:c.email||'',address:c.address||'',district:c.district||'',city:c.city||'',notes:c.notes||''}:{full_name:'',phone:'',email:'',address:'',district:'',city:'',notes:''});};
 const visible=customers.filter(c=>[c.full_name,c.phone,c.email,c.district].join(' ').toLowerCase().includes(query.toLowerCase()));
 const submit=async e=>{e.preventDefault();const ok=await onSave(selected,form);if(ok)start(null);};
 return <><section className="panel"><div className="panel-head split"><div><p className="eyebrow">CUSTOMER RELATIONSHIP</p><h2>Customers <span className="count">{customers.length}</span></h2><p className="muted">Customer profiles and loyalty status from verified payments.</p></div><button className="primary" onClick={()=>start(null)}><Plus size={16}/> Add customer</button></div>
 <div className="toolbar"><div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, phone or email"/></div></div>
 <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Phone</th><th>District</th><th>Orders</th><th>Lifetime spend</th><th>Points</th><th>Tier</th><th></th></tr></thead><tbody>
 {visible.map(c=>{const loyalty=Array.isArray(c.customer_loyalty_accounts)?c.customer_loyalty_accounts[0]:c.customer_loyalty_accounts;return <tr key={c.id}><td><strong>{c.full_name}</strong><small style={{display:'block',color:'var(--muted)',marginTop:4}}>{c.email||'No email'}</small></td><td>{c.phone}</td><td>{c.district||c.city||'—'}</td><td>{c.order_count||0}</td><td>{money(loyalty?.lifetime_spend_bdt||0)}</td><td>{loyalty?.points_balance||0}</td><td><span className="status live">{loyalty?.tier||'bronze'}</span></td><td><button className="secondary small" onClick={()=>start(c)}>Edit</button></td></tr>})}
 </tbody></table>{visible.length===0&&<div className="empty">No customers found.</div>}</div></section>
 {form&&<section className="panel"><div className="panel-head"><p className="eyebrow">CUSTOMER PROFILE</p><h2>{selected?'Edit customer':'Add customer'}</h2></div><form className="form-grid" onSubmit={submit}>
 <label>Full name *<input required value={form.full_name} onChange={e=>setForm(v=>({...v,full_name:e.target.value}))}/></label><label>Phone *<input required value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))}/></label>
 <label>Email<input type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))}/></label><label>District<input value={form.district} onChange={e=>setForm(v=>({...v,district:e.target.value}))}/></label>
 <label>City<input value={form.city} onChange={e=>setForm(v=>({...v,city:e.target.value}))}/></label><label>Address<input value={form.address} onChange={e=>setForm(v=>({...v,address:e.target.value}))}/></label>
 <label className="span-2">Notes<textarea rows="2" value={form.notes} onChange={e=>setForm(v=>({...v,notes:e.target.value}))}/></label>
 <div className="span-2"><button className="primary" disabled={saving}>Save customer</button>{selected&&<button type="button" className="secondary" style={{marginLeft:8}} onClick={()=>start(null)}>Cancel edit</button>}</div>
 </form></section>}</>;
}

function PaymentsPanel({payments,orders}) {
 const total=payments.filter(p=>p.status==='verified').reduce((s,p)=>s+Number(p.amount_bdt||0),0);
 return <section className="panel"><div className="panel-head"><p className="eyebrow">PAYMENT LEDGER</p><h2>Payments <span className="count">{payments.length}</span></h2><p className="muted">Verified payment records. New collections are recorded from the Orders module.</p></div>
 <div className="stat-grid"><Stat icon={CreditCard} label="Verified collections" value={money(total)}/><Stat icon={ShoppingBag} label="Payment entries" value={payments.length}/><Stat icon={AlertCircle} label="Pending verification" value={payments.filter(p=>p.status==='pending').length}/><Stat icon={Wallet} label="Orders with balance" value={orders.filter(o=>Number(o.total_amount||0)>Number(o.amount_paid||0)&&!['cancelled','returned'].includes(o.order_status)).length}/></div>
 <div className="table-wrap"><table><thead><tr><th>Date</th><th>Order</th><th>Customer</th><th>Method</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>
 {payments.map(p=><tr key={p.id}><td>{new Date(p.received_at||p.created_at).toLocaleString('en-GB')}</td><td>{p.orders?.order_number||p.order_id}</td><td>{p.orders?.customer_name||'—'}<small style={{display:'block',color:'var(--muted)',marginTop:4}}>{p.orders?.customer_phone||''}</small></td><td>{p.method||p.payment_method}</td><td>{p.reference||p.transaction_reference||'—'}</td><td><strong>{money(p.amount_bdt||p.amount)}</strong></td><td><span className={'status '+(p.status==='verified'?'live':'warning')}>{p.status}</span></td></tr>)}
 </tbody></table>{payments.length===0&&<div className="empty">No payments recorded yet.</div>}</div>
 </section>;
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
  const [costs, setCosts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const notify = (type, message) => setNotice({ type, message });
  const loadData = useCallback(async () => {
    if (!supabase || !session) return;
    setDataLoading(true);
    const [p, c, costRows, expenseRows, orderRows, customerRows, paymentRows, investmentRows] = await Promise.all([
      supabase.from('products').select('*, collections(name), product_images(*), inventory(on_hand,reserved,stock_counted,low_stock_threshold)').order('display_order', { foreignTable: 'product_images' }).order('display_order').order('created_at', { ascending: false }),
      supabase.from('collections').select('*').order('display_order').order('name'),
      supabase.from('product_costs').select('*'),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(200),
      supabase.from('customers').select('*, customer_loyalty_accounts(points_balance,lifetime_spend_bdt,tier)').order('created_at', { ascending: false }).limit(500),
      supabase.from('payments').select('*, orders(order_number,customer_name,customer_phone)').order('received_at', { ascending: false }).limit(500),
      supabase.from('business_investments').select('*').order('transaction_date', { ascending: false }).order('created_at', { ascending: false })
    ]);
    if (p.error) notify('error', p.error.message); else setProducts(p.data || []);
    if (c.error) notify('error', c.error.message); else setCollections(c.data || []);
    if (costRows.error) notify('error', costRows.error.message); else setCosts(costRows.data || []);
    if (expenseRows.error) notify('error', expenseRows.error.message); else setExpenses(expenseRows.data || []);
    if (orderRows.error) notify('error', orderRows.error.message); else setOrders(orderRows.data || []);
    if (customerRows.error) notify('error', customerRows.error.message); else setCustomers(customerRows.data || []);
    if (paymentRows.error) notify('error', paymentRows.error.message); else setPayments(paymentRows.data || []);
    if (investmentRows.error) notify('error', investmentRows.error.message); else setInvestments(investmentRows.data || []);
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

  const saveProductCost = async (productId, values) => {
    const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value || 0)]));
    if (Object.values(payload).some(value => !Number.isFinite(value) || value < 0)) return notify('error', 'Costs must be valid non-negative amounts.');
    setSaving(true);
    try {
      const { error } = await supabase.from('product_costs').upsert({ product_id: productId, ...payload }, { onConflict: 'product_id' });
      if (error) notify('error', error.message); else { await loadData(); notify('success', 'Product costing saved.'); }
    } finally { setSaving(false); }
  };

  const addExpense = async (payload) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('expenses').insert({ ...payload, created_by: session.user.id });
      if (error) { notify('error', error.message); return false; }
      await loadData(); notify('success', 'Expense recorded.'); return true;
    } finally { setSaving(false); }
  };

  const addInvestment = async (payload) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('business_investments').insert({ ...payload, created_by: session.user.id });
      if (error) { notify('error', error.message); return false; }
      await loadData(); notify('success', 'Investment recorded.'); return true;
    } finally { setSaving(false); }
  };


  const createPosSale = async (customer, items, paid, method, reference, notes) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('create_pos_sale', {
        p_customer: customer, p_items: items, p_payment_amount_bdt: paid,
        p_payment_method: method, p_payment_reference: reference || null, p_notes: notes || null
      });
      if (error) throw error;
      await loadData();
      notify('success', `Sale recorded: ${data.order_number} · Receipt ${data.receipt_number}`);
      return true;
    } catch (err) { notify('error', err.message || 'Could not create sale.'); return false; }
    finally { setSaving(false); }
  };

  const updateOrderStatus = async (orderId, status, courier, tracking) => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('update_order_fulfilment', {
        p_order_id: orderId, p_status: status, p_courier_name: courier || null,
        p_tracking_number: tracking || null, p_message: null
      });
      if (error) throw error;
      await loadData(); notify('success', 'Order status updated.'); return true;
    } catch (err) { notify('error', err.message || 'Could not update order.'); return false; }
    finally { setSaving(false); }
  };

  const recordOrderPayment = async (orderId, payload) => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('record_order_payment', {
        p_order_id: orderId, p_amount_bdt: payload.amount_bdt, p_method: payload.method,
        p_reference: payload.reference || null, p_notes: payload.notes || null
      });
      if (error) throw error;
      await loadData(); notify('success', 'Payment verified and recorded.'); return true;
    } catch (err) { notify('error', err.message || 'Could not record payment.'); return false; }
    finally { setSaving(false); }
  };

  const saveCustomer = async (customerId, payload) => {
    setSaving(true);
    try {
      const clean = Object.fromEntries(Object.entries(payload).map(([k,v])=>[k,typeof v==='string'?(v.trim()||null):v]));
      if (!clean.full_name || !clean.phone) throw new Error('Customer name and phone are required.');
      const result = customerId
        ? await supabase.from('customers').update(clean).eq('id',customerId)
        : await supabase.from('customers').insert(clean);
      if (result.error) throw result.error;
      await loadData(); notify('success',customerId?'Customer updated.':'Customer created.'); return true;
    } catch (err) { notify('error',err.message||'Could not save customer.'); return false; }
    finally { setSaving(false); }
  };

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
  const lowStock = products.filter(p => { const stock = p.inventory?.[0]; return Boolean(stock?.stock_counted) && stock.on_hand <= (stock.low_stock_threshold ?? 2); }).length;

  if (!supabaseConfigured) return <main className="setup-wrap"><section className="setup-card"><div className="brand-mark">Z</div><p className="eyebrow">ZARIAH STUDIO</p><h1>Admin setup required</h1><p className="muted">The admin app is ready for configuration. Add the Supabase Project URL and anon/public key to <code>admin-app/.env.local</code> for local testing. Never use the service_role key in the browser.</p><p className="tiny muted">Project: zariah-studio-sg · Region: Singapore</p></section></main>;
  if (loading) return <main className="setup-wrap"><LoaderCircle className="spin" size={28}/><span className="muted">Checking secure admin session…</span></main>;
  if (!session || !profile) return <><Login onLogin={signIn} busy={loginBusy} error={loginError}/></>;

  const nav = [
    ['dashboard','Overview',LayoutDashboard],['products','Products',Package],['collections','Collections',Layers3],['inventory','Inventory',Warehouse],
    ['finance','Costs & Expenses',Wallet],['orders','Orders',ShoppingBag],['customers','Customers & Members',Users],['payments','Payments',CreditCard]
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
          {dataLoading ? <Loading/> : <div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>Collection</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(p => <tr key={p.id}><td><div className="product-cell">{p.product_images?.[0]?.public_url ? <img src={p.product_images[0].public_url} alt="" /> : <div className="thumb-placeholder"><ImagePlus size={16}/></div>}<div><strong>{p.name}</strong><small>{p.product_type || '—'}</small></div></div></td><td>{p.sku}</td><td>{p.collections?.name || '—'}</td><td>{money(p.price_bdt)}</td><td>{p.inventory?.[0]?.stock_counted ? p.inventory[0].on_hand : '—'}</td><td><span className={`status ${p.is_published ? 'live' : ''}`}>{p.is_published ? 'Published' : 'Draft'}</span></td><td><div className="row-actions"><button className="icon-btn" title="Edit" onClick={() => setEditor(p)}><Pencil size={16}/></button><button className="icon-btn" title="Archive" onClick={() => archiveProduct(p)}><Archive size={16}/></button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty">No products found. Add your first product.</div>}</div>}
        </section>}
        {section === 'collections' && <CollectionPanel collections={collections} onCreate={createCollection} onToggle={toggleCollection} saving={saving}/>}
        {section === 'orders' && <OrdersPanel orders={orders} products={products} onCreateSale={createPosSale} onUpdateStatus={updateOrderStatus} onRecordPayment={recordOrderPayment} saving={saving}/>}
        {section === 'customers' && <CustomersPanel customers={customers} onSave={saveCustomer} saving={saving}/>}
        {section === 'payments' && <PaymentsPanel payments={payments} orders={orders}/>}
        {section === 'finance' && <FinancePanel products={products} costs={costs} orders={orders} expenses={expenses} investments={investments} onSaveCost={saveProductCost} onAddExpense={addExpense} onAddInvestment={addInvestment} saving={saving}/>}
        {section === 'inventory' && <section className="panel"><div className="panel-head"><div><p className="eyebrow">STOCK CONTROL</p><h2>Inventory</h2><p className="muted">Set the current on-hand quantity for each product.</p></div></div><div className="table-wrap"><table><thead><tr><th>Product</th><th>SKU</th><th>On hand</th><th>Stock level</th><th>Update quantity</th></tr></thead><tbody>{products.map(p => { const stock = p.inventory?.[0]; const qty = stock?.on_hand ?? 0; const counted = Boolean(stock?.stock_counted); const threshold = stock?.low_stock_threshold ?? 2; const label = !counted ? 'Not counted' : qty > threshold ? 'In stock' : 'Low stock'; return <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.sku}</td><td>{counted ? qty : '—'}</td><td><span className={`status ${!counted ? '' : qty > threshold ? 'live' : 'warning'}`}>{label}</span></td><td><StockInput initial={qty} onSave={v => adjustStock(p,v)}/></td></tr>; })}</tbody></table></div></section>}
      </div>
    </main>
    {editor && <ProductEditor product={editor.id ? editor : null} collections={collections.filter(c => c.is_active)} onClose={() => setEditor(null)} onSave={saveProduct} saving={saving}/>}
  </div>;
}

function Stat({ icon: Icon, label, value }) { return <article className="stat-card"><span className="stat-icon"><Icon size={19}/></span><div><small>{label}</small><strong>{value}</strong></div></article>; }
function Loading() { return <div className="loading"><LoaderCircle className="spin"/><span>Loading catalogue…</span></div>; }
function StockInput({ initial, onSave }) { const [value,setValue] = useState(initial); useEffect(()=>setValue(initial),[initial]); return <div className="stock-edit"><input type="number" min="0" step="1" value={value} onChange={e=>setValue(e.target.value)}/><button className="secondary small" onClick={()=>onSave(value)}>Save</button></div>; }

export default App;
