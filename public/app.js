// Local consent controls load independently of filtering. No Google tag before opt-in.
Promise.all([import('./consent.js'), import('./tracking-catalog.js')])
 .then(([{ installConsent }, { catalog, pages }]) => installConsent({ window, document, catalog, pages })).catch(() => {});

function imageFallback(img) {
 if (img.dataset.fallback) return;
 img.dataset.fallback = 'shown';
 img.hidden = true;
 const note = document.createElement('p');
 note.className = 'image-fallback';
 note.textContent = 'Manufacturer image unavailable';
 img.after(note);
}
for (const img of document.querySelectorAll('img')) {
 img.addEventListener('error', () => imageFallback(img));
 if (img.complete && img.naturalWidth === 0) imageFallback(img);
}

const search=document.querySelector('#search');
if(search){
 let selected='All';
 const cards=[...document.querySelectorAll('.card')];
 const filters=[...document.querySelectorAll('[data-filter]')];
 function update(){let count=0;for(const card of cards){const show=(selected==='All'||card.dataset.category===selected)&&card.dataset.search.includes(search.value.trim().toLowerCase());card.hidden=!show;if(show)count++;}document.querySelector('#results').textContent=`${count} ${count===1?'watch':'watches'}`;document.querySelector('#empty').hidden=count!==0;}
 for(const button of filters)button.addEventListener('click',()=>{selected=button.dataset.filter;for(const b of filters){b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));}update();});
 search.addEventListener('input',update);
 document.querySelector('#reset').addEventListener('click',()=>{search.value='';filters[0].click();search.focus();});
}
