// Reduce una foto de celular (4-8 MB) a un JPEG de ~1600px antes de subirla en base64.
// El backend limita los documentos a 8 MB y la subida en 4G se hace pesada; para leer un remito
// firmado 1600px alcanza. Si algo falla (formato raro, navegador sin canvas), se sube el original.
export async function comprimirImagen(file: File, maxLado = 1600, calidad = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height))
    const ancho = Math.round(bitmap.width * escala)
    const alto = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, ancho, alto)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', calidad))
    if (!blob || blob.size >= file.size) return file

    const nombre = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], nombre, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export function fileABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
