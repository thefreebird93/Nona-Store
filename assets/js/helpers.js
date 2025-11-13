
function safeGet(key){
  try{ var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }catch(e){return null;}
}
function sanitizeAndSet(key, obj){
  try{
    if(obj && typeof obj === 'object'){
      var copy = JSON.parse(JSON.stringify(obj));
      if(copy.password) delete copy.password;
      if(copy.token) delete copy.token;
      localStorage.setItem(key, JSON.stringify(copy));
    } else { localStorage.setItem(key, JSON.stringify(obj)); }
  }catch(e){}
}
function safeSetHTML(el, html){
  try{
    if(!el) return;
    var clean = String(html).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    if(typeof el === 'string'){ var resolved = document.querySelector(el); if(resolved) resolved.innerHTML = clean; return; }
    if(el && el.innerHTML !== undefined) el.innerHTML = clean;
  }catch(e){}
}
