// Comprobación posterior a la fase 2. Uso:  node fase2/comprobar.js
// Necesita Playwright: PW=C:/Users/javiv/el-impostor/node_modules/playwright node fase2/comprobar.js
const { chromium } = require(process.env.PW || 'playwright');
const D = 'https://puntostudio.es';
let fallos = 0;
const ok = (c, m, extra = '') => { console.log((c ? 'OK     ' : 'FALLO  ') + m + (extra ? '  → ' + extra : '')); if (!c) fallos++; };

(async () => {
  // 1) Cada ruta nueva carga, con su título y su manifest (la "puerta" de la fase 1 usa estos manifest.json)
  const rutas = [
    ['/', 'Punto Studio'], ['/privacidad/', 'Privacidad'], ['/soporte/', 'Soporte'],
    ['/punto-falso/', 'Punto Falso'], ['/punto-falso/beta/', 'beta'],
    ['/punto-ciego/', 'Punto Ciego'], ['/punto-ciego/beta/', 'beta'],
    ['/punto-falso/privacidad.html', 'Privacidad'], ['/punto-ciego/soporte.html', 'Soporte'],
  ];
  for (const [r, t] of rutas) {
    const res = await fetch(D + r).catch(e => ({ status: 0, text: async () => '' }));
    const txt = await res.text();
    ok(res.status === 200 && txt.includes(t), `${r} responde 200 y contiene «${t}»`, 'HTTP ' + res.status);
  }
  for (const r of ['/punto-falso/', '/punto-falso/beta/', '/punto-ciego/', '/punto-ciego/beta/']) {
    const res = await fetch(D + r + 'manifest.json').catch(() => ({ status: 0, headers: new Headers() }));
    ok(res.status === 200 && res.headers.get('access-control-allow-origin') === '*', `${r}manifest.json 200 con CORS *`, 'HTTP ' + res.status);
  }
  // 2) HTTPS, www y http
  for (const [u, esperado, m] of [['http://puntostudio.es/', 'https://puntostudio.es/', 'http → https'], ['https://www.puntostudio.es/', 'https://puntostudio.es/', 'www → raíz'], ['http://www.puntostudio.es/', 'https://puntostudio.es/', 'http://www → https raíz']]) {
    const res = await fetch(u, { redirect: 'follow' }).catch(() => null);
    ok(res && res.url === esperado, m, res ? res.url : 'sin respuesta');
  }
  // 3) Direcciones antiguas con códigos de sala: ruta, query y hash conservados
  const b = await chromium.launch();
  const casos = [
    ['https://javivalmich.github.io/el-impostor/#s=ABCDE', '/punto-falso/#s=ABCDE'],
    ['https://javivalmich.github.io/el-impostor/#j=ABCDE~Ana~Luis&d=1', '/punto-falso/#j=ABCDE~Ana~Luis&d=1'],
    ['https://javivalmich.github.io/el-impostor/soporte.html#borrar-cuenta', '/punto-falso/soporte.html#borrar-cuenta'],
    ['https://javivalmich.github.io/Punto-Ciego/?c=ABCDE', '/punto-ciego/?c=ABCDE'],
    ['https://javivalmich.github.io/Punto-Ciego/beta/?c=ABCDE&pruebas=1', '/punto-ciego/beta/?c=ABCDE&pruebas=1'],
    ['https://javivalmich.github.io/Punto-Ciego/privacidad.html', '/punto-ciego/privacidad.html'],
    ['https://puntostudio.es/el-impostor/?x=1#s=ABCDE', '/punto-falso/?x=1#s=ABCDE'],
    ['https://puntostudio.es/Punto-Ciego/?c=ABCDE', '/punto-ciego/?c=ABCDE'],
  ];
  for (const [desde, hasta] of casos) {
    const p = await (await b.newContext()).newPage();
    await p.goto(desde).catch(() => {});
    await p.waitForTimeout(2500);
    const u = p.url();
    ok(u === D + hasta, `${desde.replace('https://', '')}`, u.replace('https://', ''));
    await p.context().close();
  }
  // 4) Un móvil con la app antigua instalada (SW de la fase 1) acaba en la dirección nueva y sin SW en el origen viejo
  //    (esto solo se puede comprobar de verdad con un móvil/perfil que tuviera la app instalada antes de la mudanza)
  await b.close();
  console.log(fallos ? `\n${fallos} comprobación(es) fallida(s)` : '\nTodo correcto');
  process.exit(fallos ? 1 : 0);
})();
