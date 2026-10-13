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
