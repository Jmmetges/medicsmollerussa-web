#!/usr/bin/env python3
"""Genera el quadre mèdic a partir de dades/quadre.json.

- quadre-medic.html i es/cuadro-medico.html (llista per servei, amb dades estructurades)
- Bloc «Professionals» a cada pàgina de servei i del CRC
S'executa sol amb GitHub Actions quan canvia dades/quadre.json. També a mà: python3 tools/quadre.py
"""
import glob, html, json, os, re, unicodedata

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
E = lambda s: html.escape(s, quote=True)
PROS = [p for p in json.load(open('dades/quadre.json', encoding='utf-8'))['professionals'] if p.get('visible', True)]

SV = {  # clau: (català, castellano, pàgina ca, página es)
    'fam': ('Medicina de família', 'Medicina de familia', 'serveis/medicina-familia.html', 'es/servicios/medicina-familia.html'),
    'ped': ('Pediatria', 'Pediatría', 'serveis/pediatria.html', 'es/servicios/pediatria.html'),
    'inf': ('Infermeria', 'Enfermería', 'serveis/infermeria.html', 'es/servicios/enfermeria.html'),
    'lab': ('Analítiques', 'Análisis clínicos', 'serveis/analitiques.html', 'es/servicios/analisis-clinicos.html'),
    'fis': ('Fisioteràpia', 'Fisioterapia', 'serveis/fisioterapia.html', 'es/servicios/fisioterapia.html'),
    'fri': ('Fisioteràpia respiratòria infantil', 'Fisioterapia respiratoria infantil', 'serveis/fisioterapia-respiratoria-infantil.html', 'es/servicios/fisioterapia-respiratoria-infantil.html'),
    'psi': ('Psicologia', 'Psicología', 'serveis/psicologia.html', 'es/servicios/psicologia.html'),
    'pod': ('Podologia', 'Podología', 'serveis/podologia.html', 'es/servicios/podologia.html'),
    'nut': ('Nutrició', 'Nutrición', 'serveis/nutricio.html', 'es/servicios/nutricion.html'),
    'est': ('Medicina estètica', 'Medicina estética', 'serveis/medicina-estetica.html', 'es/servicios/medicina-estetica.html'),
    'esp': ('Revisions esportives', 'Revisiones deportivas', 'serveis/revisions-esportives.html', 'es/servicios/revisiones-deportivas.html'),
    'tel': ('Telemedicina', 'Telemedicina', 'serveis/telemedicina.html', 'es/servicios/telemedicina.html'),
    'rml': ('Reconeixements mèdics laborals', 'Reconocimientos médicos laborales', 'serveis/reconeixements-medics-laborals.html', 'es/servicios/reconocimientos-medicos-laborales.html'),
    'crc': ('Centre de reconeixement de conductors', 'Centro de reconocimiento de conductores', 'centre-reconeixement-conductors/index.html', 'es/centro-reconocimiento-conductores/index.html'),
}

