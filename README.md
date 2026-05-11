# trytraining-frontend

## Requirements

- **Node.js**: `^20.19.0 || >=22.12.0`

## Setup

```bash
npm install
```

## Dev

```bash
npm run dev
```

Las peticiones van a `/api`; Vite reenvía según `vite.config.js` (`PROXY_ENV` + `API_PROXY_TARGET`).

### Error **413 Content Too Large** al subir vídeo (dev)

Ese código lo genera casi siempre **Nginx o PHP** del backend (`trytraining.test`, etc.), no el front ni Vite.

1. **Nginx** (Laravel Herd / Forge / servidor): sube el límite del cuerpo de la petición, por ejemplo en el `server` del sitio API:

```nginx
client_max_body_size 120M;
```

2. **PHP** (`php.ini` o Herd → PHP para esa versión): que permitan al menos el tamaño máximo de subida, por ejemplo:

```ini
upload_max_filesize = 120M
post_max_size = 120M
```

Reinicia PHP / Nginx tras el cambio. Debe ser coherente con `max:` de validación en `ExerciseController` (p. ej. `max:102400` en Laravel son **kilobytes** ≈ 100 MB).

## API en producción

El cliente usa `VITE_API_URL` (véase `src/services/api.js`). En **`npm run build`** Vite carga `.env.production`; ahí está definido `VITE_API_URL=https://api.trytraining.es/api` (el prefijo `/api` debe coincidir con tu Laravel/backend). Para otro dominio o prefijo, cambia ese archivo o exporta la variable en CI antes del build.

## Compilar prod

```bash
npm run build
```

## Rutas directas (evitar 404 en `/display/…`, `/workouts`, etc.)

La app usa historial HTML5 (`createWebHistory`). Al entrar o recargar una URL que no sea un fichero real, el servidor debe devolver **`index.html`**.

- **Nginx** (bloque `server` del front):

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

- Tras `npm run build`, en **`dist/`** quedan también **`_redirects`** y **`.htaccess`** (copiados desde `public/`) para hosts tipo Netlify / Apache.

- **Vercel**: en la raíz hay **`vercel.json`** con rewrite a `index.html`.