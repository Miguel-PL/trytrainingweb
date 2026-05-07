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