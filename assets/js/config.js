
function getConfig(){
  return safeGet('nonaBeautyConfig') || {
    adminEmails: ['abdelrhman.hegazy4@gmail.com'],
    socials: { facebook:'', instagram:'', tiktok:'', whatsapp:'01094004720' },
    emailjs: { serviceId:'', templateId:'', userId:'' }
  };
}
function saveConfig(cfg){ sanitizeAndSet('nonaBeautyConfig', cfg); }
function addAdminEmail(email){ const cfg = getConfig(); if(!cfg.adminEmails.includes(email)) cfg.adminEmails.push(email); saveConfig(cfg); }
function removeAdminEmail(email){ const cfg = getConfig(); cfg.adminEmails = cfg.adminEmails.filter(e=>e!==email); saveConfig(cfg); }
function updateSocial(key,val){ const cfg=getConfig(); cfg.socials[key]=val; saveConfig(cfg); }
function updateEmailjs(creds){ const cfg=getConfig(); cfg.emailjs = Object.assign(cfg.emailjs, creds); saveConfig(cfg); }
