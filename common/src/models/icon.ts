type FontIcon = {
  type: 'font'
  value: string
}

type Base64Icon = {
  type: 'base64'
  value: string
}

type UrlIcon = {
  type: 'url'
  value: string
}

type LottieIcon = {
  type: 'lottie'
  value: {
    autoplay?: boolean
    src: string
    background?: string
    controls?: boolean
    count?: number
    direction?: number
    hover?: boolean
    loop?: boolean
    mode?: string
    renderer?: 'svg' | 'canvas'
    speed?: number
    style?: { [K: string]: string }
  }
}

export type Icon = FontIcon | Base64Icon | LottieIcon | UrlIcon
