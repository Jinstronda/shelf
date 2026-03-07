export function LogoSVG({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.83)} viewBox="0 0 44 36" fill="none">
      <rect x="0"  y="14" width="9" height="22" rx="1" fill="#C4603A"/>
      <rect x="0"  y="14" width="9" height="2.5" fill="#9E4D2E"/>
      <rect x="0"  y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
      <rect x="11" y="7"  width="9" height="29" rx="1" fill="#C4603A"/>
      <rect x="11" y="7"  width="9" height="2.5" fill="#9E4D2E"/>
      <rect x="11" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
      <rect x="22" y="1"  width="9" height="35" rx="1" fill="#C4603A"/>
      <rect x="22" y="1"  width="9" height="2.5" fill="#9E4D2E"/>
      <rect x="22" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
      <rect x="33" y="9"  width="9" height="27" rx="1" fill="#C4603A"/>
      <rect x="33" y="9"  width="9" height="2.5" fill="#9E4D2E"/>
      <rect x="33" y="33.5" width="9" height="2.5" fill="#9E4D2E"/>
    </svg>
  )
}
