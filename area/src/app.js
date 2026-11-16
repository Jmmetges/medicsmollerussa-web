/* Interfície de l'àrea de professionals (una sola pàgina, en català). */
export const appHtml = `<!DOCTYPE html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Àrea de professionals | Mèdics Mollerussa</title>
<link rel="icon" href="https://medicsmollerussa.com/assets/favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#fff;--ink:#3f3b36;--soft:#66615A;--mint:#F1F5F4;--m621:#CDE1DA;--m622:#B4CDC5;--deep:#4f7a6c;--sand2:#F2F0E4;--line:#dfe7e4;--warn:#9a5b13;--warnbg:#fbf1e2;--bad:#9b2c2c;--badbg:#fbeaea}
*{box-sizing:border-box;min-width:0}
body{margin:0;background:var(--mint);color:var(--ink);font:300 16px/1.55 Raleway,"Segoe UI",system-ui,sans-serif}
h1,h2,h3{font-weight:500;margin:0;line-height:1.2}h1{font-size:28px}h2{font-size:21px}h3{font-size:17px}
b{font-weight:500}a{color:inherit}
header{background:var(--bg);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
.bar{max-width:1100px;margin:0 auto;padding:10px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.bar img{height:38px;width:auto}.bar .tag{font-size:13px;background:var(--m621);border-radius:99px;padding:3px 12px;font-weight:500}
.bar .me{margin-left:auto;font-size:14px;color:var(--soft)}
main{max-width:1100px;margin:0 auto;padding:24px 20px 60px}
nav.tabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 22px}
nav.tabs button{border:0;background:transparent;font:inherit;font-weight:500;padding:9px 16px;border-radius:99px;cursor:pointer;color:var(--soft)}
nav.tabs button[aria-selected=true]{background:var(--ink);color:#fff}
.n{display:inline-grid;place-items:center;min-width:20px;height:20px;border-radius:99px;background:var(--warn);color:#fff;font-size:12px;margin-left:6px;padding:0 6px}
.card{background:var(--bg);border-radius:22px;padding:24px;margin-bottom:18px;box-shadow:0 1px 0 var(--line)}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px}.full{grid-column:1/-1}
label{display:block;font-weight:500;font-size:14px;margin-bottom:5px}
input,textarea,select{font:inherit;font-weight:400;font-size:15px;color:var(--ink);background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;width:100%}
textarea{min-height:110px;resize:vertical}
input:focus,textarea:focus,select:focus{outline:none;border-color:var(--deep);box-shadow:0 0 0 3px #4f7a6c33}
.hint{font-size:13px;color:var(--soft);margin-top:4px}
.checks{display:flex;flex-wrap:wrap;gap:8px}
.checks label{display:flex;gap:7px;align-items:center;font-weight:400;background:var(--mint);border-radius:99px;padding:6px 12px;margin:0;cursor:pointer}
.checks input{width:auto}
.btn{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 18px;border-radius:99px;border:0;background:var(--ink);color:#fff;font:inherit;font-weight:500;cursor:pointer;text-decoration:none}
.btn.alt{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink)}
.btn.ok{background:var(--deep)}.btn.bad{background:transparent;color:var(--bad);box-shadow:inset 0 0 0 1.5px var(--bad)}
.btn.sm{min-height:34px;padding:0 13px;font-size:14px}
.btn:disabled{opacity:.5;cursor:default}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.state{border-radius:14px;padding:12px 16px;margin-bottom:18px;font-size:15px}
.state.pub{background:var(--m621)}.state.pend{background:var(--warnbg);color:var(--warn)}.state.rej{background:var(--badbg);color:var(--bad)}.state.none{background:var(--sand2)}
.foto{display:flex;gap:16px;align-items:center}
.foto img,.ph{width:96px;height:96px;border-radius:50%;object-fit:cover;background:var(--m622);flex:none}
table{width:100%;border-collapse:collapse;font-size:15px}
th,td{text-align:left;padding:10px 8px;border-top:1px solid var(--line);vertical-align:top}
th{font-weight:500;font-size:13px;color:var(--soft);border-top:0}
.diff td.chg{background:var(--warnbg)}
.diff td{white-space:pre-wrap;word-break:break-word}
.muted{color:var(--soft)}.small{font-size:14px}
.empty{color:var(--soft);padding:10px 0}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:#fff;border-radius:99px;padding:10px 20px;font-size:15px;z-index:20}
.toast.bad{background:var(--bad)}
.doc{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}
.doc:first-of-type{border-top:0}
.cat{margin-top:14px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--deep);font-weight:600}
@media (max-width:700px){.grid{grid-template-columns:minmax(0,1fr)}.hide-s{display:none}}
</style>
</head>
<body>
<header><div class="bar"><img src="https://medicsmollerussa.com/assets/logo-color.png" alt="Mèdics Mollerussa"><span class="tag">Àrea de professionals</span><span class="me" id="me"></span><a class="btn alt sm" href="/cdn-cgi/access/logout">Surt</a></div></header>
<main id="app"><p class="muted">Carregant…</p></main>
<script>
(() => {
const app = document.getElementById('app');
let ME = null, SV = {}, TAB = null;
const api = async (path, opt = {}) => {
  const r = await fetch(path, { ...opt, headers: { 'x-area': '1', ...(opt.json !== undefined ? { 'content-type': 'application/json' } : {}), ...(opt.headers || {}) }, body: opt.json !== undefined ? JSON.stringify(opt.json) : opt.body });
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : null;
  if (!r.ok) throw new Error((data && data.error) || 'Error ' + r.status);
  return data;
};
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : String(k));
  return e;
}
const toast = (msg, bad) => { document.querySelectorAll('.toast').forEach(x => x.remove()); const t = h('div', { class: 'toast' + (bad ? ' bad' : ''), role: 'status' }, msg); document.body.append(t); setTimeout(() => t.remove(), 3500); };
const fdata = iso => iso ? new Date(iso).toLocaleString('ca-ES', { dateStyle: 'medium', timeStyle: 'short' }) : '';
const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const fotoUrl = id => id ? '/public/foto/' + id : null;
const CAMPS = [['nom','Nom i cognoms (tal com sortirà a la web)'],['titol_ca','Títol professional (català)'],['titol_es','Título profesional (castellano)'],['colegiat','Núm. de col·legiat'],['descripcio_ca','Presentació (català)'],['descripcio_es','Presentación (castellano)'],['idiomes','Idiomes'],['horari','Dies i horari de consulta'],['mutues','Mútues amb què treballes']];
const LLARGS = ['descripcio_ca','descripcio_es','mutues','horari'];

async function boot() {
  try { const d = await api('/api/me'); ME = d; SV = d.serveis; }
  catch (e) { app.replaceChildren(h('div', { class: 'card' }, h('h1', null, 'Sense accés'), h('p', null, e.message))); return; }
  document.getElementById('me').textContent = ME.email;
  if (!ME.admin && !ME.pro) { app.replaceChildren(h('div', { class: 'card' }, h('h1', null, 'Aquest correu no té accés'), h('p', null, 'Has entrat amb ' + ME.email + ', però no està donat d\\'alta com a professional. Demana a direcció que t\\'hi doni accés.'))); return; }
  TAB = TAB || (ME.pro ? 'fitxa' : 'pendents');
  render();
}
async function render() {
  const tabs = [];
  if (ME.pro) tabs.push(['fitxa', 'La meva fitxa'], ['docs', 'Documents']);
  let npend = 0;
  if (ME.admin) {
    try { window.__pros = await api('/api/admin/pros'); npend = window.__pros.filter(p => p.pendent).length; } catch (e) { toast(e.message, 1); }
    tabs.push(['pendents', 'Per aprovar', npend], ['pros', 'Professionals'], ['gdocs', 'Gestió de documents'], ['consent', 'Consentiments']);
  }
  const nav = h('nav', { class: 'tabs', role: 'tablist' }, tabs.map(([k, t, n]) => h('button', { role: 'tab', 'aria-selected': String(TAB === k), onclick: () => { TAB = k; render(); } }, t, n ? h('span', { class: 'n' }, n) : null)));
  const body = h('div');
  app.replaceChildren(nav, body);
  try { await ({ fitxa: vFitxa, docs: vDocs, pendents: vPendents, pros: vPros, gdocs: vGDocs, consent: vConsent })[TAB](body); }
  catch (e) { body.replaceChildren(h('div', { class: 'card' }, h('p', null, e.message))); }
}

/* ---- La meva fitxa ---- */
async function vFitxa(el) {
  const d = await api('/api/me'); const p = d.pro; ME.pro = p;
  const base = p.pendent || p.publicada || { nom: p.nom, serveis: [] };
  let st;
  if (p.pendent) st = h('div', { class: 'state pend' }, h('b', null, 'Pendent d\\'aprovació. '), 'Has enviat canvis el ' + fdata(p.pendent.enviada) + '. Direcció els revisarà abans de publicar-los a la web.');
  else if (p.rebutjada) st = h('div', { class: 'state rej' }, h('b', null, 'Canvis no aprovats. '), p.rebutjada.motiu ? 'Motiu: ' + p.rebutjada.motiu : 'Pots revisar-los i tornar-los a enviar.');
  else if (p.publicada) st = h('div', { class: 'state pub' }, h('b', null, 'Fitxa aprovada. '), p.visible ? 'Es mostra a la web.' : 'De moment no es mostra a la web (ho decideix direcció).');
  else st = h('div', { class: 'state none' }, h('b', null, 'Encara no has completat la fitxa. '), 'Omple-la i envia-la per aprovar.');

  const curFoto = fotoUrl(p.foto_pend || p.foto_pub);
  const fin = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'hide', style: 'display:none', onchange: async () => {
    const f = fin.files[0]; if (!f) return;
    if (f.size > 400 * 1024) { toast('La foto ha de fer menys de 400 KB', 1); return; }
    try { await api('/api/me/foto', { method: 'POST', body: f, headers: { 'content-type': f.type } }); toast('Foto enviada per aprovar'); render(); } catch (e) { toast(e.message, 1); }
  } });
  const fotoBox = h('div', { class: 'foto' }, curFoto ? h('img', { src: curFoto, alt: 'La teva foto' }) : h('div', { class: 'ph' }),
    h('div', null, h('button', { class: 'btn alt sm', type: 'button', onclick: () => fin.click() }, curFoto ? 'Canvia la foto' : 'Puja una foto'), h('p', { class: 'hint' }, 'JPG, PNG o WebP, quadrada i de menys de 400 KB.'), p.foto_pend ? h('p', { class: 'hint' }, 'Foto nova pendent d\\'aprovació.') : null), fin);

  const inputs = {};
  const fields = CAMPS.map(([k, l]) => {
    const inp = LLARGS.includes(k) ? h('textarea', { id: k }) : h('input', { id: k });
    inp.value = base[k] || ''; inputs[k] = inp;
    return h('div', { class: LLARGS.includes(k) && k.startsWith('desc') ? 'full' : '' }, h('label', { for: k }, l), inp,
      k === 'mutues' ? h('p', { class: 'hint' }, 'Separades per comes. Ex.: Sanitas, Adeslas, Asisa') : null,
      k === 'horari' ? h('p', { class: 'hint' }, 'Ex.: Dilluns i dimecres de 16 a 20 h') : null);
  });
  const svs = new Set(base.serveis || []);
  const checks = h('div', { class: 'checks' }, Object.entries(SV).map(([k, t]) => h('label', null, h('input', { type: 'checkbox', value: k, checked: svs.has(k) }), t)));
  const form = h('form', { class: 'card', onsubmit: async e => {
    e.preventDefault();
    const body = {}; for (const k in inputs) body[k] = inputs[k].value;
    body.serveis = [...checks.querySelectorAll('input:checked')].map(i => i.value);
    try { await api('/api/me/fitxa', { method: 'PUT', json: body }); toast('Canvis enviats a direcció per aprovar'); render(); } catch (e2) { toast(e2.message, 1); }
  } },
    h('h2', null, 'Les teves dades a la web'), h('p', { class: 'muted small' }, 'Quan envies els canvis, direcció els revisa i, si els aprova, es publiquen a medicsmollerussa.com.'),
    fotoBox, h('div', { style: 'height:16px' }),
    h('div', { class: 'grid' }, fields, h('div', { class: 'full' }, h('label', null, 'Serveis en què atens'), checks)),
    h('div', { class: 'row', style: 'margin-top:20px' }, h('button', { class: 'btn', type: 'submit' }, 'Envia per aprovar'),
      p.pendent ? h('button', { class: 'btn alt', type: 'button', onclick: async () => { if (!confirm('Vols retirar els canvis pendents?')) return; try { await api('/api/me/pendent', { method: 'DELETE' }); toast('Canvis retirats'); render(); } catch (e) { toast(e.message, 1); } } }, 'Retira els canvis pendents') : null));
  el.replaceChildren(st, form);
}

/* ---- Documents ---- */
async function download(d) {
  try {
    const r = await fetch('/api/docs/' + d.id, { headers: { 'x-area': '1' } });
    if (!r.ok) throw new Error('No s\\'ha pogut descarregar');
    const url = URL.createObjectURL(await r.blob());
    const a = h('a', { href: url, download: d.fitxer }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e) { toast(e.message, 1); }
}
function docList(docs, admin) {
  if (!docs.length) return h('p', { class: 'empty' }, 'Encara no hi ha documents.');
  const cats = {}; for (const d of docs) (cats[d.categoria] = cats[d.categoria] || []).push(d);
  return Object.keys(cats).sort((a, b) => a.localeCompare(b, 'ca')).map(c => [h('div', { class: 'cat' }, c), cats[c].map(d => h('div', { class: 'doc' },
    h('div', null, h('b', null, d.titol), h('div', { class: 'muted small' }, d.fitxer + ' · ' + kb(d.mida) + ' · ' + fdata(d.pujat))),
    h('div', { class: 'row' }, h('button', { class: 'btn alt sm', onclick: () => download(d) }, 'Descarrega'),
      admin ? h('button', { class: 'btn bad sm', onclick: async () => { if (!confirm('Vols esborrar «' + d.titol + '»?')) return; try { await api('/api/admin/docs/' + d.id, { method: 'DELETE' }); toast('Document esborrat'); render(); } catch (e) { toast(e.message, 1); } } }, 'Esborra') : null)))]);
}
async function vDocs(el) {
  const docs = await api('/api/docs');
  el.replaceChildren(h('div', { class: 'card' }, h('h2', null, 'Documents del centre'), h('p', { class: 'muted small' }, 'Protocols, circulars i formularis per als professionals de Mèdics Mollerussa.'), docList(docs, false)));
}
async function vGDocs(el) {
  const docs = await api('/api/docs');
  const cats = [...new Set(['Protocols', 'Circulars', 'Formularis', ...docs.map(d => d.categoria)])];
  const dl = h('datalist', { id: 'cats' }, cats.map(c => h('option', { value: c })));
  const form = h('form', { class: 'card', onsubmit: async e => {
    e.preventDefault(); const btn = form.querySelector('button'); btn.disabled = true;
    try { await api('/api/admin/docs', { method: 'POST', body: new FormData(form) }); toast('Document pujat'); render(); } catch (e2) { toast(e2.message, 1); btn.disabled = false; }
  } }, h('h2', null, 'Puja un document'),
    h('div', { class: 'grid', style: 'margin-top:14px' },
      h('div', null, h('label', { for: 'dt' }, 'Títol'), h('input', { id: 'dt', name: 'titol', required: true })),
      h('div', null, h('label', { for: 'dc' }, 'Categoria'), h('input', { id: 'dc', name: 'categoria', list: 'cats', value: 'Protocols', required: true }), dl),
      h('div', { class: 'full' }, h('label', { for: 'df' }, 'Fitxer'), h('input', { id: 'df', name: 'fitxer', type: 'file', required: true }), h('p', { class: 'hint' }, 'Màxim 20 MB. No hi pugis dades de pacients.'))),
    h('div', { style: 'margin-top:16px' }, h('button', { class: 'btn', type: 'submit' }, 'Puja el document')));
  el.replaceChildren(form, h('div', { class: 'card' }, h('h2', null, 'Documents publicats'), docList(docs, true)));
}

/* ---- Direcció: per aprovar ---- */
async function vPendents(el) {
  const pros = (window.__pros || []).filter(p => p.pendent);
  if (!pros.length) { el.replaceChildren(h('div', { class: 'card' }, h('h2', null, 'Res per aprovar'), h('p', { class: 'muted' }, 'Quan un professional enviï canvis a la seva fitxa, apareixeran aquí.'))); return; }
  el.replaceChildren(...pros.map(p => {
    const a = p.publicada || {}, b = p.pendent;
    const rows = [...CAMPS, ['serveis', 'Serveis']].map(([k, l]) => {
      const fmt = v => k === 'serveis' ? (v || []).map(s => SV[s] || s).join(', ') : (v || '');
      const va = fmt(a[k]), vb = fmt(b[k]);
      return h('tr', null, h('th', null, l), h('td', { class: 'hide-s' }, va || '—'), h('td', { class: va !== vb ? 'chg' : '' }, vb || '—'));
    });
    const fotoA = fotoUrl(p.foto_pub), fotoB = fotoUrl(p.foto_pend);
    return h('div', { class: 'card' },
      h('div', { class: 'row', style: 'justify-content:space-between' }, h('div', null, h('h2', null, p.nom), h('p', { class: 'muted small' }, p.email + ' · enviat el ' + fdata(b.enviada))),
        h('div', { class: 'row' },
          h('button', { class: 'btn ok', onclick: async () => { try { await api('/api/admin/pros/' + encodeURIComponent(p.email) + '/aprova', { method: 'POST' }); toast('Canvis aprovats i publicats'); render(); } catch (e) { toast(e.message, 1); } } }, 'Aprova'),
          h('button', { class: 'btn bad', onclick: async () => { const motiu = prompt('Motiu (el veurà el professional):', ''); if (motiu === null) return; try { await api('/api/admin/pros/' + encodeURIComponent(p.email) + '/rebutja', { method: 'POST', json: { motiu } }); toast('Canvis rebutjats'); render(); } catch (e) { toast(e.message, 1); } } }, 'Rebutja'))),
      p.foto_pend ? h('div', { class: 'row', style: 'margin:14px 0' }, h('span', { class: 'muted small' }, 'Foto:'), fotoA ? h('img', { src: fotoA, alt: 'Actual', style: 'width:72px;height:72px;border-radius:50%;object-fit:cover' }) : h('span', { class: 'muted small' }, '(cap)'), '→', h('img', { src: fotoB, alt: 'Nova', style: 'width:72px;height:72px;border-radius:50%;object-fit:cover;outline:3px solid var(--warn)' })) : null,
      h('table', { class: 'diff', style: 'margin-top:12px' }, h('tr', null, h('th', null, 'Camp'), h('th', { class: 'hide-s' }, 'Ara a la web'), h('th', null, 'Proposat')), rows));
  }));
}

/* ---- Direcció: professionals ---- */
async function vPros(el) {
  const pros = window.__pros || [];
  const add = h('form', { class: 'card', onsubmit: async e => {
    e.preventDefault(); const fd = new FormData(add);
    try { await api('/api/admin/pros', { method: 'POST', json: { nom: fd.get('nom'), email: fd.get('email') } }); toast('Professional donat d\\'alta'); render(); } catch (e2) { toast(e2.message, 1); }
  } }, h('h2', null, 'Dona d\\'alta un professional'),
    h('p', { class: 'muted small' }, 'Entrarà a l\\'àrea amb aquest correu: rebrà un codi d\\'accés cada vegada, sense contrasenya.'),
    h('div', { class: 'grid', style: 'margin-top:12px' },
      h('div', null, h('label', { for: 'an' }, 'Nom i cognoms'), h('input', { id: 'an', name: 'nom', required: true })),
      h('div', null, h('label', { for: 'ae' }, 'Correu electrònic'), h('input', { id: 'ae', name: 'email', type: 'email', required: true }))),
    h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn', type: 'submit' }, 'Dona d\\'alta')));
  const tog = (p, k, label) => h('label', { style: 'display:flex;gap:6px;align-items:center;font-weight:400;margin:0' }, h('input', { type: 'checkbox', checked: !!p[k], style: 'width:auto', onchange: async e => {
    try { await api('/api/admin/pros/' + encodeURIComponent(p.email), { method: 'PATCH', json: { [k]: e.target.checked } }); toast('Desat'); window.__pros = await api('/api/admin/pros'); } catch (e2) { toast(e2.message, 1); e.target.checked = !e.target.checked; }
  } }), label);
  const estat = p => p.pendent ? 'Canvis pendents' : p.publicada ? 'Fitxa aprovada' : 'Sense fitxa';
  const list = h('div', { class: 'card' }, h('h2', null, 'Professionals (' + pros.length + ')'),
    pros.length ? h('table', { style: 'margin-top:10px' }, h('tr', null, h('th', null, 'Professional'), h('th', null, 'Estat'), h('th', null, 'Opcions'), h('th', null, '')),
      pros.map(p => h('tr', null,
        h('td', null, h('b', null, p.nom), h('div', { class: 'muted small' }, p.email)),
        h('td', { class: 'small' }, estat(p)),
        h('td', { class: 'small' }, tog(p, 'actiu', 'Accés a l\\'àrea'), tog(p, 'visible', 'Visible a la web'), tog(p, 'agenda_online', 'Té agenda en línia')),
        h('td', null, h('button', { class: 'btn bad sm', onclick: async () => { if (!confirm('Vols esborrar ' + p.nom + ' i la seva fitxa?')) return; try { await api('/api/admin/pros/' + encodeURIComponent(p.email), { method: 'DELETE' }); toast('Esborrat'); render(); } catch (e) { toast(e.message, 1); } } }, 'Esborra'))))) : h('p', { class: 'empty' }, 'Encara no hi ha cap professional.'));
  el.replaceChildren(add, list);
}
/* ---- Direcció: consentiments ---- */
let CQ = '';
async function vConsent(el) {
  const regs = await api('/api/admin/consentiments?q=' + encodeURIComponent(CQ));
  const q = h('input', { type: 'search', placeholder: 'Cerca per nom, DNI, correu o referència', value: CQ });
  const form = h('form', { class: 'row', onsubmit: e => { e.preventDefault(); CQ = q.value.trim(); render(); } }, h('div', { style: 'flex:1;min-width:220px' }, q), h('button', { class: 'btn alt sm', type: 'submit' }, 'Cerca'),
    h('button', { class: 'btn sm', type: 'button', onclick: async () => {
      try { const r = await fetch('/api/admin/consentiments.csv?q=' + encodeURIComponent(CQ), { headers: { 'x-area': '1' } }); if (!r.ok) throw new Error('No s\'ha pogut exportar');
        const url = URL.createObjectURL(await r.blob()); const a = h('a', { href: url, download: 'consentiments.csv' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (e) { toast(e.message, 1); } } }, 'Exporta a Excel (CSV)'));
  const rows = regs.map(r => h('tr', null,
    h('td', null, h('b', null, r.pacient.nom), h('div', { class: 'muted small' }, (r.pacient.dni || 'sense DNI') + ' · ' + r.pacient.naixement), r.tutor ? h('div', { class: 'small' }, 'Tutor/a: ' + r.tutor.nom + ' (' + r.tutor.dni + ')') : null),
    h('td', { class: 'small' }, fdata(r.data), h('div', { class: 'muted' }, r.id)),
    h('td', { class: 'small hide-s' }, (r.tutor ? r.tutor.email : r.pacient.email) || '—', h('div', { class: 'muted' }, 'Còpia enviada: ' + (r.correu_pacient ? 'sí' : 'no'))),
    h('td', { class: 'small hide-s' }, 'Text ' + r.versio, h('div', { class: 'muted' }, 'Comunicacions: ' + (r.comunicacions ? 'sí' : 'no')))));
  el.replaceChildren(h('div', { class: 'card' }, h('h2', null, 'Consentiments informats'), h('p', { class: 'muted small' }, 'Registre dels consentiments signats des de la web. ' + regs.length + (CQ ? ' resultats.' : ' en total.')), form,
    regs.length ? h('table', { style: 'margin-top:14px' }, h('tr', null, h('th', null, 'Pacient'), h('th', null, 'Data'), h('th', { class: 'hide-s' }, 'Correu'), h('th', { class: 'hide-s' }, 'Detalls')), rows) : h('p', { class: 'empty' }, CQ ? 'Cap resultat.' : 'Encara no hi ha cap consentiment.')));
}
boot();
})();
</script>
</body>
</html>`;
