import { createClient } from '@supabase/supabase-js';

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key} in admin-app/.env.local`);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const owner = 'zariahstudio';
const repo = 'zariah.studio';
const branch = 'main';
const api = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
if (!api.ok) throw new Error(`GitHub asset listing failed: HTTP ${api.status}`);
const tree = await api.json();
const assets = (tree.tree || []).filter(item =>
  item.type === 'blob' && item.path.startsWith('images/products/') && /\.(webp|jpe?g|png)$/i.test(item.path)
);

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD
});
if (authError) throw new Error(`Admin sign-in failed: ${authError.message}`);

const { data: products, error: productsError } = await supabase
  .from('products').select('id,sku,name');
if (productsError) throw new Error(`Could not load products: ${productsError.message}`);

const productByFolder = new Map(products.map(p => [p.sku.toLowerCase(), p]));
let uploaded = 0;
let skipped = 0;
const failures = [];

for (const asset of assets) {
  const parts = asset.path.split('/');
  const folder = (parts[2] || '').toLowerCase();
  const filename = parts.at(-1);
  const product = productByFolder.get(folder);
  if (!product) { skipped++; continue; }

  const roleName = filename.replace(/\.[^.]+$/, '').toLowerCase();
  const imageRole = ['front','side','detail','inside','back','lifestyle'].includes(roleName) ? roleName : 'gallery';
  const storagePath = `${product.id}/${filename}`;
  try {
    const raw = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${asset.path}`);
    if (!raw.ok) throw new Error(`Source image returned HTTP ${raw.status}`);
    const bytes = new Uint8Array(await raw.arrayBuffer());
    const mime = raw.headers.get('content-type') || (filename.endsWith('.png') ? 'image/png' : filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 'image/webp');

    const { error: uploadError } = await supabase.storage.from('product-images').upload(storagePath, bytes, {
      contentType: mime, upsert: true
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
    const { error: rowError } = await supabase.from('product_images').upsert({
      product_id: product.id,
      storage_path: storagePath,
      public_url: publicData.publicUrl,
      alt_text: `${product.name} - ${roleName} view`,
      image_role: imageRole,
      display_order: ['front','side','detail','inside','back','lifestyle'].indexOf(imageRole) < 0 ? 99 : ['front','side','detail','inside','back','lifestyle'].indexOf(imageRole)
    }, { onConflict: 'product_id,storage_path' });
    if (rowError) throw rowError;
    uploaded++;
    process.stdout.write(`Uploaded ${asset.path}\n`);
  } catch (error) {
    failures.push({ path: asset.path, error: error.message });
    process.stderr.write(`FAILED ${asset.path}: ${error.message}\n`);
  }
}

await supabase.auth.signOut();
process.stdout.write(`\nFinished. Uploaded/registered: ${uploaded}; skipped: ${skipped}; failed: ${failures.length}.\n`);
if (failures.length) process.exitCode = 1;
