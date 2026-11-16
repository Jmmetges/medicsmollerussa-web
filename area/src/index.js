/* Àrea privada de professionals — Mèdics Mollerussa
   Cloudflare Worker + Cloudflare Access (identitat) + KV (dades i documents).

   Variables (wrangler.toml / GitHub):
     ACCESS_TEAM   nom de l'equip de Cloudflare Zero Trust (xxx.cloudflareaccess.com)
     ACCESS_AUD    "Application Audience (AUD) Tag" de l'aplicació d'Access
     ADMIN_EMAILS  correus de direcció separats per comes (aproven canvis)
     PUBLIC_ORIGIN https://medicsmollerussa.com (CORS de l'endpoint públic)
   KV: AREA */

import { appHtml } from './app.js';

export const SERVEIS = {
  fam: 'Medicina de família', ped: 'Pediatria', inf: 'Infermeria', lab: 'Analítiques',
  fis: 'Fisioteràpia', fri: 'Fisioteràpia respiratòria infantil', psi: 'Psicologia',
  pod: 'Podologia', nut: 'Nutrició', est: 'Medicina estètica', esp: 'Revisions esportives',
  tel: 'Telemedicina', crc: 'Centre de reconeixement de conductors'
};

const FITXA_CAMPS = {
  nom: 120, titol_ca: 120, titol_es: 120, colegiat: 40,
  descripcio_ca: 1500, descripcio_es: 1500, idiomes: 120, horari: 300, mutues: 600
};
const MAX_FOTO = 400 * 1024;        // 400 KB
const MAX_DOC = 20 * 1024 * 1024;   // 20 MB (límit KV: 25 MB)
const FOTO_TIPUS = ['image/jpeg', 'image/png', 'image/webp'];

/* ---------- utilitats ---------- */
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const err = (status, msg) => json({ error: msg }, status);
const norm = e => String(e || '').trim().toLowerCase();
const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const now = () => new Date().toISOString();
const rid = () => crypto.randomUUID();
const admins = env => String(env.ADMIN_EMAILS || '').split(',').map(norm).filter(Boolean);

const security = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'self'; img-src 'self' data: blob: https://medicsmollerussa.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
};
const withSec = res => { const h = new Headers(res.headers); for (const [k, v] of Object.entries(security)) h.set(k, v); return new Response(res.body, { status: res.status, headers: h }); };

function netejaFitxa(input) {
  const f = {};
  for (const [k, max] of Object.entries(FITXA_CAMPS)) f[k] = String(input?.[k] ?? '').trim().slice(0, max);
  f.serveis = Array.isArray(input?.serveis) ? [...new Set(input.serveis.filter(s => s in SERVEIS))] : [];
  return f;
}

/* ---------- Cloudflare Access: verificació del JWT ---------- */
let jwksCache = { at: 0, keys: null };
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), c => c.charCodeAt(0));

export async function verifyAccess(request, env) {
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token || !env.ACCESS_TEAM || !env.ACCESS_AUD) return null;
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) return null;
  let header, payload;
  try { header = JSON.parse(new TextDecoder().decode(b64u(h))); payload = JSON.parse(new TextDecoder().decode(b64u(p))); } catch { return null; }
  if (Date.now() - jwksCache.at > 3600e3 || !jwksCache.keys) {
    const r = await fetch(`https://${env.ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`);
    jwksCache = { at: Date.now(), keys: (await r.json()).keys };
  }
  const jwk = jwksCache.keys.find(k => k.kid === header.kid);
  if (!jwk || header.alg !== 'RS256') return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(s), new TextEncoder().encode(h + '.' + p));
  if (!valid) return null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD)) return null;
  if (payload.exp && payload.exp * 1000 < Date.now()) return null;
  if (payload.iss && payload.iss !== `https://${env.ACCESS_TEAM}.cloudflareaccess.com`) return null;
  return norm(payload.email) || null;
}

/* ---------- dades ---------- */
const getPro = (env, email) => env.AREA.get('pro:' + email, 'json');
const putPro = (env, pro) => env.AREA.put('pro:' + pro.email, JSON.stringify(pro));
async function listPrefix(env, prefix) {
  const out = []; let cursor;
  do { const r = await env.AREA.list({ prefix, cursor }); out.push(...r.keys.map(k => k.name)); cursor = r.list_complete ? null : r.cursor; } while (cursor);
  return out;
}
async function allPros(env) {
  const keys = await listPrefix(env, 'pro:');
  return (await Promise.all(keys.map(k => env.AREA.get(k, 'json')))).filter(Boolean);
}
const proPublic = p => p && ({
  email: p.email, nom: p.nom, actiu: p.actiu, visible: p.visible, agenda_online: !!p.agenda_online,
  publicada: p.publicada || null, pendent: p.pendent || null, rebutjada: p.rebutjada || null,
  foto_pub: p.foto_pub || null, foto_pend: p.foto_pend || null, creat: p.creat
});

