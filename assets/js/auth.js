
// auth.js - simple client-side auth manager (admin / user)
// NOTE: This is client-side only. For production, replace with server-side auth.
(function(){
  'use strict';
  // helpers
  function safeGet(k){ try{ var v = localStorage.getItem(k); return v?JSON.parse(v):null;}catch(e){return null;} }
  function safeSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function plainSet(k,v){ try{ localStorage.setItem(k, v);}catch(e){} }
  function plainGet(k){ try{ return localStorage.getItem(k);}catch(e){return null;} }
  function uid(){ return 'id_'+Date.now()+'_'+Math.random().toString(36).slice(2,8); }

  var ADMIN_PW_KEY = 'nonaAdminPW'; // hashed simple pw for demo
  function hash(s){ var h=0; for(var i=0;i<s.length;i++){ h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; } return 'h'+Math.abs(h); }

  // ensure admin password exists
  if(!plainGet(ADMIN_PW_KEY)){ plainSet(ADMIN_PW_KEY, hash('admin123')); }

  // Expose auth API
  window.Auth = {
    login: function(type, email, password){
      type = (type||'user');
      email = (email||'').toString().trim();
      password = (password||'').toString();
      if(type==='admin'){
        // Admin check - for demo uses hashed password in localStorage
        if(hash(password) === plainGet(ADMIN_PW_KEY)){
          plainSet('userType', 'admin');
          plainSet('userEmail', email||'admin@nona.com');
          return { ok:true, type:'admin' };
        } else {
          return { ok:false, error:'Invalid admin password' };
        }
      } else {
        // Simple user login (accept any non-empty credentials)
        if(email && password){
          plainSet('userType', 'user');
          plainSet('userEmail', email);
          // ensure profile object exists
          var pkey = 'userProfile_'+email;
          if(!plainGet(pkey)){
            safeSet(pkey, { name:'', email: email, address:'', phone:'' });
          }
          return { ok:true, type:'user' };
        } else {
          return { ok:false, error:'Please provide email and password' };
        }
      }
    },
    logout: function(){
      plainSet('userType', '');
      plainSet('userEmail', '');
      // optionally clear other session keys
      return true;
    },
    getUser: function(){
      return { type: plainGet('userType')||null, email: plainGet('userEmail')||null };
    },
    changeAdminPassword: function(newPass){
      if(!newPass) return false;
      plainSet(ADMIN_PW_KEY, hash(newPass));
      return true;
    }
  };

  // auto-protect admin page if present
  try{
    if(location.pathname && /admin\.html$/i.test(location.pathname)){
      var u = window.Auth.getUser();
      if(u.type !== 'admin'){
        // redirect to login if not admin
        // allow if query param ?allow=1 (for safe dev) - but normally redirect
        if(!(location.search && /allow=1/.test(location.search))){
          alert('غير مصرح. الرجاء تسجيل الدخول كأدمن.');
          location.href = 'login.html';
        }
      }
    }
  }catch(e){ console.error(e); }

})(); // end auth.js
