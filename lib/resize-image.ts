const MAX_DIMENSION = 2000
const KEEP_IF_UNDER_BYTES = 1.5 * 1024 * 1024
const JPEG_QUALITY = 0.82

export type PreparedPhoto = {
  file: File
  originalName: string
  originalSize: number
  changed: boolean
}

function unchanged(file: File): PreparedPhoto {
  return { file, originalName: file.name, originalSize: file.size, changed: false }
}

function toJpegName(name: string) {
  const base = name.replace(/\.[^.]+$/, "")
  return `${base || "photo"}.jpg`
}

/**
 * Shrinks a JPEG/PNG so its longest side is at most 2000px and re-encodes it
 * as JPEG. GIFs (may be animated) and photos that are already small enough
 * are returned untouched.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (file.type !== "image/jpeg" && file.type !== "image/png") {
    return unchanged(file)
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    return unchanged(file)
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height)
    if (longest <= MAX_DIMENSION && file.size <= KEEP_IF_UNDER_BYTES) {
      return unchanged(file)
    }

    const scale = Math.min(1, MAX_DIMENSION / longest)
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) return unchanged(file)

    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, width, height)
    context.imageSmoothingQuality = "high"
    context.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    )
    // Release the canvas backing store promptly; phones run out of memory fast.
    canvas.width = 0
    canvas.height = 0

    if (!blob || (scale === 1 && blob.size >= file.size)) {
      return unchanged(file)
    }

    return {
      file: new File([blob], toJpegName(file.name), {
        type: "image/jpeg",
        lastModified: file.lastModified,
      }),
      originalName: file.name,
      originalSize: file.size,
      changed: true,
    }
  } finally {
    bitmap.close()
  }
}

export function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
