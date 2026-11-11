<?php
declare(strict_types=1);
const ZARIAH_SUPABASE_URL = 'https://keuqvqnhxlpsglsjfopd.supabase.co';
const ZARIAH_SUPABASE_KEY = 'sb_publishable_xOChFWtLlhLN_y8inW_nvQ__rX-zpno';

function z_sitemap_rpc() {
    $url = ZARIAH_SUPABASE_URL . '/rest/v1/rpc/get_product_seo_sitemap';
    $headers = "Content-Type: application/json\r\nAccept: application/json\r\napikey: " . ZARIAH_SUPABASE_KEY . "\r\nAuthorization: Bearer " . ZARIAH_SUPABASE_KEY;
    $context = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => $headers,
        'content' => '{}',
        'timeout' => 10,
        'ignore_errors' => true
    ]]);
    $response = @file_get_contents($url, false, $context);
    if ($response === false) return [];
    $rows = json_decode($response, true);
    return is_array($rows) ? $rows : [];
}

header('Content-Type: application/xml; charset=UTF-8');
header('Cache-Control: public, max-age=300, s-maxage=300');
$rows = z_sitemap_rpc();
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
echo '<url><loc>https://www.zariahstudio.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>' . "\n";
foreach ($rows as $row) {
    if (empty($row['slug'])) continue;
    $slug = rawurlencode((string)$row['slug']);
    $loc = 'https://www.zariahstudio.com/products/' . $slug . '/';
    $lastmod = !empty($row['updated_at']) ? date(DATE_W3C, strtotime((string)$row['updated_at'])) : '';
    echo '<url><loc>' . htmlspecialchars($loc, ENT_XML1 | ENT_QUOTES, 'UTF-8') . '</loc>';
    if ($lastmod !== '') echo '<lastmod>' . htmlspecialchars($lastmod, ENT_XML1 | ENT_QUOTES, 'UTF-8') . '</lastmod>';
    echo '<changefreq>weekly</changefreq><priority>0.8</priority></url>' . "\n";
}
echo '</urlset>';
