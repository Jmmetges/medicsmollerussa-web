#!/usr/bin/env python3
"""Actualitza la web a partir de assets/mutues.js i de l'horari del centre.

- Escriu les mútues de cada servei directament a l'HTML (Google les llegeix sense executar JavaScript).
- Afegeix a les preguntes freqüents de cada pàgina: mútues, on som i horari (i les dades estructurades FAQPage).
- Genera la pàgina de mútues (mutues.html i es/mutuas.html).

S'executa sol amb GitHub Actions quan canvia assets/mutues.js. També a mà:  python3 tools/actualitza-mutues.py
"""
import glob, html, json, re, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# ---------- dades ----------
js = open('assets/mutues.js', encoding='utf-8').read()
MUT = {}
for k, body in re.findall(r'^\s*(\w+):\s*\[(.*?)\]', js, re.M):
    MUT[k] = re.findall(r"'([^']*)'", body)

SV = {  # clau: (català, castellano, pàgina ca, página es, nom en frase ca, en frase es)
    'fam': ('Medicina de família', 'Medicina de familia', 'serveis/medicina-familia.html', 'es/servicios/medicina-familia.html', 'medicina de família', 'medicina de familia'),
    'ped': ('Pediatria', 'Pediatría', 'serveis/pediatria.html', 'es/servicios/pediatria.html', 'pediatria', 'pediatría'),
    'inf': ('Infermeria', 'Enfermería', 'serveis/infermeria.html', 'es/servicios/enfermeria.html', 'infermeria', 'enfermería'),
    'lab': ('Analítiques', 'Análisis clínicos', 'serveis/analitiques.html', 'es/servicios/analisis-clinicos.html', 'les analítiques', 'los análisis clínicos'),
    'fis': ('Fisioteràpia', 'Fisioterapia', 'serveis/fisioterapia.html', 'es/servicios/fisioterapia.html', 'fisioteràpia', 'fisioterapia'),
    'fri': ('Fisioteràpia respiratòria infantil', 'Fisioterapia respiratoria infantil', 'serveis/fisioterapia-respiratoria-infantil.html', 'es/servicios/fisioterapia-respiratoria-infantil.html', 'fisioteràpia respiratòria infantil', 'fisioterapia respiratoria infantil'),
    'psi': ('Psicologia', 'Psicología', 'serveis/psicologia.html', 'es/servicios/psicologia.html', 'psicologia', 'psicología'),
    'pod': ('Podologia', 'Podología', 'serveis/podologia.html', 'es/servicios/podologia.html', 'podologia', 'podología'),
    'nut': ('Nutrició', 'Nutrición', 'serveis/nutricio.html', 'es/servicios/nutricion.html', 'nutrició', 'nutrición'),
    'est': ('Medicina estètica', 'Medicina estética', 'serveis/medicina-estetica.html', 'es/servicios/medicina-estetica.html', 'medicina estètica', 'medicina estética'),
    'esp': ('Revisions esportives', 'Revisiones deportivas', 'serveis/revisions-esportives.html', 'es/servicios/revisiones-deportivas.html', 'les revisions esportives', 'las revisiones deportivas'),
    'tel': ('Telemedicina', 'Telemedicina', 'serveis/telemedicina.html', 'es/servicios/telemedicina.html', 'telemedicina', 'telemedicina'),
    'crc': ('Centre de reconeixement de conductors', 'Centro de reconocimiento de conductores', 'centre-reconeixement-conductors/index.html', 'es/centro-reconocimiento-conductores/index.html', 'els reconeixements de conductors', 'los reconocimientos de conductores'),
}

def llista(xs, es):
    i = ' y ' if es else ' i '
    return xs[0] if len(xs) == 1 else ', '.join(xs[:-1]) + i + xs[-1]

def faqs(k, es):
    ls, nom = MUT.get(k, []), SV[k][5 if es else 4]
    if es:
        q1 = '¿Puedo venir con mi mutua?'
        a1 = (f'Sí. Para {nom} trabajamos con {llista(ls, True)}. También puedes venir como paciente privado.' if ls
              else f'Por ahora, para {nom} solo atendemos de forma privada.')
        q2, a2 = '¿Dónde estáis?', 'En la calle de la Muralla, 2, 1.ª planta (con ascensor), en el centro de Mollerussa, junto a la plaza del Ayuntamiento. Muy a mano si vienes de cualquier pueblo del Pla d\'Urgell.'
        q3 = '¿Qué horario tenéis?'
        a3 = ('El centro de reconocimiento de conductores atiende los martes y jueves de 18.30 a 20.30 h, con cita previa.' if k == 'crc'
              else 'De lunes a viernes, de 8 a 20 h, siempre con cita previa.')
    else:
        q1 = 'Puc venir amb la meva mútua?'
        a1 = (f'Sí. Per a {nom} treballem amb {llista(ls, False)}. També pots venir com a pacient privat.' if ls
              else f'De moment, per a {nom} només atenem de manera privada.')
        q2, a2 = 'On sou?', 'Al carrer de la Muralla, 2, 1a planta (amb ascensor), al centre de Mollerussa, a tocar de la plaça de l\'Ajuntament. Molt a mà si véns de qualsevol poble del Pla d\'Urgell.'
        q3 = 'Quin horari teniu?'
        a3 = ('El centre de reconeixement de conductors atén dimarts i dijous de 18.30 a 20.30 h, amb cita prèvia.' if k == 'crc'
              else 'De dilluns a divendres, de 8 a 20 h, sempre amb cita prèvia.')
    return [(q1, a1), (q2, a2), (q3, a3)]

