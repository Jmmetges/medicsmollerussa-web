import assert from 'node:assert/strict';
import { handle, verifyAccess } from '../src/index.js';
import { FakeKV } from './fakekv.js';
const env = { AREA: new FakeKV(), ADMIN_EMAILS: 'Direccio@centre.cat', PUBLIC_ORIGIN: 'https://medicsmollerussa.com' };
const auth = async req => req.headers.get('x-test-email');
const call = async (who, method, path, body, extra = {}) => {
  const headers = { 'x-area': '1', ...(who ? { 'x-test-email': who } : {}), ...extra };
  let b = body;
  if (body !== undefined && !(body instanceof FormData) && !(body instanceof Uint8Array)) { b = JSON.stringify(body); headers['content-type'] = 'application/json'; }
  const r = await handle(new Request('https://area.test' + path, { method, headers, body: b }), env, {}, auth);
  const ct = r.headers.get('content-type') || '';
  return { s: r.status, d: ct.includes('json') ? await r.json() : await r.text(), h: r.headers };
};
const ADM = 'direccio@centre.cat', PRO = 'elena@exemple.cat', ALTRE = 'intrus@exemple.cat';
let r;
// sense identitat
r = await call(null, 'GET', '/'); assert.equal(r.s, 401);
// verifyAccess sense token -> null
assert.equal(await verifyAccess(new Request('https://x/'), { ACCESS_TEAM: 't', ACCESS_AUD: 'a' }), null);
// intrús
r = await call(ALTRE, 'GET', '/api/me'); assert.equal(r.s, 200); assert.equal(r.d.admin, false); assert.equal(r.d.pro, null);
r = await call(ALTRE, 'GET', '/api/docs'); assert.equal(r.s, 403);
r = await call(ALTRE, 'GET', '/api/admin/pros'); assert.equal(r.s, 403);
// CSRF: sense capçalera
r = await handle(new Request('https://area.test/api/me', { headers: { 'x-test-email': ADM } }), env, {}, auth); assert.equal(r.status, 403);
// admin (correu en majúscules a la config)
r = await call(ADM, 'GET', '/api/me'); assert.equal(r.d.admin, true);
r = await call(ADM, 'GET', '/'); assert.equal(r.s, 200); assert.match(r.d, /Àrea de professionals/); assert.ok(r.h.get('content-security-policy'));
// alta
r = await call(ADM, 'POST', '/api/admin/pros', { nom: 'Elena Lafuente', email: 'Elena@Exemple.cat' }); assert.equal(r.s, 201);
r = await call(ADM, 'POST', '/api/admin/pros', { nom: 'Elena', email: PRO }); assert.equal(r.s, 409);
r = await call(ADM, 'POST', '/api/admin/pros', { nom: 'X', email: 'no-email' }); assert.equal(r.s, 400);
// el professional no pot fer coses d'admin
r = await call(PRO, 'GET', '/api/admin/pros'); assert.equal(r.s, 403);
// envia fitxa (amb camps i serveis bruts)
r = await call(PRO, 'PUT', '/api/me/fitxa', { nom: 'Elena Lafuente', titol_ca: 'Fisioterapeuta', descripcio_ca: 'x'.repeat(5000), serveis: ['fri', 'fis', 'hack'], evil: 1 });
assert.equal(r.s, 200); assert.ok(r.d.pendent); assert.deepEqual(r.d.pendent.serveis, ['fri', 'fis']); assert.equal(r.d.pendent.descripcio_ca.length, 1500); assert.equal(r.d.pendent.evil, undefined);
// foto
r = await call(PRO, 'POST', '/api/me/foto', new Uint8Array(10), { 'content-type': 'image/gif' }); assert.equal(r.s, 400);
r = await call(PRO, 'POST', '/api/me/foto', new Uint8Array(500 * 1024), { 'content-type': 'image/jpeg' }); assert.equal(r.s, 400);
r = await call(PRO, 'POST', '/api/me/foto', new Uint8Array([255, 216, 255, 1, 2]), { 'content-type': 'image/jpeg' }); assert.equal(r.s, 200); const fotoId = r.d.foto_pend; assert.ok(fotoId);
// públic: encara buit (no aprovat ni visible)
r = await call(null, 'GET', '/public/professionals.json'); assert.equal(r.s, 200); assert.deepEqual(r.d, []); assert.equal(r.h.get('access-control-allow-origin'), 'https://medicsmollerussa.com');
// rebutja
r = await call(ADM, 'POST', '/api/admin/pros/' + encodeURIComponent(PRO) + '/rebutja', { motiu: 'Falta el número de col·legiat' }); assert.equal(r.s, 200); assert.equal(r.d.pendent, null); assert.equal(r.d.rebutjada.motiu, 'Falta el número de col·legiat');
assert.equal(await env.AREA.get('foto:' + fotoId), null, 'foto rebutjada esborrada');
// torna a enviar i aprova
await call(PRO, 'PUT', '/api/me/fitxa', { nom: 'Elena Lafuente', titol_ca: 'Fisioterapeuta', colegiat: '12345', serveis: ['fri'] });
r = await call(PRO, 'POST', '/api/me/foto', new Uint8Array([1, 2, 3]), { 'content-type': 'image/png' }); const f2 = r.d.foto_pend;
r = await call(ADM, 'POST', '/api/admin/pros/' + encodeURIComponent(PRO) + '/aprova'); assert.equal(r.s, 200); assert.equal(r.d.publicada.colegiat, '12345'); assert.equal(r.d.foto_pub, f2); assert.equal(r.d.pendent, null);
r = await call(ADM, 'POST', '/api/admin/pros/' + encodeURIComponent(PRO) + '/aprova'); assert.equal(r.s, 400);
// visible -> surt al públic
r = await call(ADM, 'PATCH', '/api/admin/pros/' + encodeURIComponent(PRO), { visible: true, agenda_online: true, nom: 'hack' }); assert.equal(r.d.visible, true); assert.equal(r.d.nom, 'Elena Lafuente');
r = await call(null, 'GET', '/public/professionals.json'); assert.equal(r.d.length, 1); assert.equal(r.d[0].id, 'elena-lafuente'); assert.equal(r.d[0].colegiat, '12345'); assert.equal(r.d[0].email, undefined, 'no exposa correu'); assert.equal(r.d[0].agenda_online, true);
r = await call(null, 'GET', r.d[0].foto); assert.equal(r.s, 200); assert.equal(r.h.get('content-type'), 'image/png');
r = await call(null, 'POST', '/public/professionals.json'); assert.equal(r.s, 405);
// el professional edita i retira canvis: la versió publicada es manté
await call(PRO, 'PUT', '/api/me/fitxa', { nom: 'Elena L.', serveis: [] });
r = await call(PRO, 'DELETE', '/api/me/pendent'); assert.equal(r.d.pendent, null); assert.equal(r.d.publicada.nom, 'Elena Lafuente');
// documents
const fd = new FormData(); fd.set('titol', 'Protocol mútues'); fd.set('categoria', 'Protocols'); fd.set('fitxer', new File([new Uint8Array([37, 80, 68, 70])], 'protocol "mutues".pdf', { type: 'application/pdf' }));
r = await call(PRO, 'POST', '/api/admin/docs', fd); assert.equal(r.s, 403);
const fd2 = new FormData(); for (const [k, v] of fd) fd2.set(k, v);
r = await call(ADM, 'POST', '/api/admin/docs', fd2); assert.equal(r.s, 201); const docId = r.d.id;
r = await call(PRO, 'GET', '/api/docs'); assert.equal(r.d.length, 1);
r = await call(PRO, 'GET', '/api/docs/' + docId); assert.equal(r.s, 200); assert.match(r.h.get('content-disposition'), /attachment; filename="protocol mutues.pdf"/);
r = await call(ALTRE, 'GET', '/api/docs/' + docId); assert.equal(r.s, 403);
r = await call(ADM, 'DELETE', '/api/admin/docs/' + docId); assert.equal(r.s, 200);
r = await call(PRO, 'GET', '/api/docs'); assert.equal(r.d.length, 0);
// desactivat: perd accés
await call(ADM, 'PATCH', '/api/admin/pros/' + encodeURIComponent(PRO), { actiu: false });
r = await call(PRO, 'GET', '/api/docs'); assert.equal(r.s, 403);
r = await call(null, 'GET', '/public/professionals.json'); assert.equal(r.d.length, 0, 'inactiu no surt a la web');
// esborra
r = await call(ADM, 'DELETE', '/api/admin/pros/' + encodeURIComponent(PRO)); assert.equal(r.s, 200);
assert.equal([...env.AREA.m.keys()].filter(k => k.startsWith('foto:')).length, 0, 'fotos esborrades');
console.log('OK: totes les proves passen');
