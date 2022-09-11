import { createFragment, createComponent, Shade } from '@furystack/shades'

const randomInRange = (min: number, max: number) =>
  Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min))

const randomizeBlobVars = (el?: HTMLElement) =>
  el &&
  Object.entries({
    '--x': `${randomInRange(-300, 300)}`,
    '--y': `${randomInRange(-300, 300)}`,
    '--scale': `${Math.random() + 0.5}`,
    '--hue': `${randomInRange(64, 192)}`,
    '--opacity': `${Math.random() * 0.1 + 0.05}`,
    '--blur': `${Math.random() * 30 + 5}px`,
  }).forEach(([key, value]) => {
    el.style.setProperty(key, value)
  })

export const Blob = Shade({
  shadowDomName: 'shade-bubbles-blob',
  render: ({ element }) => {
    randomizeBlobVars(element)

    return (
      <div
        style={{
          height: 'calc(var(--size, 10) * 1vmax)',
          backgroundColor: 'hsl(var(--hue, 0) 95% 70%)',
          aspectRatio: '1',
          position: 'absolute',
          transform:
            'translate(-50%, -50%) translate(calc(var(--x, 0) * 1%), calc(var(--y, 0) * 1%)) scale(var(--scale))',
          filter: 'blur(var(--blur))',
          borderRadius: '50%',
          transition: 'all 0.2s',
          opacity: 'var(--opacity, 0.01, 1)',
        }}
      />
    )
  },
})

const randomizeBlobGroupVars = (el?: HTMLElement) =>
  el &&
  Object.entries({
    '--x': `${randomInRange(0, 100)}`,
    '--y': `${randomInRange(0, 100)}`,
    '--scale': `${randomInRange(0.5, 1)}`,
    '--duration': `${Math.random() > 0.75 ? randomInRange(10, 60) : 0}`,
    '--origin-x': `${randomInRange(-100, 100)}`,
    '--origin-y': `${randomInRange(-100, 100)}`,
    '--direction': `${Math.random() > 0.5 ? 'normal' : 'reverse'}`,
    '--timing': `${Math.random() > 0.9 ? 'ease' : 'linear'}`,
  }).forEach(([key, value]) => {
    el.style.setProperty(key, value)
  })

const BlobGroup = Shade({
  shadowDomName: 'shade-bubbles-blob-group',
  render: ({ children, element }) => {
    randomizeBlobGroupVars(element)
    return (
      <div
        style={{
          position: 'absolute',
          top: 'calc(var(--x, 50) * 1%)',
          left: 'calc(var(--y, 50) * 1%)',
          transformOrigin: 'calc(var(--origin-x, 50) * 1%) calc(var(--origin-y, 50) * 1%)',
          animation: 'rotate calc(var(--duration, 10) * 1s) infinite var(--direction, 1) ease',
          transform: 'rotate(0deg) translate(-50%, -50%) scale(var(--scale, 1))',
          transition: 'all 0.2s',
        }}>
        {children}
      </div>
    )
  },
})

export const blob = <div></div>

export const BubbleBackground = Shade({
  shadowDomName: 'bubble-background',
  constructed: ({ element }) => {
    const randomizeHandler = () => {
      element.querySelectorAll('shade-bubbles-blob-group').forEach((el) => randomizeBlobGroupVars(el as HTMLElement))
      //   randomizeBlobVars(element)
      element.querySelectorAll('shade-bubbles-blob').forEach((el) => randomizeBlobVars(el as HTMLElement))
      //   randomizeBlobGroupVars(element)
    }
    document.addEventListener('mouseup', randomizeHandler)
    return () => document.removeEventListener('mouseup', randomizeHandler)
  },
  render: ({ children }) => {
    return (
      <>
        {new Array(8).fill(0).map(() => (
          <BlobGroup>
            {new Array(3).fill(0).map(() => (
              <Blob />
            ))}
          </BlobGroup>
        ))}
        {children}
      </>
    )
  },
})
