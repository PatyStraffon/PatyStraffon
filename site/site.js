// Shared behaviour for the inner pages: mobile menu and Netlify form posts.
(function(){
  var b=document.querySelector('.burger'),m=document.getElementById('mnav');
  if(b&&m){
    var set=function(o){m.hidden=!o;b.setAttribute('aria-expanded',o)};
    b.addEventListener('click',function(){set(m.hidden)});
    m.addEventListener('click',function(e){if(e.target.closest('a'))set(false)});
  }
  document.querySelectorAll('a[href="#"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault()})});
  document.querySelectorAll('form[data-netlify]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(!f.checkValidity()){f.reportValidity();return}
      fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(f)).toString()}).catch(function(){});
      var ok=document.getElementById(f.dataset.ok);if(ok)ok.hidden=false;
      f.reset();
    });
  });
})();
