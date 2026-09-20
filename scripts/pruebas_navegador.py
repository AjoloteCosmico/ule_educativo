#!/usr/bin/env python3
"""Pruebas de navegador de ule educativo (Playwright + Chromium).

Requisitos (sólo para desarrollo; el sitio en sí no usa npm ni build):
    pip install playwright && playwright install chromium

Uso (desde la raíz del repo):
    python3 scripts/pruebas_navegador.py

Levanta su propio servidor y publica el repo bajo el subpath /ule_educativo/, igual que
GitHub Pages, así que también verifica que todas las rutas sean relativas.

Cubre:
  1. Comportamiento: deep links, diálogo (nombre accesible, Escape, foco), filtros,
     estados vacíos/error, relaciones bibliografía ↔ artículos, anuncios, tema.
  2. Modo API: fuerza ULE.config.dataSource='api' contra un API simulado y comprueba que
     ninguna página ni componente cambia (criterio de cierre de la Fase 1), incluyendo
     404, error 500 y caída de red.
No sustituye una revisión con lector de pantalla ni un análisis de contraste sobre el sitio
publicado (ver docs/primera_fase.md §8).
"""
import atexit, json, os, re, shutil, subprocess, sys, tempfile, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_tmp = tempfile.mkdtemp()
os.symlink(ROOT, os.path.join(_tmp, 'ule_educativo'))
PORT = int(os.environ.get('ULE_TEST_PORT', '8765'))
_srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=_tmp, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
atexit.register(lambda: (_srv.terminate(), shutil.rmtree(_tmp, ignore_errors=True)))
time.sleep(1.2)
BASE = f'http://localhost:{PORT}/ule_educativo/'
ROOT = ROOT + '/'
TOTAL = []
PNG=bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a5f645400000000049454e44ae426082')
res=[]
def check(name,cond,detail=''):
    res.append((name,bool(cond),detail)); print(('PASS ' if cond else 'FAIL ')+name+(' -> '+str(detail) if (detail!='' ) else ''))
def setup(pg):
    def route(r):
        u=r.request.url
        if u.startswith('http://localhost'): r.continue_()
        elif r.request.resource_type=='image': r.fulfill(status=200,content_type='image/png',body=PNG)
        elif 'fonts.googleapis' in u: r.fulfill(status=200,content_type='text/css',body='')
        else: r.abort()
    pg.route('**/*',route)
