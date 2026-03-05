import { Shade, createComponent } from '@furystack/shades'

type PiRatLogoProps = {
  size?: number
  style?: Partial<CSSStyleDeclaration>
}

const createSvg = (size: number) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org">
  <!-- Ears - Touching the top/side bounds -->
  <circle cx="43" cy="78" r="32" fill="#888888" />
  <circle cx="43" cy="78" r="20" fill="#FFB6C1" />
  <circle cx="157" cy="78" r="32" fill="#888888" />
  <circle cx="157" cy="78" r="20" fill="#FFB6C1" />

  <!-- Head - Scaled to the bottom edge -->
  <path d="M40 115 Q40 60 100 60 Q160 60 160 115 Q160 175 100 175 Q40 175 40 115" fill="#A0A0A0" stroke="#333" stroke-width="1" />

  <!-- Features -->
  <circle cx="130" cy="110" r="18" fill="white" stroke="#333" stroke-width="1"/>
  <circle cx="135" cy="107" r="9" fill="black" />
  <circle cx="138" cy="102" r="4" fill="white" /> 

  <!-- Eyepatch -->
  <path d="M60 95 Q65 140 100 115 L95 85 Z" fill="#222" />
  <rect x="25" y="100" width="150" height="6" fill="#222" transform="rotate(-15 100 110)" />

  <!-- Large Nose - Fills bottom visual weight -->
  <ellipse cx="100" cy="148" rx="15" ry="11" fill="#FF6B81" />

  <!-- Pirate Hat - Set to the absolute top of the frame -->
  <path d="M10 88 Q100 -2 190 88 L185 108 Q100 88 15 108 Z" fill="#1A1A1A" />
  
  <!-- GIANT Skull & Crossbones -->
  <path d="M75 38 L125 73 M125 38 L75 73" stroke="white" stroke-width="7" stroke-linecap="round" />
  <circle cx="100" cy="53" r="19" fill="white" />
  <path d="M89 68 Q100 79 111 68 L108 58 L92 58 Z" fill="white" /> 
  <circle cx="91" cy="53" r="5" fill="black" /> 
  <circle cx="109" cy="53" r="5" fill="black" />
</svg>`

export const PiRatLogo = Shade<PiRatLogoProps>({
  shadowDomName: 'pi-rat-logo',
  render: ({ props }) => {
    const size = props.size ?? 24

    return (
      <div
        innerHTML={createSvg(size)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          lineHeight: '0',
          ...(props.style as Record<string, string>),
        }}
      />
    )
  },
})
