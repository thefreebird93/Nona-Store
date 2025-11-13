
/* admin-enhanced.js
   Provides:
   - Admin login/logout (simple password stored hashed in localStorage)
   - Admin CRUD (add/remove admins)
   - Products/Offers/Categories CRUD stored in localStorage
   - Image upload: stores images as base64 in localStorage with key 'nonaImages' and provides export/import
   - Export/Import data JSON for backup or server upload
   Note: Static frontend cannot write files to server filesystem at runtime. To persist images on a server, use a backend (e.g., Firebase Storage, Netlify Functions).
*/
(function(){
  'use strict';
  // helpers
  function safeGet(key){ try{ var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }catch(e){return null;} }
  function safeSet(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
  function uid(prefix){ return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,9); }
  // initialize config defaults
  var cfg = safeGet('nonaBeautyConfig') || { adminEmails: ['abdelrhman.hegazy4@gmail.com'], socials:{whatsapp:'01094004720'}, emailjs:{serviceId:'', templateId:'', userId:''} };
  safeSet('nonaBeautyConfig', cfg);

  // simple password based admin session (not secure for public sites)
  var ADMIN_PW_KEY = 'nonaAdminPW'; // hashed pw in localStorage (for demo)
  function hash(s){ // simple hash for demo (NOT cryptographically secure)
    var h=0; for(var i=0;i<s.length;i++){ h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; } return 'h'+Math.abs(h);
  }
  // ensure default admin password set (change on first use)
  if(!localStorage.getItem(ADMIN_PW_KEY)){
    localStorage.setItem(ADMIN_PW_KEY, hash('admin123')); // default, change it
  }

  // Data stores
  var PRODUCTS_KEY = 'nonaProducts';
  var OFFERS_KEY = 'nonaOffers';
  var CATS_KEY = 'nonaCategories';
  var IMAGES_KEY = 'nonaImages'; // store {id: base64}

  function getProducts(){ return safeGet(PRODUCTS_KEY) || []; }
  function saveProducts(v){ safeSet(PRODUCTS_KEY, v); }
  function getOffers(){ return safeGet(OFFERS_KEY) || []; }
  function saveOffers(v){ safeSet(OFFERS_KEY, v); }
  function getCats(){ return safeGet(CATS_KEY) || []; }
  function saveCats(v){ safeSet(CATS_KEY, v); }
  function getImages(){ return safeGet(IMAGES_KEY) || {}; }
  function saveImages(v){ safeSet(IMAGES_KEY, v); }

  // Admin UI binding
  document.addEventListener('DOMContentLoaded', function(){
    var adminArea = document.getElementById('adminArea');
    if(!adminArea) return;
    // create simple admin UI sections
    adminArea.innerHTML = `
      <div id="adminLoginBox" style="max-width:540px;margin:10px auto;padding:16px;border:1px solid #ddd;border-radius:8px;background:#fff;">
        <h2>Admin Login</h2>
        <div><label>Password: <input id="adminPw" type="password" /></label></div>
        <div style="margin-top:8px;"><button id="adminLoginBtn">Login</button></div>
        <div style="margin-top:8px;font-size:13px;color:#666">Default demo password: <code>admin123</code> — change it after login.</div>
      </div>
      <div id="adminPanel" style="display:none">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
          <button id="logoutBtn">Logout</button>
          <button id="exportBtn">Export Data</button>
          <button id="importBtn">Import Data</button>
          <input id="importFile" type="file" accept="application/json" style="display:none" />
        </div>
        <hr/>
        <div id="adminTabs" style="display:flex;gap:12px;">
          <button data-tab="products">Products</button>
          <button data-tab="offers">Offers</button>
          <button data-tab="cats">Categories</button>
          <button data-tab="images">Images</button>
          <button data-tab="admins">Admins</button>
        </div>
        <div id="tabContent" style="margin-top:12px;"></div>
      </div>
    `;

    // login logic
    document.getElementById('adminLoginBtn').addEventListener('click', function(){
      var v = document.getElementById('adminPw').value || '';
      if(hash(v) === localStorage.getItem(ADMIN_PW_KEY)){
        // success
        document.getElementById('adminLoginBox').style.display='none';
        document.getElementById('adminPanel').style.display='block';
        renderTab('products');
      } else {
        alert('Wrong password');
      }
    });
    document.getElementById('logoutBtn').addEventListener('click', function(){
      document.getElementById('adminPanel').style.display='none';
      document.getElementById('adminLoginBox').style.display='block';
    });

    // export/import
    document.getElementById('exportBtn').addEventListener('click', function(){
      var data = {
        config: cfg,
        products: getProducts(),
        offers: getOffers(),
        categories: getCats(),
        images: getImages()
      };
      var a = document.createElement('a');
      var blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
      a.href = URL.createObjectURL(blob);
      a.download = 'nona-data-'+Date.now()+'.json';
      a.click();
    });
    document.getElementById('importBtn').addEventListener('click', function(){
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', function(e){
      var f = e.target.files[0];
      if(!f) return;
      var r = new FileReader();
      r.onload = function(ev){
        try{
          var obj = JSON.parse(ev.target.result);
          if(obj.products) saveProducts(obj.products);
          if(obj.offers) saveOffers(obj.offers);
          if(obj.categories) saveCats(obj.categories);
          if(obj.images) saveImages(obj.images);
          alert('Imported');
        }catch(err){ alert('Import failed: '+err.message); }
      };
      r.readAsText(f);
    });

    // tab switching and renderers
    document.getElementById('adminTabs').addEventListener('click', function(e){
      var btn = e.target.closest('button');
      if(!btn) return;
      var t = btn.getAttribute('data-tab');
      renderTab(t);
    });

    function renderTab(tab){
      var cont = document.getElementById('tabContent');
      if(tab === 'products'){
        renderProducts(cont);
      } else if(tab === 'offers'){
        renderOffers(cont);
      } else if(tab === 'cats'){
        renderCategories(cont);
      } else if(tab === 'images'){
        renderImages(cont);
      } else if(tab === 'admins'){
        renderAdmins(cont);
      }
    }

    // PRODUCTS
    function renderProducts(container){
      var list = getProducts();
      container.innerHTML = `
        <h3>Products <button id="addProductBtn">Add Product</button></h3>
        <div id="productsList"></div>
        <div id="productFormHolder"></div>
      `;
      function showList(){
        var out = '<table style="width:100%;border-collapse:collapse;">' + 
          '<tr><th>ID</th><th>Title</th><th>Price</th><th>Category</th><th>Actions</th></tr>';
        list.forEach(p=>{
          out += `<tr style="border-top:1px solid #eee"><td>${p.id}</td><td>${p.title}</td><td>${p.price}</td><td>${p.category||''}</td>
            <td><button data-id="${p.id}" class="editProduct">Edit</button> <button data-id="${p.id}" class="delProduct">Delete</button></td></tr>`;
        });
        out += '</table>';
        document.getElementById('productsList').innerHTML = out;
        // attach events
        document.querySelectorAll('.editProduct').forEach(b=>b.addEventListener('click', function(){ openProduct(b.dataset.id); }));
        document.querySelectorAll('.delProduct').forEach(b=>b.addEventListener('click', function(){ if(confirm('Delete?')){ list = list.filter(x=>x.id!==b.dataset.id); saveProducts(list); renderProducts(container); } }));
      }
      function openProduct(id){
        var prod = list.find(x=>x.id===id) || { id: uid('prod'), title:'', description:'', price:0, category:'', images:[] };
        buildForm(prod);
      }
      function buildForm(prod){
        var holder = document.getElementById('productFormHolder');
        holder.innerHTML = `
          <h4>${prod.id?'Edit Product':'New Product'}</h4>
          <div><label>Title: <input id="p_title" value="${(prod.title||'').replace(/"/g,'&quot;')}" /></label></div>
          <div><label>Price: <input id="p_price" value="${prod.price||0}" /></label></div>
          <div><label>Category: <input id="p_cat" value="${prod.category||''}" /></label></div>
          <div><label>Description:<br/><textarea id="p_desc">${(prod.description||'')}</textarea></label></div>
          <div><label>Upload Image: <input id="p_image" type="file" accept="image/*" /></label></div>
          <div style="margin-top:8px;"><button id="saveProdBtn">Save</button> <button id="cancelProdBtn">Cancel</button></div>
        `;
        document.getElementById('p_image').addEventListener('change', function(e){
          var f = e.target.files[0]; if(!f) return;
          var r = new FileReader();
          r.onload = function(ev){ 
            var images = getImages(); 
            var imgId = uid('img');
            images[imgId] = ev.target.result;
            saveImages(images);
            prod.images = prod.images || [];
            prod.images.push(imgId);
            alert('Image uploaded and attached');
          };
          r.readAsDataURL(f);
        });
        document.getElementById('saveProdBtn').addEventListener('click', function(){
          prod.title = document.getElementById('p_title').value;
          prod.price = document.getElementById('p_price').value;
          prod.category = document.getElementById('p_cat').value;
          prod.description = document.getElementById('p_desc').value;
          var idx = list.findIndex(x=>x.id===prod.id);
          if(idx>=0) list[idx] = prod; else list.push(prod);
          saveProducts(list);
          alert('Product saved');
          renderProducts(container);
        });
        document.getElementById('cancelProdBtn').addEventListener('click', function(){ renderProducts(container); });
      }
      document.getElementById('addProductBtn').addEventListener('click', function(){ openProduct(null); });
      showList();
    }

    // OFFERS
    function renderOffers(container){
      var list = getOffers();
      container.innerHTML = `
        <h3>Offers <button id="addOfferBtn">Add Offer</button></h3>
        <div id="offersList"></div>
        <div id="offerFormHolder"></div>
      `;
      function showList(){
        var out = '<table style="width:100%;border-collapse:collapse;"><tr><th>ID</th><th>Title</th><th>Actions</th></tr>';
        list.forEach(p=> out += `<tr style="border-top:1px solid #eee"><td>${p.id}</td><td>${p.title}</td><td><button data-id="${p.id}" class="editOffer">Edit</button> <button data-id="${p.id}" class="delOffer">Delete</button></td></tr>`);
        out += '</table>';
        document.getElementById('offersList').innerHTML = out;
        document.querySelectorAll('.editOffer').forEach(b=>b.addEventListener('click', function(){ openOffer(b.dataset.id); }));
        document.querySelectorAll('.delOffer').forEach(b=>b.addEventListener('click', function(){ if(confirm('Delete?')){ list = list.filter(x=>x.id!==b.dataset.id); saveOffers(list); renderOffers(container);} }));
      }
      function openOffer(id){
        var item = list.find(x=>x.id===id) || { id: uid('off'), title:'', description:'', discount:0, image:null };
        buildForm(item);
      }
      function buildForm(item){
        var holder = document.getElementById('offerFormHolder');
        holder.innerHTML = `
          <h4>${item.id?'Edit Offer':'New Offer'}</h4>
          <div><label>Title: <input id="o_title" value="${(item.title||'').replace(/"/g,'&quot;')}" /></label></div>
          <div><label>Discount (%): <input id="o_disc" value="${item.discount||0}" /></label></div>
          <div><label>Description:<br/><textarea id="o_desc">${(item.description||'')}</textarea></label></div>
          <div><label>Image: <input id="o_image" type="file" accept="image/*" /></label></div>
          <div style="margin-top:8px;"><button id="saveOfferBtn">Save</button> <button id="cancelOfferBtn">Cancel</button></div>
        `;
        document.getElementById('o_image').addEventListener('change', function(e){
          var f = e.target.files[0]; if(!f) return;
          var r = new FileReader();
          r.onload = function(ev){ var images = getImages(); var imgId = uid('img'); images[imgId] = ev.target.result; saveImages(images); item.image = imgId; alert('Image uploaded'); };
          r.readAsDataURL(f);
        });
        document.getElementById('saveOfferBtn').addEventListener('click', function(){
          item.title = document.getElementById('o_title').value;
          item.discount = document.getElementById('o_disc').value;
          item.description = document.getElementById('o_desc').value;
          var idx = list.findIndex(x=>x.id===item.id);
          if(idx>=0) list[idx]=item; else list.push(item);
          saveOffers(list); alert('Saved'); renderOffers(container);
        });
        document.getElementById('cancelOfferBtn').addEventListener('click', function(){ renderOffers(container); });
      }
      document.getElementById('addOfferBtn').addEventListener('click', function(){ openOffer(null); });
      showList();
    }

    // CATEGORIES
    function renderCategories(container){
      var list = getCats();
      container.innerHTML = `
        <h3>Categories <button id="addCatBtn">Add Category</button></h3>
        <div id="catsList"></div>
        <div id="catFormHolder"></div>
      `;
      function showList(){
        var out = '<table style="width:100%;border-collapse:collapse;"><tr><th>ID</th><th>Title</th><th>Actions</th></tr>';
        list.forEach(p=> out += `<tr style="border-top:1px solid #eee"><td>${p.id}</td><td>${p.title}</td><td><button data-id="${p.id}" class="editCat">Edit</button> <button data-id="${p.id}" class="delCat">Delete</button></td></tr>`);
        out += '</table>';
        document.getElementById('catsList').innerHTML = out;
        document.querySelectorAll('.editCat').forEach(b=>b.addEventListener('click', function(){ openCat(b.dataset.id); }));
        document.querySelectorAll('.delCat').forEach(b=>b.addEventListener('click', function(){ if(confirm('Delete?')){ list = list.filter(x=>x.id!==b.dataset.id); saveCats(list); renderCategories(container);} }));
      }
      function openCat(id){
        var it = list.find(x=>x.id===id) || { id: uid('cat'), title:'' };
        var holder = document.getElementById('catFormHolder');
        holder.innerHTML = `<div><label>Title: <input id="c_title" value="${(it.title||'').replace(/"/g,'&quot;')}" /></label></div><div style="margin-top:8px;"><button id="saveCatBtn">Save</button> <button id="cancelCatBtn">Cancel</button></div>`;
        document.getElementById('saveCatBtn').addEventListener('click', function(){ it.title = document.getElementById('c_title').value; var idx = list.findIndex(x=>x.id===it.id); if(idx>=0) list[idx]=it; else list.push(it); saveCats(list); renderCategories(container); });
        document.getElementById('cancelCatBtn').addEventListener('click', function(){ renderCategories(container); });
      }
      document.getElementById('addCatBtn').addEventListener('click', function(){ openCat(null); });
      showList();
    }

    // IMAGES
    function renderImages(container){
      var images = getImages();
      container.innerHTML = `<h3>Images</h3><div id="imagesList"></div><div style="margin-top:8px;"><button id="clearImagesBtn">Clear all images</button></div>`;
      function show(){
        var out = '<div style="display:flex;flex-wrap:wrap;gap:12px;">';
        Object.keys(images).forEach(k=>{
          out += `<div style="width:140px;text-align:center;border:1px solid #eee;padding:8px;border-radius:6px;"><img src="${images[k]}" style="width:100%;height:100px;object-fit:cover"/><div style="font-size:12px;word-break:break-all">${k}</div><div><button data-id="${k}" class="delImg">Delete</button></div></div>`;
        });
        out += '</div>';
        document.getElementById('imagesList').innerHTML = out;
        document.querySelectorAll('.delImg').forEach(b=>b.addEventListener('click', function(){ if(confirm('Delete image?')){ delete images[b.dataset.id]; saveImages(images); renderImages(container); } }));
      }
      document.getElementById('clearImagesBtn').addEventListener('click', function(){ if(confirm('Clear all images?')){ saveImages({}); renderImages(container); } });
      show();
    }

    // ADMINS - manage emails and change password
    function renderAdmins(container){
      var adminEmails = cfg.adminEmails || [];
      container.innerHTML = `
        <h3>Admins</h3>
        <div id="adminEmailsList"></div>
        <div style="margin-top:8px;"><input id="newAdminEmail" placeholder="email"/><button id="addAdminEmail">Add</button></div>
        <hr/>
        <div><h4>Change Admin Password</h4><div><input id="newPw" placeholder="new password"/></div><div style="margin-top:6px;"><button id="changePwBtn">Change</button></div></div>
      `;
      function showEmails(){
        var out = '<ul>';
        (cfg.adminEmails||[]).forEach(e=> out += `<li>${e} <button data-email="${e}" class="delAdminEmail">Delete</button></li>`);
        out += '</ul>';
        document.getElementById('adminEmailsList').innerHTML = out;
        document.querySelectorAll('.delAdminEmail').forEach(b=>b.addEventListener('click', function(){ var e=b.dataset.email; cfg.adminEmails = (cfg.adminEmails||[]).filter(x=>x!==e); safeSet('nonaBeautyConfig', cfg); renderAdmins(container); }));
      }
      document.getElementById('addAdminEmail').addEventListener('click', function(){ var v=document.getElementById('newAdminEmail').value; if(v){ cfg.adminEmails=cfg.adminEmails||[]; cfg.adminEmails.push(v); safeSet('nonaBeautyConfig', cfg); alert('Added'); renderAdmins(container); } });
      document.getElementById('changePwBtn').addEventListener('click', function(){ var v=document.getElementById('newPw').value; if(!v){ alert('Enter new password'); return; } localStorage.setItem(ADMIN_PW_KEY, hash(v)); alert('Password changed'); });
      showEmails();
    }

  }); // DOMContentLoaded end
})(); 
