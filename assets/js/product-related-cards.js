/* ZARIAH Studio — exactly four curated related bags + restrained discovery CTA */
(()=>{
 const layout=document.querySelector('.product-layout');
 const more=document.querySelector('.more');
 if(!layout||!more)return;
 const match=location.pathname.match(/\/products\/(essence|signature|noir)(\d{2})\/?/i);
 if(!match)return;
 const collection=match[1].toLowerCase(),current=Number(match[2]);
 const catalog={
 essence:[["Crescent Shoulder Bag","3800","essence01"],["Slim Flap Crossbody","2900","essence02"],["Structured Mini Tote","3400","essence03"],["East-West Bag","3200","essence04"],["Rounded Top Handle","3600","essence05"],["Soft Bucket Bag","3500","essence06"]],
 signature:[["Structured Top Handle","4500","signature01"],["Elegant Satchel","4800","signature02"],["Premium Flap Bag","3900","signature03"],["Boxy Shoulder Bag","4200","signature04"],["Structured Crossbody","3600","signature05"],["Top-Zip Bowling Bag","4600","signature06"]],
 noir:[["Statement Shoulder Bag","4000","noir01"],["Sculptural Top Handle","3800","noir02"],["Chain Accent Flap Bag","3500","noir03"],["Sharp East-West Bag","3600","noir04"],["Structured Underarm Bag","3200","noir05"],["Mini Statement Tote","3400","noir06"]]
 };
 const items=(catalog[collection]||[]).filter(item=>Number(item[2].slice(-2))!==current);
 if(!items.length)return;
 const start=Math.max(0,current-1)%items.length;
 const ordered=items.slice(start).concat(items.slice(0,start)).slice(0,4);
 const section=document.createElement('section');section.className='pd-related';section.setAttribute('aria-label','Pairs beautifully with');
 const heading=document.createElement('h2');heading.textContent='Pairs Beautifully With';
 const grid=document.createElement('div');grid.className='pd-related-grid';
 ordered.forEach(([name,price,id])=>{
  const card=document.createElement('article');card.className='pd-related-card';
  const imageLink=document.createElement('a');imageLink.className='pd-related-image';imageLink.href='/products/'+id+'/';
  const img=document.createElement('img');img.src='/images/products/'+id+'/front.webp';img.alt=name;img.loading='lazy';img.decoding='async';imageLink.appendChild(img);
  const meta=document.createElement('div');meta.className='pd-related-meta';
  const title=document.createElement('h3');title.textContent=name;
  const amount=document.createElement('strong');amount.textContent='৳'+Number(price).toLocaleString('en-IN');meta.append(title,amount);
  const link=document.createElement('a');link.className='pd-related-link';link.href='/products/'+id+'/';link.textContent='VIEW DETAILS →';
  card.append(imageLink,meta,link);grid.appendChild(card);
 });
 section.append(heading,grid);layout.insertAdjacentElement('afterend',section);
 more.className='more pd-discover-more';
 more.innerHTML='<span class="pd-discover-kicker">THE ZARIAH EDIT</span><h2 class="pd-discover-title">Find Your Next Favourite</h2><a class="pd-discover-cta" href="/collections/all-bags/">EXPLORE ALL BAGS <span aria-hidden="true">→</span></a>';
})();