# Revisión de seguridad

Este documento resume la revisión de seguridad del proyecto: cabeceras HTTP, manejo de sesión, variables de entorno, almacenamiento local y recomendaciones. Está pensado para que quien mantenga el proyecto sepa qué está cubierto y qué debe vigilar en producción.

---

## 1. Cabeceras de seguridad HTTP

### 1.1 Desarrollo y preview (Vite)

En `vite.config.js` se configuraron cabeceras para el servidor de desarrollo y para `preview`:

| Cabecera | Valor | Objetivo |
|----------|--------|----------|
| `X-Content-Type-Options` | `nosniff` | Evitar que el navegador interprete respuestas como otro MIME type. |
| `X-Frame-Options` | `SAMEORIGIN` | Reducir riesgo de clickjacking (que la app se cargue en un iframe de otro origen). |
| `X-XSS-Protection` | `1; mode=block` | Activar filtro XSS del navegador (legacy; lo importante es no confiar solo en esto). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limitar qué se envía en Referer al salir a otros orígenes. |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Desactivar APIs que la app no usa. |

**Importante:** En producción la app se sirve desde nginx (u otro servidor). Las cabeceras deben definirse ahí; Vite no sirve el build en producción.

### 1.2 Producción (nginx)

Ejemplo de bloque para la ubicación que sirve el frontend (por ejemplo `/portalEmpresarial` o la raíz):

```nginx
location /portalEmpresarial {
    alias /var/www/html/portalEmpresarial;
    try_files $uri $uri/ /portalEmpresarial/index.html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Opcional: Content-Security-Policy (ajustar según recursos que use la app)
    # add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'self' https://tu-api.ejemplo.com;" always;
}
```

Si usas `Content-Security-Policy`, hay que probar bien: la app carga Bootstrap, fuentes de Google y cdnjs; cualquier origen no listado bloqueará el recurso.

---

## 2. Sesión y autenticación

### 2.1 Token en localStorage (encriptado)

- El token de sesión (`idSession`) se guarda en `localStorage` bajo la clave `app_cache_token`, **encriptado** con `utils/encryption.js` y la clave `VITE_ENCRYPTION_KEY`.
- La cabecera `id-session` se envía solo en las peticiones de la API nueva (`axiosInstanceNew`); se configura tras el login y se elimina en logout y en el interceptor 401.

**Riesgos:** Cualquier script que se ejecute en la misma origen (p. ej. XSS) podría leer `localStorage`. La encriptación con clave fija en el cliente no protege frente a XSS; solo ofusca el valor ante miradas casuales. La defensa principal es evitar XSS (sanitización, CSP, dependencias actualizadas).

### 2.2 Interceptor 401 (sesión expirada)

- En `config/axiosConfig.js`, **axiosInstanceNew** tiene un interceptor de respuesta que, ante **401**:
  - Llama a `clearSessionClient()` (quita cabecera `id-session` y borra el token de `localStorage`).
  - Redirige a `/login` con `window.location.href`, salvo que la petición sea a `/auth/login` (credenciales incorrectas) o que la ruta actual sea `/login` o `/recovery`.
- Así, cuando el backend considera la sesión inválida o expirada, el usuario vuelve a login sin dejar sesión “colgada” en el cliente.

### 2.3 Limpieza de sesión centralizada

- `clearSessionClient()` en `axiosConfig.js` centraliza: quitar cabecera `id-session` y borrar `app_cache_token` de `localStorage`.
- El logout del `authContext` y el interceptor 401 usan esta función para no duplicar lógica.

---

## 3. Variables de entorno y secretos

- Las variables con prefijo **`VITE_`** se embeben en el bundle en tiempo de build; **cualquier usuario puede verlas** en el código del frontend (DevTools, “View source”).
- Por tanto, **no** deben usarse para secretos que deban ser solo de servidor (contraseñas de BD, tokens privados, etc.).
- En este proyecto se usan para:
  - URLs de APIs (`VITE_API_URL`, `VITE_API_URL_NEW`, `VITE_API_URL_APP_SHELL`).
  - Clave de encriptación del token en `localStorage` (`VITE_ENCRYPTION_KEY`).
  - API Key del App Shell (`VITE_API_KEY_APP_SHELL`), enviada en cabecera.

