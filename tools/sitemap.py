#!/usr/bin/env python3
"""Genera sitemap.xml i robots.txt amb totes les pàgines indexables (versions ca/es). Ús: python3 tools/sitemap.py"""
import os; os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import glob,re,datetime
today=datetime.date.today().isoformat()
pages=sorted(f for f in glob.glob('**/*.html',recursive=True) if not f.startswith('area/') and not f.startswith('tools/') and f!='404.html')
out=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
n=0
for f in pages:
    s=open(f,encoding='utf-8').read()
    if 'noindex' in s: continue
    can=re.search(r'<link rel="canonical" href="([^"]+)"',s).group(1)
    alts=re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"',s)
    out.append('  <url>'); out.append(f'    <loc>{can}</loc>'); out.append(f'    <lastmod>{today}</lastmod>')
    for l,h in alts: out.append(f'    <xhtml:link rel="alternate" hreflang="{l}" href="{h}"/>')
    out.append('  </url>'); n+=1
out.append('</urlset>')
open('sitemap.xml','w',encoding='utf-8').write('\n'.join(out)+'\n')
open('robots.txt','w').write('User-agent: *\nAllow: /\nDisallow: /area/\nDisallow: /tools/\n\nSitemap: https://medicsmollerussa.com/sitemap.xml\n')
print(n)
