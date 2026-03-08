import { toPng } from 'html-to-image'

async function proxyImages(element: HTMLElement): Promise<Array<{ img: HTMLImageElement; original: string }>> {
  const images = element.querySelectorAll('img')
  const swaps: Array<{ img: HTMLImageElement; original: string }> = []

  await Promise.all(Array.from(images).map(async (img) => {
    const src = img.src
    if (!src || src.startsWith('data:')) return
    try {
      const res = await fetch(`/api/cover-proxy?url=${encodeURIComponent(src)}`)
      if (!res.ok) return
      const blob = await res.blob()
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      swaps.push({ img, original: src })
      img.src = dataUrl
    } catch {}
  }))

  return swaps
}

function restoreImages(swaps: Array<{ img: HTMLImageElement; original: string }>) {
  for (const { img, original } of swaps) img.src = original
}

async function captureElement(element: HTMLElement): Promise<string> {
  const swaps = await proxyImages(element)
  try {
    return await toPng(element, { pixelRatio: 3 })
  } finally {
    restoreImages(swaps)
  }
}

export async function copyCardImage(element: HTMLElement): Promise<boolean> {
  const dataUrl = await captureElement(element)
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ])
  return true
}

export async function downloadCardImage(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await captureElement(element)
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
