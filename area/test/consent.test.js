import assert from 'node:assert/strict';
import { handle } from '../src/index.js';
import { dniValid, edat, validaConsentiment, csvConsentiments } from '../src/consentiment.js';
import { FakeKV } from './fakekv.js';
// unitàries
assert.ok(dniValid('12345678Z')); assert.ok(dniValid('x1234567l')); assert.ok(!dniValid('12345678A')); assert.ok(!dniValid('1234'));
const avui = new Date(Date.UTC(2026, 10, 16));
assert.equal(edat('2010-11-16', avui), 16); assert.equal(edat('2010-11-17', avui), 15); assert.equal(edat('2027-01-01', avui), null); assert.equal(edat('2010-02-30', avui), null);
// integració
const sent = [];
globalThis.fetch = async (url, opt) => { sent.push({ url, body: JSON.parse(opt.body) }); return new Response('{}', { status: 201 }); };
const env = { AREA: new FakeKV(), ADMIN_EMAILS: 'dir@centre.cat', PUBLIC_ORIGIN: 'https://medicsmollerussa.com', CONSENT_TO: 'centre@centre.cat', CONSENT_FROM: 'no-reply@medicsmollerussa.com', BREVO_API_KEY: 'k' };
const auth = async r => r.headers.get('x-test-email');
const post = (b, ip = '1.1.1.1') => handle(new Request('https://a/public/consentiment', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify(b) }), env, {}, auth);
const base = { lang: 'ca', versio: '2026-11-esborrany', nom: 'Joan Puig', naixement: '1980-05-02', dni: '12345678Z', email: 'joan@exemple.cat', telefon: '600000000', accepta_consentiment: true, accepta_privacitat: true };
let r = await handle(new Request('https://a/public/consentiment', { method: 'OPTIONS' }), env, {}, auth);
assert.equal(r.status, 204); assert.match(r.headers.get('access-control-allow-methods'), /POST/);
r = await post({ ...base, accepta_privacitat: false }); assert.equal(r.status, 400); assert.match((await r.json()).error, /acceptar/);
r = await post({ ...base, dni: '12345678A' }); assert.equal(r.status, 400);
r = await post({ ...base, lang: 'es', email: 'x' }); assert.equal(r.status, 400); assert.match((await r.json()).error, /correo/);
r = await post(base); assert.equal(r.status, 200); const d = await r.json(); assert.ok(d.ref); assert.equal(d.copia, true);
assert.equal(r.headers.get('access-control-allow-origin'), 'https://medicsmollerussa.com');
assert.equal(sent.length, 2); assert.equal(sent[0].body.to[0].email, 'centre@centre.cat'); assert.equal(sent[1].body.to[0].email, 'joan@exemple.cat'); assert.match(sent[0].body.htmlContent, /Joan Puig/);
// menor sense tutor -> error; amb tutor -> còpia al tutor
r = await post({ ...base, naixement: '2015-01-01', dni: '', email: '' }); assert.equal(r.status, 400); assert.match((await r.json()).error, /tutor/);
r = await post({ ...base, nom: '<script>x</script>', naixement: '2015-01-01', dni: '', email: '', tutor_nom: 'Maria Puig', tutor_dni: 'X1234567L', tutor_email: 'maria@exemple.cat' });
assert.equal(r.status, 200); assert.equal(sent.at(-1).body.to[0].email, 'maria@exemple.cat'); assert.ok(!sent.at(-1).body.htmlContent.includes('<script>'));
// robots
const before = env.AREA.m.size; r = await post({ ...base, web: 'spam' }); assert.equal(r.status, 200); assert.equal([...env.AREA.m.keys()].filter(k => k.startsWith('consent:')).length, 2);
// límit
for (let i = 0; i < 25; i++) r = await post({ ...base, accepta_privacitat: false }, '9.9.9.9'); assert.equal(r.status, 429);
// sense Brevo configurat: es registra igualment
delete env.BREVO_API_KEY; r = await post(base, '2.2.2.2'); assert.equal(r.status, 200); assert.equal((await r.json()).copia, false);
// direcció
const adm = (path) => handle(new Request('https://a' + path, { headers: { 'x-area': '1', 'x-test-email': 'dir@centre.cat' } }), env, {}, auth);
r = await adm('/api/admin/consentiments'); const regs = await r.json(); assert.equal(regs.length, 3);
r = await adm('/api/admin/consentiments?q=maria'); assert.equal((await r.json()).length, 1);
r = await adm('/api/admin/consentiments.csv'); assert.equal(r.status, 200); const buf = new Uint8Array(await r.arrayBuffer()); assert.deepEqual([...buf.slice(0, 3)], [0xEF, 0xBB, 0xBF]); const csv = new TextDecoder().decode(buf); assert.match(csv, /id;data/); assert.equal(csv.trim().split('\n').length, 4);
r = await handle(new Request('https://a/api/admin/consentiments', { headers: { 'x-area': '1', 'x-test-email': 'intrus@x.cat' } }), env, {}, auth); assert.equal(r.status, 403);
// CSV: injecció de fórmules
assert.match(csvConsentiments([{ id: '1', data: 'd', versio: 'v', pacient: { nom: '=HYPERLINK("x")' } }]), /"'=HYPERLINK\(""x""\)"/);
// validació directa: edat límit configurable
assert.equal(validaConsentiment({ ...base, naixement: '2012-01-01' }, { EDAT_MAJOR: 14 }, avui).menor, false);
console.log('OK: consentiment');