with sync_playwright() as p:
    b=p.chromium.launch()
    def new(w=1280,h=800,**kw):
        ctx=b.new_context(viewport={'width':w,'height':h},**kw); pg=ctx.new_page(); setup(pg)
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.errs=errs
        return ctx,pg
    # ---- Deep links
    cases=[('catalogos.html?catalogo=canchas-modernas&pieza=cancha-002','canchas-modernas','Cancha de Mazatlán'),
           ('catalogos.html?catalogo=piezas-arqueologicas&pieza=pieza-003','piezas-arqueologicas',None),
           ('catalogos.html?pieza=cancha-001','canchas-modernas',None),
           ('catalogos.html?catalogo=canchas-modernas','canchas-modernas','NOABRE'),
           ('catalogos.html?catalogo=../anuncios','piezas-arqueologicas','NOABRE'),
           ('catalogos.html?catalogo=canchas-modernas&pieza=zzz','canchas-modernas','NOABRE')]
    for q,esperado_cat,titulo in cases:
        ctx,pg=new(); pg.goto(BASE+q,wait_until='networkidle'); pg.wait_for_timeout(500)
        st=pg.evaluate("""()=>{const d=document.querySelector('dialog');return {open:d?d.open:false,sel:document.getElementById('selector-catalogo').value,title:d&&d.open?d.querySelector('h3').textContent:null,aviso:document.getElementById('catalogo-aviso').textContent}}""")
        ok=st['sel']==esperado_cat and (st['open']==(titulo!='NOABRE'))
        check('deep link '+q,ok,st); ctx.close()
    # ---- Diálogo y teclado
    ctx,pg=new(); pg.goto(BASE+'catalogos.html',wait_until='networkidle'); pg.wait_for_timeout(400)
    btn=pg.locator('.catalog-card__abrir').first
    check('card: cursor pointer',btn.evaluate("e=>getComputedStyle(e.closest('.catalog-card')).cursor")=='pointer')
    check('card: es <article> sin role inválido',pg.evaluate("(()=>{const c=document.querySelector('.catalog-card');return c.tagName+':'+c.getAttribute('role')})()")=='ARTICLE:null')
    check('card: título es button con aria-haspopup',pg.evaluate("(()=>{const b=document.querySelector('.catalog-card h3 button');return !!b&&b.getAttribute('aria-haspopup')==='dialog'})()"))
    pg.keyboard.press('Tab')  # skip link
    # tab hasta el primer botón de card
    for _ in range(40):
        if pg.evaluate("document.activeElement.classList.contains('catalog-card__abrir')"): break
        pg.keyboard.press('Tab')
    check('teclado: Tab llega al botón de la card',pg.evaluate("document.activeElement.classList.contains('catalog-card__abrir')"))
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    d=pg.evaluate("""()=>{const d=document.querySelector('dialog');const id=d.getAttribute('aria-labelledby');return {open:d.open,name:id&&document.getElementById(id).textContent,focusIn:d.contains(document.activeElement),url:location.search}}""")
    check('diálogo abre con Enter y tiene nombre accesible',d['open'] and d['name'] and d['focusIn'],d)
    check('URL refleja catalogo y pieza',('catalogo=' in d['url']) and ('pieza=' in d['url']),d['url'])
    m=pg.evaluate("(()=>{const b=document.querySelector('dialog').getBoundingClientRect();return {l:Math.round(b.left),r:Math.round(innerWidth-b.right)}})()")
    check('diálogo centrado horizontalmente (el reset no anula margin:auto)',abs(m['l']-m['r'])<=1 and m['l']>0,m)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    after=pg.evaluate("({open:document.querySelector('dialog').open,url:location.search,focusBtn:document.activeElement.classList.contains('catalog-card__abrir')})")
    check('Escape cierra, quita pieza y devuelve foco al botón',(not after['open']) and 'pieza=' not in after['url'] and after['focusBtn'],after)
    check('sin aria-live envolviendo el catálogo',pg.evaluate("document.getElementById('catalogo-contenido').getAttribute('aria-live')")is None)
    # clic en la imagen (overlay) abre
    img=pg.locator('.catalog-card__imagen').nth(1); img.scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    bb=img.bounding_box(); pg.mouse.click(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.wait_for_timeout(300)
    check('clic en la imagen abre el detalle (stretched button)',pg.evaluate("document.querySelector('dialog').open"))
    pg.keyboard.press('Escape')
    # ---- Filtros
    st0=pg.evaluate("document.querySelector('.catalog-status').textContent")
    check('estado inicial informa total',st0.strip()!='',st0)
    boxes=pg.locator('[data-catalog-filters] input[type=checkbox]')
    boxes.nth(0).check(); pg.wait_for_timeout(150)
    st1=pg.evaluate("document.querySelector('.catalog-status').textContent")
    check('estado muestra filtros activos y conteo',('Filtros activos' in st1) and ('de' in st1),st1)
    # combinación sin resultados: preclasico + maya
    labels=pg.evaluate("[...document.querySelectorAll('[data-catalog-filters] input')].map(i=>i.value)")
    boxes.nth(labels.index('maya')).check(); pg.wait_for_timeout(150)
    empty=pg.evaluate("(()=>{const e=document.querySelector('.catalog-empty');return e?{t:e.textContent,btn:!!e.querySelector('button')}:null})()")
    check('cero resultados: mensaje informativo + botón limpiar',empty and empty['btn'] and 'filtros' in empty['t'].lower(),empty)
    pg.locator('.catalog-empty button').click(); pg.wait_for_timeout(150)
    after=pg.evaluate("({cards:document.querySelectorAll('.catalog-card').length,checked:document.querySelectorAll('[data-catalog-filters] input:checked').length,focus:document.activeElement.type})")
    check('limpiar restablece todo y deja el foco en un filtro',after['cards']==6 and after['checked']==0 and after['focus']=='checkbox',after)
    check('sin errores JS en catálogo',not pg.errs,pg.errs); ctx.close()
    # ---- Bibliografía
    ctx,pg=new(); pg.goto(BASE+'bibliografia.html',wait_until='networkidle'); pg.wait_for_timeout(500)
    rel=pg.evaluate("""()=>[...document.querySelectorAll('biblio-card')].filter(c=>c.shadowRoot.querySelector('.relacionados')).map(c=>({id:c.dataset.id,links:[...c.shadowRoot.querySelectorAll('.relacionados a')].map(a=>a.textContent+' -> '+a.getAttribute('href'))}))""")
    check('"Aparece en" lista artículos con enlace',rel and all(x['links'] for x in rel),rel)
    lab=pg.evaluate("[...new Set([...document.querySelectorAll('biblio-card')].map(c=>c.shadowRoot.querySelector('ule-badge').getAttribute('label')))]")
    check('etiquetas de tipo legibles',not any('_' in l for l in lab),lab)
    opts=pg.evaluate("[...document.querySelectorAll('#tipo-bibliografia option')].map(o=>o.textContent)")
    check('select de tipo legible',not any('_' in o for o in opts),opts)
    hs=pg.evaluate("[...document.querySelectorAll('biblio-card')].map(c=>c.shadowRoot.querySelector('.titulo').tagName)")
    check('títulos de cards son h2 bajo h1',set(hs)=={'H2'},set(hs))
    ctx.close()
    # ---- Artículos
    ctx,pg=new(); pg.goto(BASE+'articulos.html',wait_until='networkidle'); pg.wait_for_timeout(400)
    hs=pg.evaluate("[...document.querySelectorAll('article-card')].map(c=>c.shadowRoot.querySelector('.titulo').tagName)")
    check('article-card h2 en listado',set(hs)=={'H2'} and len(hs)==4,hs)
    pg.fill('#buscar-articulos','zzzz'); pg.wait_for_timeout(200)
    check('búsqueda sin resultados informa',pg.evaluate("document.querySelector('#articulos-grid .catalog-empty')!==null")); ctx.close()
    # ---- Artículo
    ctx,pg=new(); pg.goto(BASE+'articulo.html?id=articulo-002',wait_until='networkidle'); pg.wait_for_timeout(500)
    info=pg.evaluate("""()=>({h:[...document.querySelectorAll('h1,h2,h3')].map(h=>h.tagName+':'+h.textContent.slice(0,25)),nav:[...document.querySelectorAll('#navegacion-articulos a')].map(a=>a.getAttribute('href')),navTag:document.getElementById('navegacion-articulos').tagName,biblio:document.querySelectorAll('biblio-card').length,ad:document.querySelectorAll('[data-ad-slot] ad-card').length,title:document.title,imgAlt:document.querySelector('.articulo img')&&document.querySelector('.articulo img').alt})""")
    check('artículo: h1→h2 sin saltos',info['h'][0].startswith('H1') and not any(h.startswith('H3') for h in info['h']),info['h'])
    check('artículo: prev/next en <nav>',info['navTag']=='NAV' and len(info['nav'])==2,info['nav'])
    check('artículo: bibliografía y anuncio al final',info['biblio']==2 and info['ad']==1,(info['biblio'],info['ad']))
    check('artículo: título de pestaña',info['title'].endswith('ule educativo'),info['title'])
    ctx.close()
    for q,esperado in [('articulo.html?id=noexiste','Artículo no encontrado'),('articulo.html','Artículo no especificado')]:
        ctx,pg=new(); pg.goto(BASE+q,wait_until='networkidle'); pg.wait_for_timeout(300)
        check('estado vacío con h1: '+q,pg.evaluate("document.querySelector('h1')&&document.querySelector('h1').textContent")==esperado); ctx.close()
    # inyección: id con HTML no se interpreta
    ctx,pg=new(); pg.goto(BASE+'articulo.html?id=%3Cimg%20src=x%20onerror=alert(1)%3E',wait_until='networkidle'); pg.wait_for_timeout(300)
    check('id malicioso no inyecta HTML',pg.evaluate("document.querySelectorAll('#articulo-contenedor img').length")==0); ctx.close()
    # ---- Home
    ctx,pg=new(); pg.goto(BASE+'index.html',wait_until='networkidle'); pg.wait_for_timeout(500)
    h=pg.evaluate("({cards:document.querySelectorAll('.accesos-grid a.card-link').length,recent:document.querySelectorAll('#articulos-recientes article-card').length,greca:[...document.querySelectorAll('.greca')].every(g=>g.getAttribute('aria-hidden')==='true'),btnBg:getComputedStyle(document.querySelector('.card-link .button')).backgroundColor})")
    check('home: 3 accesos, 3 recientes, grecas ocultas a AT',h['cards']==3 and h['recent']==3 and h['greca'],h)
    ctx.close()
    # ---- Anuncios: sección oculta si no hay anuncio y ruta única por loader
    ctx,pg=new(); 
    reqs=[]; pg.on('request',lambda r:reqs.append(r.url) if 'anuncios.json' in r.url else None)
    pg.goto(BASE+'index.html',wait_until='networkidle'); pg.wait_for_timeout(400)
    check('anuncios se piden una sola vez (vía loader, con caché)',len(reqs)==1,reqs); ctx.close()
    # ---- Sección de anuncios oculta cuando no hay anuncio para la página
    ctx,pg=new(); pg.route('**/data/anuncios.json',lambda r:r.fulfill(status=200,content_type='application/json',body='{"anuncios":[]}'))
    pg.goto(BASE+'articulo.html?id=articulo-001',wait_until='networkidle'); pg.wait_for_timeout(500)
    vis=pg.evaluate("(()=>{const s=document.querySelector('.ad-section');return getComputedStyle(s).display})()")
    check('sin anuncios: la sección "Comunidad" no ocupa espacio',vis=='none',vis); ctx.close()
    # prev/next oculto si sólo hay 1 artículo
    ctx,pg=new(); pg.route('**/data/articulos/index.json',lambda r:r.fulfill(status=200,content_type='application/json',body='["articulo-001.json"]'))
    pg.goto(BASE+'articulo.html?id=articulo-001',wait_until='networkidle'); pg.wait_for_timeout(400)
    check('sin vecinos: nav de artículos oculto',pg.evaluate("getComputedStyle(document.getElementById('navegacion-articulos')).display")=='none'); ctx.close()
    # ---- Tema: persistencia
    ctx,pg=new(); pg.goto(BASE+'index.html',wait_until='networkidle'); pg.click('#theme-toggle'); pg.reload(wait_until='networkidle')
    check('tema oscuro persiste tras recargar',pg.evaluate("document.documentElement.dataset.theme")=='dark'); ctx.close()
    # ---- Nav consistente
    labs=set()
    for u in ['index.html','articulos.html','articulo.html','bibliografia.html','catalogos.html']:
        ctx,pg=new(); pg.goto(BASE+u,wait_until='domcontentloaded'); labs.add(tuple(pg.evaluate("[...document.querySelectorAll('header .nav__link')].map(a=>a.textContent)"))); ctx.close()
    check('nav idéntica en las 5 páginas',len(labs)==1,labs)
    b.close()
TOTAL.extend(r[1] for r in res)
print('\nComportamiento: %d/%d'%(sum(1 for r in res if r[1]),len(res)))

PNG=bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360606060000000050001a5f645400000000049454e44ae426082')
L=lambda p: json.load(open(ROOT+p,encoding='utf-8'))
arts=[L(f'data/articulos/{f}') for f in L('data/articulos/index.json')]
refs=[L(f'data/bibliografia/{f}') for f in L('data/bibliografia/index.json')]
cats={f[:-5]:L(f'data/catalogos/{f}') for f in L('data/catalogos/index.json')}
ads=L('data/anuncios.json')['anuncios']
CORS={'access-control-allow-origin':'*'}
def mock(mode):
    def handler(r):
        path=re.sub(r'^.*?/api','',r.request.url.split('?')[0])
        def j(o,st=200): r.fulfill(status=st,headers=CORS,content_type='application/json',body=json.dumps(o))
        if mode=='down': return r.abort()
        if mode=='500': return j({'error':'boom'},500)
        if path=='/articulos': return j({'items':arts+[dict(arts[0],id='articulo-999',titulo='BORRADOR',visible=False)]})  # envoltorio {items:[]} + un borrador
        if path.startswith('/articulos/'):
            a=[x for x in arts if x['id']==path.split('/')[-1]]; return j(a[0]) if a else j({},404)
        if path=='/bibliografia': return j({'data':refs})         # envoltorio {data:[]}
        if path=='/catalogos': return j([{'id':k} for k in cats])
        if path.startswith('/catalogos/'):
            c=cats.get(path.split('/')[-1]); return j(c) if c else j({},404)
        if path=='/anuncios': return j(ads)
        j({},404)
    return handler
out=[]
def check(n,c,d=''): out.append(c); print(('PASS ' if c else 'FAIL ')+n+(' -> '+str(d) if d!='' else ''))
with sync_playwright() as p:
    b=p.chromium.launch()
    def page(mode,url,w=1280):
        ctx=b.new_context(viewport={'width':w,'height':800}); ctx.add_init_script("window.ULE={config:{dataSource:'api',apiBaseUrl:'http://localhost:8766/api'}};")
        pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.errs=errs
        def route(r):
            u=r.request.url
            if ':8766' in u: mock(mode)(r)
            elif u.startswith('http://localhost'):
                if '/data/' in u: errs.append('LEE data/ LOCAL EN MODO API: '+u.split('/ule_educativo/')[-1]); 
                r.continue_()
            elif r.request.resource_type=='image': r.fulfill(status=200,content_type='image/png',body=PNG)
            elif 'fonts.googleapis' in u: r.fulfill(status=200,content_type='text/css',body='')
            else: r.abort()
        pg.route('**/*',route); pg.goto(BASE+url,wait_until='networkidle'); pg.wait_for_timeout(600); return ctx,pg
    # --- API OK
    ctx,pg=page('ok','index.html'); check('API ok · home: 3 recientes + anuncio',pg.evaluate("document.querySelectorAll('#articulos-recientes article-card').length")==3 and pg.evaluate("document.querySelectorAll('[data-ad-slot] ad-card').length")==1,pg.errs); ctx.close()
    ctx,pg=page('ok','articulos.html'); check('API ok · articulos (envoltorio {items}) y borradores (visible:false) ocultos',pg.evaluate("document.querySelectorAll('article-card').length")==4,pg.errs); ctx.close()
    ctx,pg=page('ok','bibliografia.html'); check('API ok · bibliografía (envoltorio {data}) + relaciones',pg.evaluate("document.querySelectorAll('biblio-card').length")==13 and pg.evaluate("[...document.querySelectorAll('biblio-card')].some(c=>c.shadowRoot.querySelectorAll('.relacionados a').length>0)"),pg.errs); ctx.close()
    ctx,pg=page('ok','catalogos.html?catalogo=canchas-modernas&pieza=cancha-002'); check('API ok · catálogo + deep link a pieza (sin carrera)',pg.evaluate("document.querySelector('dialog')&&document.querySelector('dialog').open")==True and pg.evaluate("document.getElementById('selector-catalogo').value")=='canchas-modernas',pg.errs); ctx.close()
    ctx,pg=page('ok','articulo.html?id=articulo-001'); check('API ok · artículo + bibliografía + prev/next',pg.evaluate("document.querySelector('h1').textContent")!='' and pg.evaluate("document.querySelectorAll('biblio-card').length")==2,pg.errs); ctx.close()
    # --- 404
    ctx,pg=page('ok','articulo.html?id=noexiste'); check('API 404 · "Artículo no encontrado" (igual que en local)',pg.evaluate("document.querySelector('h1').textContent")=='Artículo no encontrado',pg.errs); ctx.close()
    ctx,pg=page('ok','catalogos.html?catalogo=noexiste'); check('API 404 catálogo desconocido → cae al primero',pg.evaluate("document.getElementById('selector-catalogo').value")=='piezas-arqueologicas' and pg.evaluate("document.querySelectorAll('.catalog-card').length")==6); ctx.close()
    # --- 500 / caída
    for mode in ['500','down']:
        for u,sel,label in [('articulos.html','#articulos-grid .catalog-empty','artículos'),('bibliografia.html','#bibliografia-list .catalog-empty','bibliografía'),('catalogos.html','#catalogo-contenido .catalog-empty','catálogos'),('articulo.html?id=articulo-001','#articulo-contenedor .catalog-empty','artículo'),('index.html','#articulos-recientes .catalog-empty','home')]:
            ctx,pg=page(mode,u); t=pg.evaluate(f"(document.querySelector('{sel}')||{{}}).textContent")
            check(f'API {mode} · {label}: muestra error (no queda en "Cargando…")',t and 'Cargando' not in t and 'No fue posible' in t,(t or '')[:70]); ctx.close()
    # --- Sin lecturas locales en modo API
    ctx,pg=page('ok','catalogos.html'); check('API ok · ninguna página lee data/ directamente',not [e for e in pg.errs if 'LEE data/' in e],pg.errs); ctx.close()
    b.close()
TOTAL.extend(out)
print('\nModo API: %d/%d'%(sum(out),len(out)))

print('\nTOTAL: %d/%d'%(sum(TOTAL),len(TOTAL)))
sys.exit(0 if all(TOTAL) else 1)