def slug(s):
    s = unicodedata.normalize('NFD', re.sub(r'^Dra?\.\s*', '', s)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def inicials(nom):
    parts = [w for w in re.sub(r'^Dra?\.\s*', '', nom).split() if w[0].isupper()]
    return (parts[0][0] + (parts[1][0] if len(parts) > 1 else '')).upper()

def rel(frm, to):
    return os.path.relpath(to, os.path.dirname(frm) or '.')

def fitxa(p, es, frm):
    t = p['titol_es' if es else 'titol_ca']
    col = f'<span class="col">{"N.º col." if es else "Núm. col."} {E(p["colegiat"])}</span>' if p.get('colegiat') else ''
    svs = ' · '.join(f'<a href="{rel(frm, SV[k][3 if es else 2])}">{E(SV[k][1 if es else 0])}</a>' for k in p['serveis'] if k in SV)
    return (f'<article class="pro" id="{slug(p["nom"])}"><span class="av" aria-hidden="true">{inicials(p["nom"])}</span>'
            f'<div><h3>{E(p["nom"])}</h3><p class="pt">{E(t)}</p>{col}<p class="ps">{svs}</p></div></article>')

def cos(es, frm):
    out = []
    for k, v in SV.items():
        ps = [p for p in PROS if k in p['serveis']]
        if not ps: continue
        out.append(f'<section class="qsv"><h2 class="h3"><a href="{rel(frm, v[3 if es else 2])}">{E(v[1 if es else 0])}</a></h2><div class="pros">'
                   + ''.join(fitxa(p, es, frm) for p in ps) + '</div></section>')
    return '\n'.join(out)

def ld(es, url):
    items = []
    for i, p in enumerate(PROS, 1):
        person = {"@type": "Person", "name": p['nom'], "jobTitle": p['titol_es' if es else 'titol_ca'],
                  "worksFor": {"@id": "https://medicsmollerussa.com/#centre"},
                  "url": f"https://medicsmollerussa.com/{url}#{slug(p['nom'])}"}
        if p.get('colegiat'):
            person["identifier"] = {"@type": "PropertyValue", "propertyID": "Núm. col·legiat", "value": p['colegiat']}
        items.append({"@type": "ListItem", "position": i, "item": person})
    return {"@context": "https://schema.org", "@type": "ItemList", "name": "Quadre mèdic" if not es else "Cuadro médico", "itemListElement": items}

canvis = 0
for f, es in [('quadre-medic.html', False), ('es/cuadro-medico.html', True)]:
    if not os.path.exists(f): continue
    s = open(f, encoding='utf-8').read(); o = s
    s = re.sub(r'(<!--quadre:inici-->).*?(<!--quadre:fi-->)', lambda m: m.group(1) + '\n' + cos(es, f) + '\n' + m.group(2), s, flags=re.S)
    j = '<script type="application/ld+json" data-quadre>' + json.dumps(ld(es, f), ensure_ascii=False) + '</script>'
    s, n = re.subn(r'<script type="application/ld\+json" data-quadre>.*?</script>', lambda m: j, s, flags=re.S)
    if not n: s = s.replace('</head>', j + '\n</head>', 1)
    if s != o: open(f, 'w', encoding='utf-8').write(s); canvis += 1

# bloc a les pàgines de servei (i a totes les del CRC)
pagines = {}
for k, v in SV.items():
    pagines[v[2]] = (k, False); pagines[v[3]] = (k, True)
for f in glob.glob('centre-reconeixement-conductors/*.html'): pagines[f] = ('crc', False)
for f in glob.glob('es/centro-reconocimiento-conductores/*.html'): pagines[f] = ('crc', True)
for f, (k, es) in pagines.items():
    if not os.path.exists(f): continue
    s = open(f, encoding='utf-8').read(); o = s
    s = re.sub(r'<section class="qpros"[^>]*>.*?</section>', '', s, flags=re.S)
    ps = [p for p in PROS if k in p['serveis']]
    if ps:
        q = rel(f, 'es/cuadro-medico.html' if es else 'quadre-medic.html')
        noms = ''.join(f'<li><a href="{q}#{slug(p["nom"])}"><span class="av" aria-hidden="true">{inicials(p["nom"])}</span><span><b>{E(p["nom"])}</b><small>{E(p["titol_es" if es else "titol_ca"])}</small></span></a></li>' for p in ps)
        blk = (f'<section class="qpros" data-auto><h2>{"Quién te atiende" if es else "Qui et visita"}</h2><ul>{noms}</ul>'
               f'<a class="small" href="{q}">{"Ver todo el cuadro médico" if es else "Veure tot el quadre mèdic"}</a></section>')
        s = re.sub(r'(<article class="prose">)', lambda m: m.group(1) + blk, s, count=1)
    if s != o: open(f, 'w', encoding='utf-8').write(s); canvis += 1
print(f'{canvis} fitxers actualitzats')
