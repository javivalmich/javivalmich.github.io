# Fase 2: mudanza a puntostudio.es (guion de una sesión)

Estado de partida (fase 1 hecha): los SW/páginas de transición están publicados; el hub está en este repo (sin `CNAME`);
la rama `puntostudio` de cada juego tiene los cambios de contenido; `punto-falso/beta/` ya existe en `el-impostor`.

## Cómo funciona la mudanza (lo que hay que tener presente)

- Al poner el dominio propio en `javivalmich.github.io`, GitHub responde **301** a todo `javivalmich.github.io/*` →
  `puntostudio.es/*` (ruta y query; el navegador conserva el hash). Lo probé con Playwright: un móvil con el SW de producción
  anterior (v11/v8) **con conexión** acaba en la dirección nueva con query y hash; **sin conexión** se queda en la copia
  en caché y se arregla solo la próxima vez que abra con red. El SW viejo no puede actualizarse (el `sw.js` ya redirige),
  así que el SW de la fase 1 solo ayuda a quien abrió la app entre la fase 1 y la fase 2.
- Cuando el repo se llama `punto-ciego`, **no se puede crear otro repo `Punto-Ciego`** (GitHub no distingue mayúsculas).
  Por eso no hay repos stub: el `404.html` de este hub redirige `/el-impostor/…` y `/Punto-Ciego/…` a las rutas nuevas
  conservando query y hash. (Pages sirve el 404 del sitio de usuario a cualquier ruta sin proyecto: se comprueba en la
  sesión, paso 4.)
- Tiempo de 404 real: solo entre renombrar y que Pages reconstruya (1-2 min). El resto del orden está pensado para que
  nada devuelva 404 mientras tanto.

## Antes de la sesión (sin riesgo, hazlo cuanto antes)

1. **DNS en Arsys** (A/AAAA/CNAME www) y **TXT de verificación** en github.com → Settings → Pages → *Add a domain*.
   No tocar MX ni los registros de Resend. Comprueba: `nslookup puntostudio.es` devuelve 185.199.108–111.153.
2. **Supabase → Authentication → URL Configuration**: *añade* (no quites nada) a Redirect URLs:
   `https://puntostudio.es/punto-ciego/`, `https://puntostudio.es/punto-ciego/beta/`,
   `https://puntostudio.es/punto-falso/`, `https://puntostudio.es/punto-falso/beta/`.
   **Site URL no se toca todavía.**
3. (Opcional, recomendado) **Precalentar el certificado**: el HTTPS de un dominio nuevo tarda desde minutos hasta horas en
   emitirse y, mientras, los enlaces antiguos darían error de certificado. Para no pagarlo en la sesión: crea un repo
   desechable `puntostudio-tmp` con un `index.html` cualquiera, Pages activado y dominio `puntostudio.es`; cuando GitHub
   permita *Enforce HTTPS*, quita el dominio de ese repo y bórralo. (No lo he probado: puede que GitHub reemita el
   certificado al moverlo; en el peor caso es igual que no hacerlo.) Esto no afecta a los juegos: solo `tmp` redirige.
4. Decide cuánto esperas desde la fase 1 (recomiendo 2-4 semanas) para que más móviles recojan el SW nuevo.

## La sesión (≈30-60 min con el certificado precalentado; sin precalentar, la espera es el HTTPS)

Todos los comandos con `gh` y `git` se ejecutan desde una terminal con `gh auth status` correcto.

### 0. Red de seguridad
```bash
cd ~/el-impostor && git checkout main && git pull && git tag antes-mudanza && git push origin antes-mudanza
cd "~/Punto ciego" && git checkout main && git pull && git tag antes-mudanza && git push origin antes-mudanza
```
Rollback total en cualquier punto: quitar el dominio del hub (`gh api -X PUT repos/javivalmich/javivalmich.github.io/pages -f cname=`),
y renombrar los repos a sus nombres antiguos.

