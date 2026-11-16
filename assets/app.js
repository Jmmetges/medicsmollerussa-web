{
const lg = document.documentElement.lang === 'es' ? 'es' : 'ca';
const es = lg === 'es';
const $ = id => document.getElementById(id);
const M = window.MUTUES || {};

/* Estat obert / tancat (hora de Mollerussa) */
const H = {1:[8,20.5],2:[8,20.5],3:[8,20.5],4:[8,20.5],5:[8,20.5]};
const D = {ca:['diumenge','dilluns','dimarts','dimecres','dijous','divendres','dissabte'],es:['domingo','lunes','martes','miércoles','jueves','viernes','sábado']};
const hh = h => (h % 1 ? Math.floor(h) + '.30' : h) + ' h';
const clock = () => {
  const st = $('st'); if (!st) return;
  let t; try { t = new Date(new Date().toLocaleString('en-US', {timeZone: 'Europe/Madrid'})); } catch (e) { t = new Date(); }
  const d = t.getDay(), m = t.getHours() + t.getMinutes() / 60, s = H[d];
  const open = s && m >= s[0] && m < s[1];
  let nx = '';
  if (open) nx = (es ? 'Hasta las ' : 'Fins a les ') + hh(s[1]);
  else for (let i = 0; i < 8; i++) {
    const dd = (d + i) % 7, x = H[dd];
    if (x && (i > 0 || m < x[0])) {
      const when = i === 0 ? (es ? 'hoy' : 'avui') : i === 1 ? (es ? 'mañana' : 'demà') : (es ? 'el ' : 'el ') + D[lg][dd];
      nx = (es ? 'Abre ' : 'Obrim ') + when + (es ? ' a las ' : ' a les ') + hh(x[0]);
      break;
    }
  }
  const dot = $('dot'); if (dot) dot.className = 'dot' + (open ? ' on' : '');
  st.textContent = open ? (es ? 'Abierto ahora' : 'Obert ara') : (es ? 'Cerrado ahora' : 'Tancat ara');
  if ($('nx')) $('nx').textContent = nx;
};
clock(); setInterval(clock, 60000);

/* Llista d'asseguradores a les pàgines de servei */
document.querySelectorAll('[data-mut]').forEach(el => {
  const ls = M[el.dataset.mut] || [];
  el.textContent = [es ? 'Privado' : 'Privat'].concat(ls).join(' · ');
});

/* Formulari de cita */
const fm = $('fm');
if (fm) {
  const sv = $('sv'), as = $('as'), ash = $('ash');
  const ins = () => {
    const k = sv.value, prev = as.value;
    if (!k) { as.disabled = true; as.innerHTML = '<option value="">' + (es ? 'Primero elige el servicio' : 'Primer tria el servei') + '</option>'; ash.textContent = ''; return; }
    const ls = M[k] || [];
    as.disabled = false;
    as.innerHTML = '<option value="">' + (es ? 'Elige una opción' : 'Tria una opció') + '</option><option value="priv">' + (es ? 'Privado (sin mutua)' : 'Privat (sense mútua)') + '</option>' + ls.map(x => '<option>' + x + '</option>').join('');
    as.value = [...as.options].some(o => o.value === prev) ? prev : '';
    ash.textContent = ls.length ? '' : (es ? 'Este servicio, por ahora, solo es privado.' : 'Aquest servei, de moment, només és privat.');
  };
  sv.addEventListener('change', ins); ins();
  const val = id => { const e = $(id); return e.tagName === 'SELECT' ? (e.value ? e.options[e.selectedIndex].text : '') : e.value.trim(); };
  fm.addEventListener('submit', e => {
    e.preventDefault();
    const req = ['sv','nm','cg','dn','tl','as'].filter(id => !$(id).value.trim());
    if (req.length) { $('er').hidden = false; $('er').textContent = es ? 'Completa los campos marcados con *.' : 'Omple els camps marcats amb *.'; $(req[0]).focus(); $('ok').hidden = true; return; }
    $('er').hidden = true;
    const lb = es ? ['Servicio','Nombre','Apellidos','Fecha de nacimiento','Teléfono','Email','Aseguradora','Profesional','Preferencia','Motivo'] : ['Servei','Nom','Cognoms','Data de naixement','Telèfon','Email','Asseguradora','Professional','Preferència','Motiu'];
    const txt = ['sv','nm','cg','dn','tl','em','as','pr','fr','mt'].map((id, i) => lb[i] + ': ' + (val(id) || '—')).join('\n');
    $('sum').textContent = txt;
    const subj = (es ? 'Solicitud de cita web – ' : 'Sol·licitud de cita web – ') + val('sv') + ' – ' + val('nm') + ' ' + val('cg');
    if ($('ml')) $('ml').href = 'mailto:' + fm.dataset.to + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(txt);
    $('ok').hidden = false; $('ok').scrollIntoView({block: 'nearest'});
  });
  $('cp').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('sum').textContent); $('cp').textContent = es ? 'Texto copiado' : 'Text copiat'; }
    catch (e) { $('cp').textContent = es ? 'Selecciona el texto para copiarlo' : 'Selecciona el text per copiar-lo'; }
  });
}
}
