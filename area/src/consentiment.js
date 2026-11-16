/* Consentiment informat del pacient (formulari públic de medicsmollerussa.com)
   - POST /public/consentiment          → valida, registra a KV i envia correus (si hi ha BREVO_API_KEY)
   - GET  /api/admin/consentiments      → llista per a direcció (amb cerca ?q=)
   - GET  /api/admin/consentiments.csv  → exportació
   Variables: CONSENT_TO (correu del centre), BREVO_API_KEY (secret), CONSENT_FROM (remitent verificat a Brevo),
              EDAT_MAJOR (edat a partir de la qual signa el pacient; per defecte 16). */

export const DNI_RE = /^([XYZ]\d{7}|\d{8})[A-Z]$/;
const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE';
export function dniValid(v) {
  const d = String(v || '').toUpperCase().replace(/[\s-]/g, '');
  if (!DNI_RE.test(d)) return false;
  const num = d.slice(0, -1).replace('X', '0').replace('Y', '1').replace('Z', '2');
  return LLETRES[parseInt(num, 10) % 23] === d.slice(-1);
}
const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const clean = (v, max = 120) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
export function edat(dataNaixement, avui = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataNaixement || ''); if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const dn = new Date(Date.UTC(y, mo - 1, d)); if (dn.getUTCMonth() !== mo - 1 || dn > avui || y < 1900) return null;
  let e = avui.getUTCFullYear() - y; if (avui.getUTCMonth() + 1 < mo || (avui.getUTCMonth() + 1 === mo && avui.getUTCDate() < d)) e--;
  return e;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function validaConsentiment(b, env, avui = new Date()) {
  const lang = b.lang === 'es' ? 'es' : 'ca';
  const T = lang === 'es'
    ? { nom: 'Falta el nombre y apellidos', dn: 'La fecha de nacimiento no es válida', dni: 'El DNI o NIE no es válido', em: 'El correo electrónico no es válido', tnom: 'Falta el nombre del padre, madre o tutor', tdni: 'El DNI o NIE del tutor no es válido', tem: 'El correo del tutor no es válido', acc: 'Tienes que aceptar el consentimiento informado y la política de privacidad', ver: 'Versión del texto desconocida' }
    : { nom: 'Falta el nom i cognoms', dn: 'La data de naixement no és vàlida', dni: 'El DNI o NIE no és vàlid', em: 'El correu electrònic no és vàlid', tnom: 'Falta el nom del pare, mare o tutor', tdni: 'El DNI o NIE del tutor no és vàlid', tem: 'El correu del tutor no és vàlid', acc: 'Has d\'acceptar el consentiment informat i la política de privacitat', ver: 'Versió del text desconeguda' };
  const p = { nom: clean(b.nom), naixement: clean(b.naixement, 10), dni: clean(b.dni, 12).toUpperCase().replace(/[\s-]/g, ''), email: clean(b.email, 160).toLowerCase(), telefon: clean(b.telefon, 20) };
  const e = edat(p.naixement, avui);
  const major = Number(env.EDAT_MAJOR || 16);
  const menor = e !== null && e < major;
  const errors = [];
  if (!p.nom) errors.push(T.nom);
  if (e === null) errors.push(T.dn);
  // Els menors poden no tenir DNI: només és obligatori si és major d'edat o si l'han escrit
  if ((!menor || p.dni) && !dniValid(p.dni)) errors.push(T.dni);
  if (!menor && !okEmail(p.email)) errors.push(T.em);
  if (menor && p.email && !okEmail(p.email)) errors.push(T.em);
  let tutor = null;
  if (menor) {
    tutor = { nom: clean(b.tutor_nom), dni: clean(b.tutor_dni, 12).toUpperCase().replace(/[\s-]/g, ''), email: clean(b.tutor_email, 160).toLowerCase() };
    if (!tutor.nom) errors.push(T.tnom);
    if (!dniValid(tutor.dni)) errors.push(T.tdni);
    if (!okEmail(tutor.email)) errors.push(T.tem);
  }
  if (b.accepta_consentiment !== true || b.accepta_privacitat !== true) errors.push(T.acc);
  const versio = clean(b.versio, 40);
  if (!/^[\w.-]{1,40}$/.test(versio)) errors.push(T.ver);
  return { errors, lang, versio, pacient: { ...p, edat: e }, menor, tutor, comunicacions: b.accepta_comunicacions === true };
}

async function enviaCorreu(env, { to, subject, html, replyTo }) {
  if (!env.BREVO_API_KEY || !env.CONSENT_FROM) return false;
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: { name: 'Mèdics Mollerussa', email: env.CONSENT_FROM }, to: [{ email: to }], subject, htmlContent: html, ...(replyTo ? { replyTo: { email: replyTo } } : {}) })
  });
  return r.ok;
}

