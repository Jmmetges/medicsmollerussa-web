/* CONSENTIMENT INFORMAT
   ENDPOINT: adreça de l'àrea privada (Cloudflare) + /public/consentiment.
   Exemple: 'https://area-medics-mollerussa.XXXX.workers.dev/public/consentiment'
   EDAT_MAJOR: a partir d'aquesta edat signa el pacient; per sota, el pare, mare o tutor (ha de coincidir amb l'àrea). */
const CONSENTIMENT = { ENDPOINT: '', EDAT_MAJOR: 16 };

{
const f = document.getElementById('cf');
if (f) {
  const es = f.dataset.lang === 'es';
  const $ = id => document.getElementById(id);
  const T = es ? {
    off: 'El formulario todavía no está activo. Llámanos al 973 71 16 41.', send: 'Enviando…', btn: 'Firma y envía', net: 'No se ha podido enviar. Revisa la conexión o llámanos al 973 71 16 41.',
    req: 'Rellena los campos marcados con *.', acc: 'Tienes que aceptar el consentimiento informado y la política de privacidad.', dni: 'El DNI o NIE no es válido.', em: 'El correo electrónico no es válido.', dn: 'La fecha de nacimiento no es válida.',
    ok: (ref, mail) => 'Referencia: ' + ref + '. ' + (mail ? 'Te hemos enviado una copia a ' + mail + '.' : 'Guarda esta referencia.')
  } : {
    off: 'El formulari encara no està actiu. Truca\'ns al 973 71 16 41.', send: 'Enviant…', btn: 'Signa i envia', net: 'No s\'ha pogut enviar. Revisa la connexió o truca\'ns al 973 71 16 41.',
    req: 'Omple els camps marcats amb *.', acc: 'Has d\'acceptar el consentiment informat i la política de privacitat.', dni: 'El DNI o NIE no és vàlid.', em: 'El correu electrònic no és vàlid.', dn: 'La data de naixement no és vàlida.',
    ok: (ref, mail) => 'Referència: ' + ref + '. ' + (mail ? 'T\'hem enviat una còpia a ' + mail + '.' : 'Guarda aquesta referència.')
  };
  const L = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const dniOk = v => { const d = String(v || '').toUpperCase().replace(/[\s-]/g, ''); if (!/^([XYZ]\d{7}|\d{8})[A-Z]$/.test(d)) return false; const n = d.slice(0, -1).replace('X', '0').replace('Y', '1').replace('Z', '2'); return L[parseInt(n, 10) % 23] === d.slice(-1); };
  const emOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const edat = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); if (!m) return null; const t = new Date(), dn = new Date(+m[1], m[2] - 1, +m[3]); if (dn > t || +m[1] < 1900) return null; let e = t.getFullYear() - +m[1]; if (t.getMonth() + 1 < +m[2] || (t.getMonth() + 1 === +m[2] && t.getDate() < +m[3])) e--; return e; };
  const menor = () => { const e = edat($('c_dn').value); return e !== null && e < CONSENTIMENT.EDAT_MAJOR; };
  const upd = () => { const mn = menor(); $('c_tutor').hidden = !mn; $('c_dnireq').hidden = mn; $('c_emreq').hidden = mn; };
  $('c_dn').addEventListener('change', upd); $('c_dn').addEventListener('input', upd); upd();
  const fail = (msg, el) => { $('c_err').textContent = msg; $('c_err').hidden = false; if (el) el.focus(); };

  f.addEventListener('submit', async e => {
    e.preventDefault(); $('c_err').hidden = true;
    const v = n => (f.elements[n].value || '').trim();
    const mn = menor();
    if (!v('nom')) return fail(T.req, $('c_nom'));
    if (edat(v('naixement')) === null) return fail(T.dn, $('c_dn'));
    if ((!mn || v('dni')) && !dniOk(v('dni'))) return fail(T.dni, $('c_dni'));
    if ((!mn || v('email')) && !emOk(v('email'))) return fail(T.em, $('c_em'));
    if (mn) {
      if (!v('tutor_nom')) return fail(T.req, $('c_tnom'));
      if (!dniOk(v('tutor_dni'))) return fail(T.dni, $('c_tdni'));
      if (!emOk(v('tutor_email'))) return fail(T.em, $('c_tem'));
    }
    if (!f.elements.accepta_consentiment.checked || !f.elements.accepta_privacitat.checked) return fail(T.acc, f.elements.accepta_consentiment);
    if (!CONSENTIMENT.ENDPOINT) return fail(T.off);
    const body = { lang: es ? 'es' : 'ca', versio: f.dataset.versio, web: v('web'),
      nom: v('nom'), naixement: v('naixement'), dni: v('dni'), email: v('email'), telefon: v('telefon'),
      tutor_nom: mn ? v('tutor_nom') : '', tutor_dni: mn ? v('tutor_dni') : '', tutor_email: mn ? v('tutor_email') : '',
      accepta_consentiment: true, accepta_privacitat: true, accepta_comunicacions: f.elements.accepta_comunicacions.checked };
    const btn = $('c_btn'); btn.disabled = true; btn.textContent = T.send;
    try {
      const r = await fetch(CONSENTIMENT.ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || T.net);
      [...f.querySelectorAll('.f, fieldset, .checks2, .note, #c_btn')].forEach(x => { x.hidden = true; x.style.display = 'none'; });
      $('c_okp').textContent = T.ok(d.ref, d.copia ? (mn ? body.tutor_email : body.email) : '');
      $('c_ok').hidden = false; $('c_ok').focus();
    } catch (err) { fail(err.message || T.net); btn.disabled = false; btn.textContent = T.btn; }
  });
}
}
