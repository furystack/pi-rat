import { createComponent, ScreenService, Shade } from '@furystack/shades'
import { cssVariableTheme, promisifyAnimation } from '@furystack/shades-common-components'

type MediaOverviewLayoutProps = {
  thumbnailUrl: string
  title: string
  detailsContainerStyle?: Partial<CSSStyleDeclaration>
}

export const MediaOverviewLayout = Shade<MediaOverviewLayoutProps>({
  customElementName: 'media-overview-layout',
  css: {
    '& .overview-page': {
      width: '100%',
      height: 'calc(100% - 40px)',
      paddingTop: '40px',
    },
    '& .overview-container': {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    },
    '& .poster-container': {
      padding: '2em',
    },
    '& .poster-image': {
      boxShadow: cssVariableTheme.shadows.md,
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      opacity: '0',
    },
    '& .details-container': {
      padding: '2em',
      maxWidth: '800px',
    },
  },
  render: ({ props, children, useObservable, useDisposable, useRef, injector }) => {
    const imgRef = useRef<HTMLImageElement>('posterImg')
    const [isDesktop] = useObservable('isDesktop', injector.getInstance(ScreenService).screenSize.atLeast.md)

    useDisposable('posterAnimation', () => {
      const id = setTimeout(() => {
        void promisifyAnimation(
          imgRef.current,
          [
            { opacity: 0, transform: 'scale(0.85)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          {
            easing: 'cubic-bezier(0.415, 0.225, 0.375, 1.355)',
            duration: 500,
            direction: 'alternate',
            fill: 'forwards',
          },
        )
      }, 100)
      return { [Symbol.dispose]: () => clearTimeout(id) }
    })

    return (
      <div className="overview-page">
        <div className="overview-container">
          <div className="poster-container">
            <img ref={imgRef} className="poster-image" src={props.thumbnailUrl} alt={`thumbnail for ${props.title}`} />
          </div>
          <div
            className="details-container"
            style={{ minWidth: isDesktop ? '550px' : undefined, ...props.detailsContainerStyle }}
          >
            {children}
          </div>
        </div>
      </div>
    )
  },
})
