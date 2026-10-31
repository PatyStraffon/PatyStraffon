// Shared behaviour for every page: mobile menu and Netlify form posts.
(function(){
  var b=document.querySelector('.burger'),m=document.getElementById('mnav');
  if(b&&m){
    var t=b.querySelector('.btxt');
    var set=function(o){m.hidden=!o;b.setAttribute('aria-expanded',o);if(t)t.textContent=o?'Close':'Menu'};
    b.addEventListener('click',function(){set(m.hidden)});
    m.addEventListener('click',function(e){if(e.target.closest('a'))set(false)});
    // Close with the Escape key, a tap outside the menu, or when the screen gets wide.
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.hidden){set(false);b.focus()}});
    document.addEventListener('click',function(e){if(!m.hidden&&!e.target.closest('header'))set(false)});
    window.addEventListener('resize',function(){if(!m.hidden&&getComputedStyle(b).display==='none')set(false)});
  }
  document.querySelectorAll('a[href="#"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault()})});
  document.querySelectorAll('form[data-netlify]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(!f.checkValidity()){f.reportValidity();return}
      var ok=document.getElementById(f.dataset.ok);
      fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(f)).toString()})
        .then(function(r){if(!r.ok)throw r;if(ok){ok.hidden=false;ok.classList.remove('err')}f.reset()})
        .catch(function(){if(ok){ok.hidden=false;ok.classList.add('err');ok.textContent='Sorry, that didn\'t go through. Please try again, or email paty@patystraffon.com.'}});
    });
  });
})();
