import { toPng } from 'html-to-image'

export async function copyCardImage(element: HTMLElement): Promise<boolean> {
  const dataUrl = await toPng(element, { pixelRatio: 3 })
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ])
  return true
}

export async function downloadCardImage(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(element, { pixelRatio: 3 })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
