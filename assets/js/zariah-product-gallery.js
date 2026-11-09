/* ZARIAH Studio product gallery + image-only zoom viewer.
   Scroll locking is limited to the open image viewer. */
(()=>{
 const main=document.getElementById('mainProductImage');
 const gallery=document.querySelector('.gallery');
 if(!main||!gallery)return;
 const thumbs=[...document.querySelectorAll('.thumb')];
 const sources=thumbs.map(b=>b.dataset.src).filter(Boolean);
 let active=Math.max(0,sources.indexOf(main.getAttribute('src')));
 const setImage=(index)=>{
   if(!sources.length)return;
   active=(index+sources.length)%sources.length;
   main.src=sources[active];
   thumbs.forEach((b,i)=>{b.classList.toggle('is-active',i===active);b.setAttribute('aria-pressed',i===active?'true':'false')});
 };
 thumbs.forEach((b,i)=>b.addEventListener('click',()=>setImage(i)));
 setImage(active);

 const overlay=document.createElement('div');
 overlay.className='pd-zoom';
 overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label','Product image viewer');
 overlay.innerHTML='<div class="pd-zoom-bar"><span class="pd-zoom-label">ZARIAH STUDIO · IMAGE VIEW</span><div class="pd-zoom-actions"><button type="button" class="pd-zoom-prev" aria-label="Previous image">‹</button><button type="button" class="pd-zoom-minus" aria-label="Zoom out">−</button><button type="button" class="pd-zoom-plus" aria-label="Zoom in">+</button><button type="button" class="pd-zoom-close" aria-label="Close image viewer">×</button><button type="button" class="pd-zoom-next" aria-label="Next image">›</button></div></div><div class="pd-zoom-stage"><img class="pd-zoom-image" alt=""></div><div class="pd-zoom-hint">PINCH OR DOUBLE-TAP TO ZOOM · DRAG TO MOVE</div>';
 document.body.appendChild(overlay);
 const stage=overlay.querySelector('.pd-zoom-stage');
 const zoomImg=overlay.querySelector('.pd-zoom-image');
 let scale=1,x=0,y=0,startX=0,startY=0,pointers=new Map(),pinchStart=0,pinchScale=1,savedY=0,wasOpen=false;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const paint=()=>{zoomImg.style.transform='translate3d('+x+'px,'+y+'px,0) scale('+scale+')'};
 const reset=()=>{scale=1;x=0;y=0;paint()};
 const setScale=(s)=>{scale=clamp(s,1,3);if(scale===1){x=0;y=0}paint()};
 const show=(index=active)=>{
   setImage(index);zoomImg.src=main.src;zoomImg.alt=main.alt||'Product image';reset();
   savedY=window.scrollY;document.body.classList.add('pd-zoom-lock');
   document.body.style.position='fixed';document.body.style.top='-'+savedY+'px';document.body.style.width='100%';
   overlay.classList.add('is-open');wasOpen=true;overlay.querySelector('.pd-zoom-close').focus();
 };
 const close=()=>{
   if(!wasOpen)return;
   overlay.classList.remove('is-open');document.body.classList.remove('pd-zoom-lock');
   document.body.style.position='';document.body.style.top='';document.body.style.width='';
   window.scrollTo(0,savedY);wasOpen=false;pointers.clear();main.focus?.();
 };
 const change=(i)=>{setImage(i);zoomImg.src=main.src;zoomImg.alt=main.alt||'Product image';reset()};
 main.tabIndex=0;main.setAttribute('role','button');main.setAttribute('aria-label','Open image zoom viewer');
 main.addEventListener('click',()=>show(active));
 main.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(active)}});
 overlay.querySelector('.pd-zoom-close').addEventListener('click',close);
 overlay.querySelector('.pd-zoom-prev').addEventListener('click',()=>change(active-1));
 overlay.querySelector('.pd-zoom-next').addEventListener('click',()=>change(active+1));
 overlay.querySelector('.pd-zoom-plus').addEventListener('click',()=>setScale(scale+.5));
 overlay.querySelector('.pd-zoom-minus').addEventListener('click',()=>setScale(scale-.5));
 overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 document.addEventListener('keydown',e=>{
   if(!wasOpen)return;
   if(e.key==='Escape'){e.preventDefault();close()}
   if(e.key==='ArrowRight')change(active+1);
   if(e.key==='ArrowLeft')change(active-1);
   if(e.key==='+')setScale(scale+.5);
   if(e.key==='-')setScale(scale-.5);
 });
 zoomImg.addEventListener('dblclick',e=>{e.preventDefault();setScale(scale===1?2:1)});
 stage.addEventListener('wheel',e=>{e.preventDefault();setScale(scale+(e.deltaY<0?.2:-.2))},{passive:false});
 stage.addEventListener('pointerdown',e=>{
   stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size===1){startX=e.clientX-x;startY=e.clientY-y}
   if(pointers.size===2){const p=[...pointers.values()];pinchStart=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);pinchScale=scale}
 });
 stage.addEventListener('pointermove',e=>{
   if(!pointers.has(e.pointerId))return;
   pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(pointers.size===2){const p=[...pointers.values()];const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinchStart)setScale(pinchScale*d/pinchStart)}
   else if(scale>1){x=e.clientX-startX;y=e.clientY-startY;paint()}
 });
 const endPointer=e=>{pointers.delete(e.pointerId);if(pointers.size<2)pinchStart=0};
 stage.addEventListener('pointerup',endPointer);stage.addEventListener('pointercancel',endPointer);
 let touchStartX=0;
 stage.addEventListener('touchstart',e=>{if(e.touches.length===1)touchStartX=e.touches[0].clientX},{passive:true});
 stage.addEventListener('touchend',e=>{
   if(scale!==1||e.changedTouches.length!==1)return;
   const dx=e.changedTouches[0].clientX-touchStartX;
   if(Math.abs(dx)>65)change(active+(dx<0?1:-1));
 },{passive:true});
})();
