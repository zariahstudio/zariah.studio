<?php
declare(strict_types=1);

/*
 * ZARIAH Studio — server-rendered product SEO route.
 * Uses the public Supabase publishable key only; never place a service-role key here.
 */
const ZARIAH_SUPABASE_URL = 'https://keuqvqnhxlpsglsjfopd.supabase.co';
const ZARIAH_SUPABASE_KEY = 'sb_publishable_xOChFWtLlhLN_y8inW_nvQ__rX-zpno';
const ZARIAH_SITE_URL = 'https://www.zariahstudio.com';

function z_escape($value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function z_rpc(string $function, array $payload = []) {
    $url = ZARIAH_SUPABASE_URL . '/rest/v1/rpc/' . rawurlencode($function);
    $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
        'apikey: ' . ZARIAH_SUPABASE_KEY,
        'Authorization: Bearer ' . ZARIAH_SUPABASE_KEY
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10
        ]);
        $response = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($response === false || $status < 200 || $status >= 300) return null;
    } else {
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $body,
            'timeout' => 10,
            'ignore_errors' => true
        ]]);
        $response = @file_get_contents($url, false, $context);
        if ($response === false) return null;
        $statusLine = $http_response_header[0] ?? '';
        if (!preg_match('/\\s2\\d\\d\\s/', $statusLine)) return null;
    }

    $decoded = json_decode((string)$response, true);
    return is_array($decoded) ? $decoded : null;
}

$slug = isset($_GET['slug']) ? strtolower(trim((string)$_GET['slug'])) : '';
if (!preg_match('/^[a-z0-9-]{1,100}$/', $slug)) {
    http_response_code(404);
    header('X-Robots-Tag: noindex, nofollow');
    exit('Not found');
}

