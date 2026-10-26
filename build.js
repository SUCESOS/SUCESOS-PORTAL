const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const root = process.cwd();
const out = path.join(root, 'dist');
const origin = 'https://sucesos-portal.pages.dev';
const escapeHtml = (v = '') => String(v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const clean = (v = '') => String(v).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const slug = v => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const absolute = p => !p ? '' : /^https?:\/\//i.test(p) ? p : origin + (p.startsWith('/') ? p : '/' + p);
const formatDate = v => { const d = new Date(v); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',year:'numeric',timeZone:'America/Mexico_City'}).format(d); };
function copy(src, dest) { if (!fs.existsSync(src)) return; fs.cpSync(src, dest, {recursive:true, force:true}); }
function save(file, content) { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, content, 'utf8'); }
function shell({title, description='', image='', canonical=origin+'/', type='website', content=''}) {
  const ogImage = image ? `<meta property="og:image" content="${escapeHtml(absolute(image))}"><meta name="twitter:card" content="summary_large_image">` : '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#b90917"><title>${escapeHtml(title)} | SUCESOS</title><meta name="description" content="${escapeHtml(clean(description).slice(0,220))}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="${type}"><meta property="og:site_name" content="SUCESOS Prensa Digital"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(clean(description).slice(0,220))}"><meta property="og:url" content="${escapeHtml(canonical)}">${ogImage}<style>*{box-sizing:border-box}body{margin:0;background:#f5f5f5;color:#171717;font-family:Arial,Helvetica,sans-serif}a{color:inherit;text-decoration:none}header{background:#111;color:#fff;padding:24px 20px}.wrap{max-width:1100px;margin:auto}.brand{font-size:clamp(40px,6vw,64px);font-weight:900;letter-spacing:-3px;text-shadow:0 -3px #c20c1b}.brand small{display:block;font-size:10px;letter-spacing:4px;text-shadow:none;font-weight:500;border-top:3px solid #c20c1b;padding-top:8px;width:max-content}nav{background:#bd0b1a;color:#fff;padding:13px 20px;font-weight:bold}main{max-width:1100px;margin:32px auto 70px;padding:0 20px}h1{line-height:1.15}img{display:block;max-width:100%}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}.card{background:#fff;box-shadow:0 2px 15px #0000000d;overflow:hidden}.card img{width:100%;aspect-ratio:16/10;object-fit:cover}.card-body{padding:20px}.badge{display:inline-block;background:#bc0b19;color:white;font-size:12px;font-weight:bold;padding:7px 10px}.card h2{font-size:22px;line-height:1.25}.card p{line-height:1.5;color:#555}.meta{color:#777;font-size:13px;margin:12px 0}.story{max-width:820px;margin:auto;background:white;padding:clamp(20px,4vw,45px);box-shadow:0 2px 15px #0000000d}.story h1{font-size:clamp(29px,5vw,49px)}.story .intro{font-size:20px;line-height:1.5;font-weight:600}.story figure{margin:24px 0}.story figure img{width:100%;height:auto}.story-body p,.story-body li{font-size:18px;line-height:1.85}.story-body a{color:#b50919;text-decoration:underline}.back{display:inline-block;margin-top:25px;color:#b50919;font-weight:bold}footer{background:#111;color:#bbb;padding:28px 20px;font-size:13px}@media(max-width:800px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:540px){.grid{grid-template-columns:1fr}}</style></head><body><header><div class="wrap"><a href="/" class="brand">sucesos<small>PRENSA DIGITAL</small></a></div></header><nav><div class="wrap"><a href="/">INICIO</a> &nbsp; / &nbsp; GUERRERO · MÉXICO</div></nav>${content}<footer><div class="wrap">SUCESOS · Prensa Digital · La información que importa</div></footer></body></html>`;
}
fs.rmSync(out, {recursive:true,force:true}); fs.mkdirSync(out,{recursive:true});
for (const name of ['admin','imagenes','politica','robots.txt','favicon.ico']) copy(path.join(root,name),path.join(out,name));
const dir = path.join(root,'noticias');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f=>/\.md$/i.test(f)) : [];
const articles = files.map(file => {
  const {data,content} = matter(fs.readFileSync(path.join(dir,file),'utf8'));
  const title = String(data.title || path.basename(file,'.md')).trim();
  const date = data.date ? new Date(data.date) : new Date(0);
  const id = slug(path.basename(file,'.md')) || slug(title);
  return {title,date,category:String(data.category||'Guerrero'),image:String(data.image||''),description:clean(data.description||content).slice(0,300),body:content,id,url:`/noticia/${id}/`};
}).sort((a,b)=>b.date-a.date);
for (const a of articles) {
  const hero = a.image ? `<figure><img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)}"></figure>` : '';
  const content = `<main><article class="story"><span class="badge">${escapeHtml(a.category.toUpperCase())}</span><h1>${escapeHtml(a.title)}</h1><div class="meta">${escapeHtml(formatDate(a.date))} · Redacción SUCESOS</div><p class="intro">${escapeHtml(a.description)}</p>${hero}<div class="story-body">${marked.parse(a.body)}</div><a class="back" href="/">← Volver a la portada de SUCESOS</a></article></main>`;
  save(path.join(out,'noticia',a.id,'index.html'),shell({title:a.title,description:a.description,image:a.image,canonical:origin+a.url,type:'article',content}));
}
const cards = articles.map(a=>`<a class="card" href="${escapeHtml(a.url)}">${a.image?`<img loading="lazy" src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)}">`:''}<div class="card-body"><span class="badge">${escapeHtml(a.category.toUpperCase())}</span><h2>${escapeHtml(a.title)}</h2><div class="meta">${escapeHtml(formatDate(a.date))}</div><p>${escapeHtml(a.description.slice(0,175))}${a.description.length>175?'…':''}</p></div></a>`).join('');
const legacy = `<a class="card" href="/politica/felix-descarta-registro-hijas-morena-acapulco-iguala/"><img loading="lazy" src="/imagenes/felix-salgado.jpg" alt="Félix Salgado"><div class="card-body"><span class="badge">POLÍTICA</span><h2>Félix descarta a sus hijas en la disputa de Morena por Acapulco e Iguala</h2><div class="meta">25 de octubre de 2026</div><p>El senador negó que sus hijas se hayan registrado para las coordinaciones municipales de Morena.</p></div></a>`;
const home = `<main><h1>Últimas noticias</h1><div class="grid">${cards}${fs.existsSync(path.join(root,'politica','felix-descarta-registro-hijas-morena-acapulco-iguala','index.html'))?legacy:''}</div>${articles.length?'':'<p>Las noticias aparecerán aquí después de publicarlas desde el administrador.</p>'}</main>`;
save(path.join(out,'index.html'),shell({title:'Noticias de Guerrero y México',description:'SUCESOS Prensa Digital. Información de Guerrero, política, municipios, seguridad y actualidad.',content:home}));
const urls=[origin+'/',...articles.map(a=>origin+a.url)];
save(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${escapeHtml(u)}</loc></url>`).join('')}</urlset>`);
console.log(`SUCESOS: ${articles.length} noticias generadas en dist/`);
