export const RATINGS = [
  { value: 5, label: '5' },
  { value: 4, label: '4' },
  { value: 3, label: '3' },
  { value: 2, label: '2' },
  { value: 1, label: '1' },
] as const

export const RATING_MAP: Record<number, string> = Object.fromEntries(
  RATINGS.map(r => [r.value, r.label])
)

export const CARD_VARIANTS = ['cv1','cv2','cv3','cv4','cv5','cv6','cv7','cv8','cv9','cva','cvb','cvc'] as const

export const STATUS_LABELS: Record<string, string> = {
  read: 'Read', reading: 'Reading', want: 'Want', dnf: 'DNF',
}

export const pillBase = {
  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 as const,
}
export const pillActive = {
  background: 'rgba(196,96,58,0.2)', color: '#C4603A',
  border: '1px solid rgba(196,96,58,0.3)',
}
export const pillInactive = {
  background: 'rgba(255,255,255,0.05)', color: '#789',
  border: '1px solid rgba(255,255,255,0.08)',
}
