
/* Translations file */
const TRANSLATIONS = {
  "home": {"en":"Home","ar":"الرئيسية"},
  "products": {"en":"Products","ar":"المنتجات"},
  "offers": {"en":"Offers","ar":"العروض"},
  "contact": {"en":"Contact","ar":"اتصل بنا"},
  "cart": {"en":"Cart","ar":"السلة"},
  "checkout": {"en":"Checkout","ar":"الدفع"},
  "admin_panel": {"en":"Admin Panel","ar":"لوحة التحكم"},
  "login": {"en":"Login","ar":"تسجيل الدخول"},
  "logout": {"en":"Logout","ar":"تسجيل الخروج"},
  "search_placeholder": {"en":"Search products...","ar":"ابحث عن المنتجات..."}
};
function applyTranslations(lang){
  if(!lang) lang = localStorage.getItem('nonaBeautyLang') || 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const entry = TRANSLATIONS[key];
    if(entry) el.textContent = (entry[lang] || entry['en'] || key);
  });
  document.documentElement.dir = (lang==='ar') ? 'rtl' : 'ltr';
  localStorage.setItem('nonaBeautyLang', lang);
}
function toggleLang(){ const cur = localStorage.getItem('nonaBeautyLang') || 'en'; applyTranslations(cur==='en' ? 'ar' : 'en'); }