**Recomendación:** En producción, `VITE_ENCRYPTION_KEY` debe ser una clave fuerte y distinta por entorno; no usar el valor por defecto de `env.js`. Los archivos `.env*` están en `.gitignore` y no se versionan.

---

## 4. Encriptación del token (utils/encryption.js)

- Implementación actual: **XOR con la clave** y resultado en Base64. Es ofuscación, no criptografía robusta (sensible a análisis si se conoce o adivina la clave).
- **Ventaja:** No exponer el token en claro en `localStorage`.
- **Recomendación a medio plazo:** Valorar uso de **Web Crypto API** (por ejemplo AES-GCM) o una librería bien auditada para “encrypt at rest” en el cliente, manteniendo la clave en `VITE_ENCRYPTION_KEY`. Mientras tanto, la clave debe ser fuerte y solo de producción.

---

## 5. Uso de localStorage

| Dato | Ubicación | Riesgo |
|------|-----------|--------|
| Token de sesión | `app_cache_token` (encriptado) | Ver sección 2. |
| Tema (theme) | `theme` | Bajo; solo preferencia de UI. |
| Correo / identificador | `correo`, `identificador` en algunos componentes (TablaInputsUI, contabilidadService, CategoriasProductosTecnicentro, ReporteComisionesTecnicentro) | Datos de usuario en texto claro; si la app es multi-usuario en el mismo navegador, podrían mezclarse. Valorar usar solo estado en memoria o datos que vengan de la sesión actual. |

---

## 6. Recursos externos (index.html)

- Se cargan fuentes de **Google Fonts** y **Bootstrap Icons** desde cdnjs con `integrity` y `crossorigin`. Eso permite verificar la integridad del recurso; está correcto.
- Cualquier cambio de URL o de recurso externo debe mantener `integrity` actualizado o asumir el riesgo de confiar en el CDN.

---

## 7. Otras buenas prácticas ya presentes

- No se usa `dangerouslySetInnerHTML` ni `eval` en el código revisado, lo que reduce superficie de XSS.
- Las instancias de Axios diferencian APIs y cabeceras (API principal, API nueva con `id-session`, App Shell con `X-Portal-API-Key`).
- La API Key del App Shell no se envía a la API de login ni a la API principal; solo al App Shell.

---

## 8. Resumen de acciones realizadas en esta revisión

- Añadidas **cabeceras de seguridad** en Vite (dev y preview): `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- Documentado **ejemplo de cabeceras en nginx** para producción.
- Implementado **interceptor 401** en `axiosInstanceNew`: limpieza de sesión y redirección a `/login` cuando el backend devuelve no autorizado (salvo en login/recovery).
- **Centralizada** la limpieza de sesión en `clearSessionClient()` y uso en logout y en el interceptor 401.
- **Corregido** el orden del `import` en `utils/encryption.js` (import al inicio del archivo).

---

## 9. Recomendaciones pendientes

- **Producción:** Configurar en nginx (o el servidor que sirva el build) las mismas cabeceras de seguridad (y, si se usa, CSP) descritas en la sección 1.2.
- **CSP:** Si se añade Content-Security-Policy, probar con la política restrictiva necesaria para que la app cargue correctamente (scripts, estilos, fuentes, conexiones a las APIs).
- **Encriptación:** Valorar migrar a Web Crypto API o librería estándar para el token en `localStorage`.
- **localStorage con datos de usuario:** Revisar uso de `correo` e `identificador` en localStorage; preferir datos derivados de la sesión actual cuando sea posible.
- **Auditoría de dependencias:** Ejecutar periódicamente `npm audit` y actualizar dependencias con vulnerabilidades conocidas.

---

*Documento generado a partir de una revisión de seguridad del repositorio. Ante cambios en auth, headers o despliegue, conviene actualizar este documento.*
