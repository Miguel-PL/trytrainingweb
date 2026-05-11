const SUPPORTED_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov']

const isYouTubeHost = (host) => {
  const h = host.toLowerCase()
  return h === 'youtu.be' || h.endsWith('.youtu.be') || h === 'youtube.com' || h.endsWith('.youtube.com')
}

export function parseYouTubeVideoId(input) {
  const raw = String(input || '').trim()
  if (!raw) return null

  let url
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  if (!['http:', 'https:'].includes(url.protocol)) return null
  if (!isYouTubeHost(url.hostname)) return null

  // youtu.be/<id>
  if (url.hostname.toLowerCase().includes('youtu.be')) {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id || null
  }

  // youtube.com/watch?v=<id>
  const v = url.searchParams.get('v')
  if (v) return v

  // youtube.com/shorts/<id>
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts[0] === 'shorts' && parts[1]) return parts[1]

  // youtube.com/embed/<id>
  if (parts[0] === 'embed' && parts[1]) return parts[1]

  return null
}

export function buildYouTubeEmbedUrl(input) {
  const id = parseYouTubeVideoId(input)
  if (!id) return null

  // Loop in YouTube embed requires playlist=<id>
  // controls=0: sin barra de controles; mute+autoplay: reproducción permitida en navegadores
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    cc_load_policy: '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    loop: '1',
    playlist: id,
  })

  // Refuerzo recomendado por Google para embeds (mejor comportamiento del reproductor)
  if (typeof window !== 'undefined' && window.location?.origin) {
    params.set('origin', window.location.origin)
  }

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params.toString()}`
}

export function validateExerciseMediaUrl(input) {
  const raw = String(input || '').trim()
  if (!raw) return { ok: false, reason: 'La URL del vídeo es obligatoria.' }

  let url
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, reason: 'La URL no es válida. Debe empezar por http:// o https://.' }
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, reason: 'La URL debe ser http:// o https://.' }
  }

  const host = url.hostname.toLowerCase()
  if (isYouTubeHost(host)) {
    const embed = buildYouTubeEmbedUrl(raw)
    if (!embed) return { ok: false, reason: 'URL de YouTube inválida.' }
    return { ok: true, kind: 'youtube', url: raw, embedUrl: embed }
  }

  if (host.includes('vimeo.com')) {
    return {
      ok: false,
      reason: 'Vimeo no está soportado. Usa YouTube o un enlace directo a .mp4/.webm/.ogg/.mov.',
    }
  }

  const pathname = url.pathname.toLowerCase().replace(/\/+$/, '') || '/'
  const extMatch = pathname.match(/\.([a-z0-9]+)$/)
  const ext = extMatch?.[1] || ''

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      reason: `La URL debe apuntar a YouTube o a un archivo de vídeo (${SUPPORTED_EXTENSIONS.map(e => '.' + e).join(', ')}).`,
    }
  }

  return { ok: true, kind: 'file', url: url.toString(), ext }
}

