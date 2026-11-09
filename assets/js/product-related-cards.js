/* ZARIAH Studio — curated related handbag cards on product detail pages */
(()=>{
 const layout=document.querySelector('.product-layout');
 const more=document.querySelector('.more');
 if(!layout||!more)return;
 const match=location.pathname.match(/\/products\/(essence|signature|noir)(\d{2})\/?/i);
 if(!match)return;
 const collection=match[1].toLowerCase(),current=Number(match[2]);
 const catalog={
 essence:[
  ["Crescent Shoulder Bag","3800","essence01"],["Slim Flap Crossbody","2900","essence02"],["Structured Mini Tote","3400","essence03"],["East-West Bag","3200","essence04"],["Rounded Top Handle","3600","essence05"],["Soft Bucket Bag","3500","essence06"]],
 signature:[
  ["Structured Top Handle","4500","signature01"],["Elegant Satchel","4800","signature02"],["Premium Flap Bag","3900","signature03"],["Boxy Shoulder Bag","4200","signature04"],["Structured Crossbody","3600","signature05"],["Top-Zip Bowling Bag","4600","signature06"]],
 noir:[
  ["Statement Shoulder Bag","4000","noir01"],["Sculptural Top Handle","3800","noir02"],["Chain Accent Flap Bag","3500","noir03"],["Sharp East-West Bag","3600","noir04"],["Structured Underarm Bag","3200","noir05"],["Mini Statement Tote","3400","noir06"]]
 };
 const items=catalog[collection]||[];
 const related=items.filter(item=>Number(item[2].slice(-2))!==current);
 const start=Math.max(0,current-1);
 const ordered=related.slice(start,start+4).concat(related.slice(0,start)).slice(0,4);
 const section=document.createElement('section');
 section.className='pd-related';
 section.setAttribute('aria-label','You may also like');
 section.innerHTML='<div class="pd-related-head"><span class="pd-related-kicker">CURATED FOR YOU</span><h2>Pairs Beautifully With</h2><p>Explore more thoughtfully selected silhouettes from the collection.</p></div><div class="pd-related-grid">'+ordered.map(item=>'<article class="pd-related-card"><a class="pd-related-image" href="/products/'+item[2]+'/"><img src="/images/products/'+item[2]+'/front.webp" alt="'+item[0]+'" loading="lazy" decoding="async"></a><div class="pd-related-meta"><h3>'+item[0]+'</h3><strong>৳'+Number(item[1]).toLocaleString('en-IN')+'</strong></div><a class="pd-related-link" href="/products/'+item[2]+'/">VIEW DETAILS <span>→</span></a></article>').join('')+'</div>';
 layout.insertAdjacentElement('afterend',section);
 more.innerHTML='<div class="pd-discover-rule"></div><span class="pd-discover-kicker">THE ZARIAH EDIT</span><h2>Discover More</h2><p>Find the silhouette that feels unmistakably yours.</p><div class="pd-discover-actions"><a href="/collections/'+collection+'/">EXPLORE '+collection.toUpperCase()+'</a><a href="/collections/all-bags/">VIEW ALL BAGS</a></div>';
})();