$product = z_rpc('get_product_seo_page', ['p_slug' => $slug]);
if (!is_array($product) || empty($product['slug'])) {
    // Keep the existing static product page and cart available if the SEO RPC
    // is unavailable or the product has not yet been published to the catalogue.
    $staticProductPage = __DIR__ . '/products/' . $slug . '/index.html';
    if (is_file($staticProductPage) && is_readable($staticProductPage)) {
        header('Content-Type: text/html; charset=UTF-8');
        header('X-Robots-Tag: index, follow');
        readfile($staticProductPage);
        exit;
    }

    http_response_code(404);
    header('X-Robots-Tag: noindex, nofollow');
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Product unavailable | ZARIAH Studio</title></head><body><main><h1>This product is unavailable</h1><a href="/">Return to ZARIAH Studio</a></main></body></html>';
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=60, s-maxage=60');
header('Vary: Accept-Encoding');

$name = (string)($product['name'] ?? 'Handbag');
$brand = trim((string)($product['brand'] ?? $product['brand_name'] ?? ''));
$type = (string)($product['product_type'] ?? 'Handbag');
$description = trim((string)($product['description'] ?? ''));
$seoTitle = trim((string)($product['seo_title'] ?? '')) ?: ($name . ' | ZARIAH Studio Bangladesh');
$seoDescription = trim((string)($product['seo_description'] ?? '')) ?: ('Shop ' . $name . ' at ZARIAH Studio. Discover selected handbags from local and international brands. Delivery across Bangladesh.');
$canonical = ZARIAH_SITE_URL . '/products/' . rawurlencode($slug) . '/';
$price = (int)($product['price_bdt'] ?? 0);
$comparePrice = isset($product['compare_at_price_bdt']) ? (int)$product['compare_at_price_bdt'] : null;
$images = is_array($product['images'] ?? null) ? $product['images'] : [];
$primaryImage = '';
foreach ($images as $image) {
    if (!empty($image['url'])) { $primaryImage = (string)$image['url']; break; }
}
if ($primaryImage === '') $primaryImage = ZARIAH_SITE_URL . '/images/brand/favicon.png';

$isPreorder = (($product['availability_mode'] ?? '') === 'pre_order');
$isSoldOut = !empty($product['is_sold_out']);
$availability = $isPreorder ? 'https://schema.org/PreOrder' : ($isSoldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock');
$availabilityText = $isPreorder ? 'Available for pre-order' : ($isSoldOut ? 'Currently unavailable' : 'Available to order');
$schema = [
    '@context' => 'https://schema.org',
    '@type' => 'Product',
    'name' => $name,
    'description' => $description !== '' ? $description : $seoDescription,
    'sku' => (string)($product['sku'] ?? $slug),
    'url' => $canonical,
    'image' => array_values(array_filter(array_map(function($image) {
        return is_array($image) ? ($image['url'] ?? null) : null;
    }, $images))),
    'offers' => [
        '@type' => 'Offer',
        'url' => $canonical,
        'priceCurrency' => 'BDT',
        'price' => (string)$price,
        'availability' => $availability,
        'itemCondition' => 'https://schema.org/NewCondition',
        'seller' => ['@type' => 'Organization', 'name' => 'ZARIAH Studio']
    ]
]; 
if ($brand !== '') { $schema['brand'] = ['@type' => 'Brand', 'name' => $brand]; }
$schemaJson = json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
$specs = [
    'Brand' => $brand,
    'Style' => $type,
    'Available colours' => (string)($product['color'] ?? ''),
    'Approx. dimensions' => (string)($product['size_text'] ?? '')
];
$specs = array_filter($specs, function($value) { return trim((string)$value) !== ''; });
$sku = strtolower((string)($product['sku'] ?? $slug));
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= z_escape($seoTitle) ?></title>
<meta name="description" content="<?= z_escape($seoDescription) ?>">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="<?= z_escape($canonical) ?>">
<meta property="og:type" content="product">
<meta property="og:site_name" content="ZARIAH Studio">
<meta property="og:title" content="<?= z_escape($seoTitle) ?>">
<meta property="og:description" content="<?= z_escape($seoDescription) ?>">
<meta property="og:url" content="<?= z_escape($canonical) ?>">
<meta property="og:image" content="<?= z_escape($primaryImage) ?>">
<meta property="og:image:alt" content="<?= z_escape($name) ?>">
<meta property="product:price:amount" content="<?= z_escape((string)$price) ?>">
<meta property="product:price:currency" content="BDT">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= z_escape($seoTitle) ?>">
<meta name="twitter:description" content="<?= z_escape($seoDescription) ?>">
<meta name="twitter:image" content="<?= z_escape($primaryImage) ?>">
<meta name="theme-color" content="#F8F6F2">
<link rel="icon" href="/images/brand/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/product-detail-base.css?v=20261111-dynamic-seo">
<link rel="stylesheet" href="/assets/css/product-detail-experience.css?v=20261113-dynamic-buynow">
<link rel="stylesheet" href="/assets/css/brand-typography.css?v=20261109">
<link rel="stylesheet" href="/assets/css/mobile-commerce-controls.css?v=20261110-mobile-ux3">
<link rel="stylesheet" href="/assets/css/desktop-readability-refinement.css?v=20261110-desktop-type2">
<link rel="stylesheet" href="/assets/css/desktop-editorial-redesign.css?v=20261110-editorial-v2">
<script type="application/ld+json"><?= $schemaJson ?></script>
</head>
<body>
<div class="ann">ZARIAH STUDIO · LOCAL & INTERNATIONAL HANDBAG BRANDS</div>
<header>
<a class="brand" href="/">ZARIAH<small>STUDIO</small></a>
<nav><a href="/">Home</a><a href="/collections/all-bags/">All Bags</a><a href="/collections/all-bags/">Shop by Brand</a><a href="/pages/cart/" class="z-cart-nav" aria-label="Shopping bag">Bag <span class="z-cart-count" data-cart-count>0</span></a></nav>
</header>
<main>
<div class="breadcrumb"><a href="/">Home</a> / <a href="/collections/all-bags/">All Bags</a> / <?= z_escape($name) ?></div>
<section class="product-layout">
<div class="gallery">
<div class="main-image">
<?php if (!empty($product['is_bestseller'])): ?><span class="badge">Bestseller</span><?php elseif (!empty($product['is_featured'])): ?><span class="badge">Featured</span><?php endif; ?>
<img id="mainProductImage" src="<?= z_escape($primaryImage) ?>" alt="<?= z_escape($name) ?>" decoding="async">
</div>
<div class="thumbs">
<?php foreach ($images as $image): if (empty($image['url'])) continue; $imageUrl=(string)$image['url']; $imageAlt=(string)($image['alt'] ?? $name); ?>
<button class="thumb" type="button" data-src="<?= z_escape($imageUrl) ?>" aria-label="View <?= z_escape($imageAlt) ?>"><img src="<?= z_escape($imageUrl) ?>" alt="<?= z_escape($imageAlt) ?>" loading="lazy" decoding="async"></button>
<?php endforeach; ?>
</div>
</div>
<div class="product-copy">
<span class="eyebrow"><?= $brand !== '' ? z_escape($brand) . ' · ' : '' ?><?= z_escape($type) ?></span>
<h1><?= z_escape($name) ?></h1>
<div class="price">৳<?= number_format($price) ?><?php if ($comparePrice && $comparePrice > $price): ?> <del>৳<?= number_format($comparePrice) ?></del><?php endif; ?></div>
<p class="description"><?= z_escape($description) ?></p>
<p class="availability<?= $isSoldOut && !$isPreorder ? ' sold' : '' ?>"><?= z_escape($availabilityText) ?></p>
<div class="specs">
<?php foreach ($specs as $label => $value): ?><div><span><?= z_escape($label) ?></span><strong><?= z_escape($value) ?></strong></div><?php endforeach; ?>
</div>
<?php if ($isSoldOut && !$isPreorder): ?>
<button class="order-btn disabled" type="button" disabled>Currently unavailable</button>
<?php else: ?>
<button class="order-btn z-add-cart" type="button" data-product-id="<?= z_escape($sku) ?>" data-product-name="<?= z_escape($name) ?>" data-product-price="<?= $price ?>" data-product-image="<?= z_escape($primaryImage) ?>">ADD TO BAG</button>
<button class="order-btn z-buy-now z-product-buy-now" type="button">BUY NOW</button>
<?php endif; ?>
<a class="order-btn z-wa-enquire" style="background:transparent;color:var(--ink);border:1px solid var(--line);margin-top:10px" href="https://wa.me/8801642779056?text=<?= rawurlencode('Hello ZARIAH Studio, I would like to enquire about ' . $name . '.') ?>">Enquire on WhatsApp</a>
<p class="note">For more product details, colour availability or ordering assistance, contact our team.</p>
<a class="back-link" href="/collections/all-bags/">← Browse All Bags</a>
</div>
</section>
<section class="more"><div class="eyebrow">Continue exploring</div><h2>Discover More Bags</h2><a href="/collections/all-bags/">View All Bags →</a></section>
</main>
<footer>© ZARIAH Studio · Curated in Bangladesh · Delivered Nationwide<div style="margin-top:10px"><a href="/pages/privacy-policy/">Privacy Policy</a> &nbsp;·&nbsp; <a href="/pages/terms-of-service/">Terms of Service</a></div></footer>
<script src="/assets/js/product-related-cards.js?v=20261109-stablecta" defer></script>
<script src="/zariah-cart.js" defer></script>
<script src="/assets/js/zariah-product-gallery.js" defer></script>
<script src="/assets/js/zariah-product-add-to-bag.js?v=20261113-dynamic-buynow" defer></script>
<style>.z-cart-nav{white-space:nowrap}.z-cart-count{display:inline-grid;place-items:center;min-width:18px;height:18px;border-radius:50%;background:#c5a06a;color:#fff;font-size:10px;margin-left:4px;padding:0 4px}.z-add-cart{width:100%;border:0;cursor:pointer;font:inherit;letter-spacing:.15em}.z-floating-bag{position:fixed!important;right:18px!important;bottom:20px!important;z-index:99999!important;display:flex!important;align-items:center!important;gap:9px!important;padding:13px 17px!important;background:#292522!important;color:#fff!important;border:1px solid #c5a06a!important;box-shadow:0 5px 22px #0002!important;text-decoration:none!important;font:500 9px/1 Inter,Arial,sans-serif!important;letter-spacing:.14em!important}.z-floating-bag-count{display:inline-grid!important;place-items:center!important;min-width:19px!important;height:19px!important;padding:0 5px!important;border-radius:50%!important;background:#c5a06a!important;color:#fff!important;font-size:9px!important;letter-spacing:0!important}@media(max-width:600px){.z-floating-bag{right:12px!important;bottom:14px!important;padding:12px 14px!important}}</style>
<a class="z-floating-bag" href="/pages/cart/" aria-label="Open shopping bag"><span aria-hidden="true">♧</span><span>YOUR BAG</span><span class="z-floating-bag-count" data-cart-count>0</span></a>
<script src="/assets/js/mini-bag-drawer.js?v=20261109" defer></script>
</body>
</html>
