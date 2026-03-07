export const RATINGS = [
  { value: 10, label: '★★★★★' },
  { value: 9,  label: '★★★★½' },
  { value: 8,  label: '★★★★'  },
  { value: 7,  label: '★★★½'  },
  { value: 6,  label: '★★★'   },
  { value: 5,  label: '★★½'   },
  { value: 4,  label: '★★'    },
  { value: 3,  label: '★½'    },
  { value: 2,  label: '★'     },
  { value: 1,  label: '½'     },
] as const

export const RATING_MAP: Record<number, string> = Object.fromEntries(
  RATINGS.map(r => [r.value, r.label])
)

export const CARD_VARIANTS = ['cv1','cv2','cv3','cv4','cv5','cv6','cv7','cv8','cv9','cva','cvb','cvc'] as const