async function publicList(env) {
  const pros = (await allPros(env)).filter(p => p.actiu && p.visible && p.publicada);
  return pros.map(p => ({
    id: p.slug, nom: p.publicada.nom || p.nom, titol: { ca: p.publicada.titol_ca, es: p.publicada.titol_es },
    colegiat: p.publicada.colegiat, serveis: p.publicada.serveis,
    descripcio: { ca: p.publicada.descripcio_ca, es: p.publicada.descripcio_es },
    idiomes: p.publicada.idiomes, horari: p.publicada.horari, mutues: p.publicada.mutues,
    agenda_online: !!p.agenda_online, foto: p.foto_pub ? '/public/foto/' + p.foto_pub : null
  })).sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));
}
const slugify = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'professional';

/* ---------- router ---------- */
export async function handle(request, env, ctx, auth = verifyAccess) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const m = request.method;

  // Públic (sense Access: cal una regla "Bypass" per a /public/*)
  if (path.startsWith('/public/')) {
    const cors = { 'access-control-allow-origin': env.PUBLIC_ORIGIN || '*', 'vary': 'origin' };
    if (m === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET' } });
    if (m !== 'GET') return err(405, 'Mètode no permès');
    if (path === '/public/professionals.json')
      return json(await publicList(env), 200, { ...cors, 'cache-control': 'public, max-age=300' });
    const fm = path.match(/^\/public\/foto\/([a-f0-9-]{36})$/);
    if (fm) {
      const r = await env.AREA.getWithMetadata('foto:' + fm[1], 'arrayBuffer');
      if (!r.value) return err(404, 'No trobat');
      return new Response(r.value, { headers: { ...cors, 'content-type': r.metadata?.type || 'image/jpeg', 'cache-control': 'public, max-age=86400' } });
    }
    return err(404, 'No trobat');
  }

  // Tot el que no és /public requereix identitat verificada
  const email = await auth(request, env);
  if (!email) return withSec(new Response('Accés no autoritzat. Entra des de l\'enllaç de l\'àrea de professionals.', { status: 401, headers: { 'content-type': 'text/plain; charset=utf-8' } }));
  const isAdmin = admins(env).includes(email);
  const pro = await getPro(env, email);
  const isPro = !!(pro && pro.actiu);

  if (path === '/' && m === 'GET') return withSec(new Response(appHtml, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }));
  if (!path.startsWith('/api/')) return err(404, 'No trobat');

  // Protecció CSRF: totes les crides a l'API porten aquesta capçalera (força preflight entre orígens)
  if (request.headers.get('x-area') !== '1') return err(403, 'Petició no vàlida');

  if (path === '/api/me' && m === 'GET')
    return json({ email, admin: isAdmin, pro: isPro ? proPublic(pro) : null, serveis: SERVEIS });

  if (!isAdmin && !isPro) return err(403, 'Aquest correu no té accés. Demana a direcció que te\'l doni.');

  /* ---- professional ---- */
  if (path === '/api/me/fitxa' && m === 'PUT') {
    if (!isPro) return err(403, 'Només per a professionals');
    const f = netejaFitxa(await request.json());
    if (!f.nom) return err(400, 'Falta el nom');
    pro.pendent = { ...f, enviada: now() };
    pro.rebutjada = null;
    await putPro(env, pro);
    return json(proPublic(pro));
  }
  if (path === '/api/me/foto' && m === 'POST') {
    if (!isPro) return err(403, 'Només per a professionals');
    const type = (request.headers.get('content-type') || '').split(';')[0];
    if (!FOTO_TIPUS.includes(type)) return err(400, 'La foto ha de ser JPG, PNG o WebP');
    const buf = await request.arrayBuffer();
    if (buf.byteLength > MAX_FOTO) return err(400, 'La foto és massa gran (màxim 400 KB)');
    const id = rid();
    await env.AREA.put('foto:' + id, buf, { metadata: { type, email } });
    if (pro.foto_pend && pro.foto_pend !== pro.foto_pub) await env.AREA.delete('foto:' + pro.foto_pend);
    pro.foto_pend = id;
    if (!pro.pendent) pro.pendent = { ...(pro.publicada || netejaFitxa({ nom: pro.nom })), enviada: now() };
    else pro.pendent.enviada = now();
    pro.rebutjada = null;
    await putPro(env, pro);
    return json(proPublic(pro));
  }
  if (path === '/api/me/pendent' && m === 'DELETE') {
    if (!isPro) return err(403, 'Només per a professionals');
    if (pro.foto_pend && pro.foto_pend !== pro.foto_pub) await env.AREA.delete('foto:' + pro.foto_pend);
    pro.pendent = null; pro.foto_pend = null;
    await putPro(env, pro);
    return json(proPublic(pro));
  }

  /* ---- documents (professionals i direcció) ---- */
  if (path === '/api/docs' && m === 'GET') {
    const keys = await listPrefix(env, 'doc:');
    const docs = (await Promise.all(keys.map(k => env.AREA.get(k, 'json')))).filter(Boolean)
      .sort((a, b) => b.pujat.localeCompare(a.pujat));
    return json(docs);
  }
  const dm = path.match(/^\/api\/docs\/([a-f0-9-]{36})$/);
  if (dm && m === 'GET') {
    const meta = await env.AREA.get('doc:' + dm[1], 'json');
    const file = meta && await env.AREA.get('docfile:' + dm[1], 'arrayBuffer');
    if (!file) return err(404, 'Document no trobat');
    const name = meta.fitxer.replace(/["\\\r\n]/g, '');
    return withSec(new Response(file, { headers: {
      'content-type': meta.tipus || 'application/octet-stream',
      'content-disposition': `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(meta.fitxer)}`,
      'cache-control': 'no-store'
    } }));
  }

  /* ---- direcció ---- */
  if (!path.startsWith('/api/admin/')) return err(404, 'No trobat');
  if (!isAdmin) return err(403, 'Només per a direcció');

  if (path === '/api/admin/pros' && m === 'GET')
    return json((await allPros(env)).map(proPublic).sort((a, b) => a.nom.localeCompare(b.nom, 'ca')));

  if (path === '/api/admin/pros' && m === 'POST') {
    const b = await request.json();
    const e = norm(b.email), nom = String(b.nom || '').trim().slice(0, 120);
    if (!okEmail(e)) return err(400, 'Correu no vàlid');
    if (!nom) return err(400, 'Falta el nom');
    if (await getPro(env, e)) return err(409, 'Aquest professional ja existeix');
    const slugs = new Set((await allPros(env)).map(p => p.slug));
    let slug = slugify(nom), i = 2; while (slugs.has(slug)) slug = slugify(nom) + '-' + i++;
    const p = { email: e, nom, slug, actiu: true, visible: false, agenda_online: false, publicada: null,
      pendent: null, rebutjada: null, foto_pub: null, foto_pend: null, creat: now(), per: email };
    p.publicada = null;
    await putPro(env, p);
    return json(proPublic(p), 201);
  }

  const pm = path.match(/^\/api\/admin\/pros\/([^/]+)(\/(aprova|rebutja))?$/);
  if (pm) {
    const e = norm(decodeURIComponent(pm[1]));
    const p = await getPro(env, e);
    if (!p) return err(404, 'Professional no trobat');
    if (pm[3] === 'aprova' && m === 'POST') {
      if (!p.pendent) return err(400, 'No hi ha canvis pendents');
      const { enviada, ...f } = p.pendent;
      p.publicada = { ...f, aprovada: now(), per: email };
      if (f.nom) p.nom = f.nom;
      if (p.foto_pend) { if (p.foto_pub) await env.AREA.delete('foto:' + p.foto_pub); p.foto_pub = p.foto_pend; }
      p.pendent = null; p.foto_pend = null; p.rebutjada = null;
      await putPro(env, p);
      return json(proPublic(p));
    }
    if (pm[3] === 'rebutja' && m === 'POST') {
      if (!p.pendent) return err(400, 'No hi ha canvis pendents');
      const motiu = String((await request.json()).motiu || '').trim().slice(0, 500);
      if (p.foto_pend && p.foto_pend !== p.foto_pub) await env.AREA.delete('foto:' + p.foto_pend);
      p.rebutjada = { motiu, data: now(), per: email };
      p.pendent = null; p.foto_pend = null;
      await putPro(env, p);
      return json(proPublic(p));
    }
    if (!pm[2] && m === 'PATCH') {
      const b = await request.json();
      for (const k of ['actiu', 'visible', 'agenda_online']) if (typeof b[k] === 'boolean') p[k] = b[k];
      await putPro(env, p);
      return json(proPublic(p));
    }
    if (!pm[2] && m === 'DELETE') {
      for (const f of [p.foto_pub, p.foto_pend]) if (f) await env.AREA.delete('foto:' + f);
      await env.AREA.delete('pro:' + e);
      return json({ ok: true });
    }
  }

  if (path === '/api/admin/docs' && m === 'POST') {
    const fd = await request.formData();
    const file = fd.get('fitxer'), titol = String(fd.get('titol') || '').trim().slice(0, 150);
    const categoria = String(fd.get('categoria') || 'General').trim().slice(0, 60);
    if (!file || typeof file === 'string') return err(400, 'Falta el fitxer');
    if (!titol) return err(400, 'Falta el títol');
    if (file.size > MAX_DOC) return err(400, 'El fitxer és massa gran (màxim 20 MB)');
    const id = rid();
    await env.AREA.put('docfile:' + id, await file.arrayBuffer());
    const meta = { id, titol, categoria, fitxer: String(file.name || 'document').slice(0, 150), tipus: file.type || 'application/octet-stream', mida: file.size, pujat: now(), per: email };
    await env.AREA.put('doc:' + id, JSON.stringify(meta));
    return json(meta, 201);
  }
  const ad = path.match(/^\/api\/admin\/docs\/([a-f0-9-]{36})$/);
  if (ad && m === 'DELETE') {
    await env.AREA.delete('doc:' + ad[1]); await env.AREA.delete('docfile:' + ad[1]);
    return json({ ok: true });
  }

  return err(404, 'No trobat');
}

export default {
  async fetch(request, env, ctx) {
    try { return await handle(request, env, ctx); }
    catch (e) { console.error(e && e.stack || e); return err(500, 'Error intern'); }
  }
};