### 1. Dominio en el hub (a partir de aquí `github.io/*` redirige)
```bash
cd ~/javivalmich.github.io
echo puntostudio.es > CNAME && git add CNAME && git commit -m "Dominio propio puntostudio.es" && git push
gh api -X PUT repos/javivalmich/javivalmich.github.io/pages -f cname=puntostudio.es   # por si el CNAME no basta
```
Esperar a que el certificado esté listo y activar HTTPS (bucle hasta que acepte):
```bash
until gh api -X PUT repos/javivalmich/javivalmich.github.io/pages -F https_enforced=true >/dev/null 2>&1; do echo "esperando certificado…"; sleep 60; done
curl -sI https://puntostudio.es/ | head -3        # 200 y certificado válido
curl -sI https://www.puntostudio.es/ | grep -i ^location   # → https://puntostudio.es/
```
En este punto **nada está roto**: `puntostudio.es/el-impostor/` y `/Punto-Ciego/` sirven todavía los repos con sus nombres viejos.

### 2. Preparar el contenido (local, sin publicar)
```bash
cd ~/el-impostor && git merge --no-edit puntostudio
cd "~/Punto ciego" && git merge --no-edit puntostudio
```

### 3. Renombrar y publicar de seguido (la ventana de 404 empieza aquí)
```bash
gh repo rename punto-falso -R javivalmich/el-impostor --yes
gh repo rename punto-ciego -R javivalmich/Punto-Ciego --yes
cd ~/el-impostor && git remote set-url origin https://github.com/javivalmich/punto-falso.git && git push origin main
cd "~/Punto ciego" && git remote set-url origin https://github.com/javivalmich/punto-ciego.git && git push origin main
```
Esperar a que Pages construya (el `push` fuerza la reconstrucción):
```bash
until curl -sf https://puntostudio.es/punto-falso/manifest.json >/dev/null && curl -sf https://puntostudio.es/punto-ciego/manifest.json >/dev/null \
   && curl -sf https://puntostudio.es/punto-falso/beta/manifest.json >/dev/null && curl -sf https://puntostudio.es/punto-ciego/beta/manifest.json >/dev/null; do sleep 10; done; echo listo
```
Si tras 5 min `punto-falso` o `punto-ciego` siguen en 404: `gh api -X POST repos/javivalmich/<repo>/pages/builds`.

### 4. Comprobaciones
```bash
cd ~/javivalmich.github.io && PW=C:/Users/javiv/el-impostor/node_modules/playwright node fase2/comprobar.js
```
Cubre: rutas nuevas (200 y contenido), `manifest.json` con CORS, http→https, www→raíz, y las direcciones antiguas con
`?c=`, `#s=` y `#j=…` (incluidas las betas, privacidad y `#borrar-cuenta`). Si `/Punto-Ciego/…` o `/el-impostor/…` **no**
redirigen (Pages no sirve el 404 del hub), plan B: crear un repo stub `el-impostor` (esto sí es posible) con un `index.html` y un `404.html` que redirijan igual que el hub; para Punto Ciego no cabe stub (mismo nombre sin mayúsculas), así que se afinaría el 404 del hub.
Prueba manual imprescindible: abrir la app instalada en un móvil que la tuviera antes (con red) y comprobar que llega a
`puntostudio.es/punto-…/` con su código de sala.

### 5. Supabase: ahora sí la Site URL
Cuando el paso 4 esté en verde: *Authentication → URL Configuration → Site URL* = `https://puntostudio.es/punto-ciego/`.
(Antes no: los correos de confirmación y de recuperar contraseña usan la Site URL y habrían apuntado a un sitio sin
verificar.) Prueba: registrarse con correo, Google, Apple y «olvidé mi contraseña» en la principal y en la beta.
**No quites** las Redirect URLs de `javivalmich.github.io` hasta pasadas unas semanas (correos ya enviados, pestañas viejas).

### 6. Fichas y consolas
- Tiendas: `tienda.md` ya trae `https://puntostudio.es/privacidad/`, `/soporte/` y `/soporte/#borrar-cuenta`.
- Pantalla de consentimiento de Google (Cloud Console) y Apple (Services ID): actualiza páginas de inicio/privacidad si las
  tenías con la URL de github.io. El *callback* (`*.supabase.co/auth/v1/callback`) no cambia.
- Pasadas 2-4 semanas: quita las Redirect URLs antiguas de Supabase y las de `config.toml`.

## Nota sobre la mayúscula de `Punto-Ciego`
Las rutas antiguas `/Punto-Ciego/…` solo se redirigen por el `404.html` del hub. Es robusto (es HTTP 404 con JavaScript:
vale para navegadores, no para rastreadores ni para un `curl`). Si alguna ficha de tienda antigua usaba esas URLs, cámbialas.
