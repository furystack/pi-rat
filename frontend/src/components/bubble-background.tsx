import { createComponent, Shade } from '@furystack/shades'

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
    '--blur': `${randomInRange(1, 30)}px`,
    '--blob-duration': `${randomInRange(0.2, 0.6)}s`,
    '--blob-easing': `${Math.random() > 0.5 ? 'ease-out' : 'linear'}`,
  }).forEach(([key, value]) => {
    el.style.setProperty(key, value)
  })

export const Blob = Shade({
  customElementName: 'shade-bubbles-blob',
  render: ({ useHostProps }) => {
    const vars = {
      '--x': `${randomInRange(-300, 300)}`,
      '--y': `${randomInRange(-300, 300)}`,
      '--scale': `${Math.random() + 0.5}`,
      '--hue': `${randomInRange(64, 192)}`,
      '--opacity': `${Math.random() * 0.1 + 0.05}`,
      '--blur': `${randomInRange(1, 30)}px`,
      '--blob-duration': `${randomInRange(0.2, 0.6)}s`,
      '--blob-easing': `${Math.random() > 0.5 ? 'ease-out' : 'linear'}`,
    }
    useHostProps({ style: vars })

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
          transition: 'all var(--blob-duration) var(--blob-easing)',
          opacity: 'var(--opacity, 0.05, 1)',
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
    '--duration': `${randomInRange(0.1, 0.3)}s`,
    '--origin-x': `${randomInRange(-100, 100)}`,
    '--origin-y': `${randomInRange(-100, 100)}`,
    '--direction': `${Math.random() > 0.5 ? 'normal' : 'reverse'}`,
    '--timing': `${
      Math.random() < 0.01 ? 'cubic-bezier(0.230, 1.000, 0.320, 1.000)' : Math.random() > 0.5 ? 'ease' : 'linear'
    }`,
  }).forEach(([key, value]) => {
    el.style.setProperty(key, value)
  })

const BlobGroup = Shade({
  customElementName: 'shade-bubbles-blob-group',
  render: ({ children, useHostProps }) => {
    const vars = {
      '--x': `${randomInRange(0, 100)}`,
      '--y': `${randomInRange(0, 100)}`,
      '--scale': `${randomInRange(0.5, 1)}`,
      '--duration': `${randomInRange(0.1, 0.3)}s`,
      '--origin-x': `${randomInRange(-100, 100)}`,
      '--origin-y': `${randomInRange(-100, 100)}`,
      '--direction': `${Math.random() > 0.5 ? 'normal' : 'reverse'}`,
      '--timing': `${
        Math.random() < 0.01 ? 'cubic-bezier(0.230, 1.000, 0.320, 1.000)' : Math.random() > 0.5 ? 'ease' : 'linear'
      }`,
    }
    useHostProps({ style: vars })
    return (
      <div
        style={{
          position: 'absolute',
          top: 'calc(var(--x, 50) * 1%)',
          left: 'calc(var(--y, 50) * 1%)',
          transformOrigin: 'calc(var(--origin-x, 50) * 1%) calc(var(--origin-y, 50) * 1%)',
          animation: 'rotate calc(var(--duration, 10) * 1s) infinite var(--direction, 1) ease',
          transform: 'rotate(0deg) translate(-50%, -50%) scale(var(--scale, 1))',
          transition: 'all var(--duration) var(--timing)',
        }}
      >
        {children}
      </div>
    )
  },
})

export const blob = <div></div>

export const BubbleBackground = Shade({
  customElementName: 'bubble-background',
  render: ({ children, useDisposable, useRef }) => {
    const containerRef = useRef<HTMLElement>('container')

    useDisposable('mouseupListener', () => {
      const randomizeHandler = () => {
        const container = containerRef.current
        if (!container) return
        container
          .querySelectorAll('shade-bubbles-blob-group')
          .forEach((el) => randomizeBlobGroupVars(el as HTMLElement))
        container.querySelectorAll('shade-bubbles-blob').forEach((el) => randomizeBlobVars(el as HTMLElement))
      }
      document.addEventListener('mouseup', randomizeHandler)
      return {
        [Symbol.dispose]: () => document.removeEventListener('mouseup', randomizeHandler),
      }
    })
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        {new Array(8).fill(0).map(() => (
          <BlobGroup>
            {new Array(3).fill(0).map(() => (
              <Blob />
            ))}
          </BlobGroup>
        ))}
        {children}
      </div>
    )
  },
})
