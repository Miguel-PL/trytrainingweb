# TryTraining — Frontend

Aplicación web para la **gestión de entrenamientos de gimnasio**: creación de sesiones con bloques y ejercicios, catálogo de ejercicios con vídeo y un modo de visualización a pantalla completa para las TV del gimnasio.

Frontend SPA construido con **Vue 3 + Vite** que consume una **API REST (Laravel)**.

![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%5E20.19%20%7C%7C%20%3E%3D22.12-339933?logo=nodedotjs&logoColor=white)

---

## Características

- **Autenticación** con token (`Bearer`) y guard de rutas que protege las pantallas privadas.
- **Sesiones de entrenamiento**: alta, edición y borrado, con búsqueda y paginación.
- **Estructura por bloques**: cada sesión se compone de bloques ordenables que contienen ejercicios (arrastrar y soltar con `vuedraggable`).
- **Ejercicios**: nombre, categorías y vídeo, ya sea por **URL externa** (YouTube, `.mp4`, `.webm`, `.ogg`, `.mov`) o **subiendo un archivo** con barra de progreso y seguimiento de la conversión en el servidor.
- **Categorías**: CRUD sencillo para clasificar ejercicios.
- **Modo Display (TV)**: vista pública a pantalla completa, sin layout, pensada para monitores de gimnasio.
- **Feedback de UI**: toasts, modales de confirmación, spinners y estados de carga/error.

## Stack técnico

| Área | Tecnología |
| --- | --- |
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Enrutado | Vue Router 5 (history mode) |
| Build | Vite 8 |
| Estilos | Tailwind CSS 4 (vía PostCSS) |
| Drag & drop | `vuedraggable` |
| Iconos | `@heroicons/vue` |
| HTTP | `fetch` + `XMLHttpRequest` (subidas con progreso) |
| Runtime | Node.js `^20.19.0 \|\| >=22.12.0` |

## Estructura del proyecto

```
trytrainingweb/
├── public/              # Assets estáticos y reglas de hosting para SPA
├── src/
│   ├── assets/
│   ├── components/
│   │   └── ui/          # UiToast, UiSpinner, UiConfirmModal
│   ├── composables/     # useToast
│   ├── layouts/         # MainLayout (sidebar + contenido privado)
│   ├── router/          # Rutas y guard de autenticación
│   ├── services/        # api.js (cliente REST: JSON y multipart)
│   ├── utils/           # videoUrl.js (validación YouTube / archivo)
│   ├── views/           # Pantallas de la aplicación
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── .env.example         # Plantilla de variables de entorno
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json          # Rewrite SPA para Vercel
└── vite.config.js       # Proxy de desarrollo y build
```

## Requisitos

- **Node.js** `^20.19.0 || >=22.12.0` (ver `.nvmrc`).
- Un **backend API** (Laravel) accesible. Este repositorio contiene **solo el frontend**; la API se despliega por separado.

## Instalación

```bash
git clone https://github.com/Miguel-PL/trytrainingweb.git
cd trytrainingweb
npm install
```

## Configuración

### Desarrollo

En desarrollo, las peticiones se envían a `/api` y **Vite las reenvía** al backend definido en `vite.config.js`:

```js
// vite.config.js  →  cambia PROXY_ENV: 'local' | 'dev' | 'prod'
const PROXY_ENV = 'local'

const API_PROXY_TARGET = {
  local: 'http://127.0.0.1:8000',   // backend en local
  dev:   'http://trytraining.test', // p. ej. Laravel Herd
  prod:  'https://api.trytraining.es',
}[PROXY_ENV]
```

No necesitas ninguna variable para trabajar en local: basta con que tu API escuche en el destino elegido.

### Producción

El cliente lee `VITE_API_URL` (véase `src/services/api.js`). En `npm run build`, Vite carga `.env.production`:

```dotenv
# .env.example
VITE_API_URL=https://api.trytraining.es/api
```

Cambia ese valor (o expórtalo en tu CI) si tu backend usa otro dominio o prefijo. El prefijo `/api` debe coincidir con el de Laravel.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR (proxy `/api`). |
| `npm run build` | Compila a `dist/` para producción. |
| `npm run preview` | Sirve localmente el resultado de `dist/`. |

## Despliegue

La app usa el historial HTML5 (`createWebHistory`), así que el servidor debe devolver `index.html` en cualquier ruta que no sea un archivo real (por ejemplo `/display/12` o `/workouts`).

- **Vercel**: usa `vercel.json` (rewrite a `index.html`).
- **Netlify / Cloudflare Pages**: `public/_redirects` (`/*  /index.html  200`).
- **Apache**: `public/.htaccess`.
- **Nginx**:

  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```

Tras `npm run build`, se copian `_redirects` y `.htaccess` a `dist/`.

## API y autenticación

El cliente se centraliza en `src/services/api.js`:

- `apiFetch(endpoint, options)`: peticiones JSON.
- `apiUploadForm({ endpoint, method, formData, onProgress })`: subida multipart con progreso.

La autenticación es por token: `POST /login` devuelve un token que se guarda en `localStorage` y se envía como `Authorization: Bearer <token>` en cada petición. El guard del router comprueba su presencia antes de acceder a las rutas privadas.

Endpoints consumidos:

| Recurso | Endpoints |
| --- | --- |
| Auth | `POST /login` |
| Sesiones | `GET /workouts` · `GET /workouts/:id` · `POST /workouts` · `PUT /workouts/:id` · `DELETE /workouts/:id` |
| Display (TV) | `GET /workouts/:id/display` |
| Ejercicios | `GET /exercises` · `GET /exercises/:id` · `POST /exercises` · `PUT /exercises/:id` · `DELETE /exercises/:id` |
| Categorías | `GET /categories` · `POST /categories` · `PUT /categories/:id` · `DELETE /categories/:id` |

Listados con paginación: `?page=`, `?name=` y, en ejercicios, `?category_id=` o `?all=1`.

## Solución de problemas

### Error `413 Content Too Large` al subir vídeo (desarrollo)

Lo genera **Nginx o PHP** del backend, no Vite. Ajusta los límites del servidor de la API:

```nginx
# Nginx (bloque server de la API)
client_max_body_size 120M;
```

```ini
; php.ini
upload_max_filesize = 120M
post_max_size = 120M
```

Reinicia PHP/Nginx después. Debe ser coherente con la validación del backend (en Laravel, `max:102400` son **kilobytes** ≈ 100 MB).

### 404 al recargar rutas directas

Configura el fallback a `index.html` en tu servidor (ver la sección **Despliegue**).

## Estado del proyecto

Proyecto desarrollado como práctica del ciclo de **Desarrollo de Aplicaciones Web (DAW)** y ampliado como proyecto de portfolio. Mejoras previstas: manejo global de sesión expirada (401), mostrar errores de validación del backend (422), linting/formato y pruebas automatizadas.

## Autor

**Miguel Pérez** — [github.com/Miguel-PL](https://github.com/Miguel-PL)
