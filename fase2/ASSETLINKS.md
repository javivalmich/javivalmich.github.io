# assetlinks.json (Punto Falso, Android)

`.well-known/assetlinks.json` lista las huellas SHA-256 de los certificados con los que puede estar firmada la app `es.puntostudio.puntofalso`:

1. `72:3A:25:92:…:6A:4F` — clave de SUBIDA (upload key). Vale para el .aab y para APK firmados con ella, instalados a mano.
2. `FD:9A:BD:6E:…:31:78` — clave de DEPURACIÓN (debug.keystore del PC). Solo sirve para probar con el APK de debug; se puede quitar antes de publicar.
3. **Falta añadir la de Google Play App Signing**: es la que lleva la app instalada desde Play (sin ella, los usuarios de Play NO verifican el enlace).
   Play Console → Punto Falso → Integridad de la app (Configuración → Firma de la app) → «Certificado de la clave de firma de la app» → copia el SHA-256 y
   añádelo como tercera cadena en `sha256_cert_fingerprints` (formato `AA:BB:…`, 32 pares). No dejes marcadores de texto en el JSON publicado: un valor inválido puede
   hacer que Google ignore todo el bloque.

Comprobarlo: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://puntostudio.es&relation=delegate_permission/common.handle_all_urls`
y en el móvil: `adb shell pm get-app-links es.puntostudio.puntofalso` (debe salir `puntostudio.es: verified`).