E = lambda s: html.escape(s, quote=True)
U = lambda s: html.unescape(re.sub(r'<[^>]+>', '', s)).strip()

# ---------- pàgines de servei ----------
canvis = 0
for f in sorted(glob.glob('**/*.html', recursive=True)):
    if f.startswith(('area/', 'tools/')): continue
    s = open(f, encoding='utf-8').read(); o = s
    m = re.search(r'data-mut="(\w+)"', s)
    if not m or m.group(1) not in SV: continue
    k = m.group(1); es = f.startswith('es/')
    ls = MUT.get(k, [])
    txt = ' · '.join(['Privado' if es else 'Privat'] + ls)
    s = re.sub(r'(<p class="muted small" data-mut="' + k + r'">)(.*?)(</p>)', lambda x: x.group(1) + E(txt) + x.group(3), s)
    # enllaç a la pàgina de mútues
    depth = f.count('/') - (1 if es else 0)
    murl = '../' * depth + ('mutuas.html' if es else 'mutues.html')
    if 'class="mutlink' not in s:
        s = re.sub(r'(data-mut="' + k + r'">.*?</p>)', lambda x: x.group(1) + f'<a class="mutlink small" href="{murl}">' + ('Todas las mutuas' if es else 'Totes les mútues') + '</a>', s, count=1)
    # preguntes freqüents
    fm = re.search(r'<div class="faq">(.*?)</div>', s, re.S)
    if fm:
        inner = re.sub(r'<details data-auto>.*?</details>', '', fm.group(1), flags=re.S)
        inner = re.sub(r'<details><summary>[^<]*(?:mútua|mutua)[^<]*</summary>.*?</details>', '', inner, flags=re.S)
        inner += ''.join(f'<details data-auto><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in faqs(k, es))
        s = s[:fm.start(1)] + inner + s[fm.end(1):]
        qa = [(U(q), U(a)) for q, a in re.findall(r'<summary>(.*?)</summary><p>(.*?)</p>', inner, re.S)]
        ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qa]}
        s, n = re.subn(r'<script type="application/ld\+json">\{"@context": "https://schema.org", "@type": "FAQPage".*?</script>',
                       lambda x: '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>', s, count=1, flags=re.S)
        if not n: s = s.replace('</head>', '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>\n</head>', 1)
    if s != o:
        open(f, 'w', encoding='utf-8').write(s); canvis += 1

# ---------- pàgina de mútues ----------
def cos(es):
    out = []
    for k, (ca, esn, pca, pes, *_ ) in SV.items():
        ls = MUT.get(k, [])
        url = pes.replace('es/', '', 1) if es else pca
        nom = esn if es else ca
        chips = ''.join(f'<li>{E(x)}</li>' for x in ls) if ls else ''
        priv = ('Privado' if es else 'Privat')
        out.append(f'<section class="mutsv"><h2 class="h3"><a href="{url}">{E(nom)}</a></h2>'
                   + (f'<ul class="mutchips"><li class="pv">{priv}</li>{chips}</ul>' if ls else
                      f'<p class="muted">{"Solo privado, por ahora." if es else "Només privat, de moment."}</p>') + '</section>')
    return '\n'.join(out)

for f, es in [('mutues.html', False), ('es/mutuas.html', True)]:
    if not os.path.exists(f): continue
    s = open(f, encoding='utf-8').read()
    s2 = re.sub(r'(<!--mutues:inici-->).*?(<!--mutues:fi-->)', lambda x: x.group(1) + '\n' + cos(es) + '\n' + x.group(2), s, flags=re.S)
    if s2 != s: open(f, 'w', encoding='utf-8').write(s2); canvis += 1

# validació
for f in glob.glob('**/*.html', recursive=True):
    if f.startswith('area/'): continue
    for blk in re.findall(r'<script type="application/ld\+json">(.*?)</script>', open(f, encoding='utf-8').read(), re.S):
        json.loads(blk)
print(f'{canvis} fitxers actualitzats')