function resumHtml(reg) {
  const es = reg.lang === 'es';
  const L = es ? { t: 'Consentimiento informado', ref: 'Referencia', data: 'Fecha y hora', pac: 'Paciente', nom: 'Nombre', dn: 'Fecha de nacimiento', dni: 'DNI/NIE', em: 'Correo', tel: 'Teléfono', tut: 'Padre, madre o tutor', acc: 'Aceptaciones', c1: 'Consentimiento informado', c2: 'Política de privacidad', c3: 'Comunicaciones del centro', si: 'Sí', no: 'No', ver: 'Versión del texto' }
    : { t: 'Consentiment informat', ref: 'Referència', data: 'Data i hora', pac: 'Pacient', nom: 'Nom', dn: 'Data de naixement', dni: 'DNI/NIE', em: 'Correu', tel: 'Telèfon', tut: 'Pare, mare o tutor', acc: 'Acceptacions', c1: 'Consentiment informat', c2: 'Política de privacitat', c3: 'Comunicacions del centre', si: 'Sí', no: 'No', ver: 'Versió del text' };
  const row = (k, v) => `<tr><td style="padding:4px 12px 4px 0;color:#66615A">${esc(k)}</td><td style="padding:4px 0">${esc(v || '—')}</td></tr>`;
  const data = new Date(reg.data).toLocaleString(es ? 'es-ES' : 'ca-ES', { timeZone: 'Europe/Madrid', dateStyle: 'long', timeStyle: 'short' });
  return `<div style="font-family:Arial,sans-serif;color:#3f3b36;font-size:15px"><h2 style="font-weight:600">${L.t} — Mèdics Mollerussa</h2><table>`
    + row(L.ref, reg.id) + row(L.data, data) + row(L.ver, reg.versio)
    + `<tr><td colspan="2" style="padding-top:12px"><b>${L.pac}</b></td></tr>` + row(L.nom, reg.pacient.nom) + row(L.dn, reg.pacient.naixement) + row(L.dni, reg.pacient.dni) + row(L.em, reg.pacient.email) + row(L.tel, reg.pacient.telefon)
    + (reg.tutor ? `<tr><td colspan="2" style="padding-top:12px"><b>${L.tut}</b></td></tr>` + row(L.nom, reg.tutor.nom) + row(L.dni, reg.tutor.dni) + row(L.em, reg.tutor.email) : '')
    + `<tr><td colspan="2" style="padding-top:12px"><b>${L.acc}</b></td></tr>` + row(L.c1, L.si) + row(L.c2, L.si) + row(L.c3, reg.comunicacions ? L.si : L.no)
    + `</table><p style="color:#66615A;font-size:13px;margin-top:18px">JM Metges, SL · CIF B26882555 · C. de la Muralla, 2, 1a planta, 25230 Mollerussa · 973 71 16 41</p></div>`;
}

export async function postConsentiment(request, env, json, err) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const hora = new Date().toISOString().slice(0, 13);
  const rk = `rl:consent:${ip}:${hora}`;
  const n = Number(await env.AREA.get(rk) || 0);
  if (n >= 20) return err(429, 'Massa sol·licituds. Torna-ho a provar més tard.');
  await env.AREA.put(rk, String(n + 1), { expirationTtl: 3700 });

  let b; try { b = await request.json(); } catch { return err(400, 'Dades no vàlides'); }
  if (b.web) return json({ ok: true, ref: 'ok' }); // parany per a robots (camp ocult)
  const v = validaConsentiment(b, env);
  if (v.errors.length) return json({ error: v.errors[0], errors: v.errors }, 400);

  const id = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + crypto.randomUUID().slice(0, 8).toUpperCase();
  const reg = { id, data: new Date().toISOString(), lang: v.lang, versio: v.versio, pacient: v.pacient, menor: v.menor, tutor: v.tutor,
    comunicacions: v.comunicacions, ip, ua: clean(request.headers.get('user-agent'), 200), correu_centre: false, correu_pacient: false };
  await env.AREA.put('consent:' + reg.data + ':' + id, JSON.stringify(reg));

  const html = resumHtml(reg);
  const es = v.lang === 'es';
  const copia = v.tutor ? v.tutor.email : v.pacient.email;
  try {
    if (env.CONSENT_TO) reg.correu_centre = await enviaCorreu(env, { to: env.CONSENT_TO, subject: `Consentiment informat — ${reg.pacient.nom} (${id})`, html, replyTo: copia || undefined });
    if (copia) reg.correu_pacient = await enviaCorreu(env, { to: copia, subject: es ? 'Copia de tu consentimiento informado — Mèdics Mollerussa' : 'Còpia del teu consentiment informat — Mèdics Mollerussa', html });
    await env.AREA.put('consent:' + reg.data + ':' + id, JSON.stringify(reg));
  } catch (e) { console.error('correu', e); }
  return json({ ok: true, ref: id, copia: reg.correu_pacient });
}

export async function llistaConsentiments(env, q) {
  const keys = []; let cursor;
  do { const r = await env.AREA.list({ prefix: 'consent:', cursor }); keys.push(...r.keys.map(k => k.name)); cursor = r.list_complete ? null : r.cursor; } while (cursor);
  keys.sort().reverse();
  const regs = (await Promise.all(keys.slice(0, 2000).map(k => env.AREA.get(k, 'json')))).filter(Boolean);
  const t = String(q || '').trim().toLowerCase();
  return t ? regs.filter(r => [r.id, r.pacient.nom, r.pacient.dni, r.pacient.email, r.tutor?.nom, r.tutor?.dni].some(x => String(x || '').toLowerCase().includes(t))) : regs;
}

export function csvConsentiments(regs) {
  const cols = ['id', 'data', 'versio', 'pacient', 'naixement', 'dni', 'email', 'telefon', 'menor', 'tutor', 'tutor_dni', 'tutor_email', 'comunicacions', 'ip'];
  const q = v => { const s = String(v ?? ''); return /[",;\n]|^[=+\-@]/.test(s) ? '"' + s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""') + '"' : s; };
  const rows = regs.map(r => [r.id, r.data, r.versio, r.pacient.nom, r.pacient.naixement, r.pacient.dni, r.pacient.email, r.pacient.telefon, r.menor ? 'sí' : 'no', r.tutor?.nom, r.tutor?.dni, r.tutor?.email, r.comunicacions ? 'sí' : 'no', r.ip].map(q).join(';'));
  return '﻿' + cols.join(';') + '\n' + rows.join('\n') + '\n';
}
