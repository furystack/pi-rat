import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DynamicIcon } from './dynamic-icon.js'

describe('DynamicIcon', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render font icon type', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    const icon = DynamicIcon({ type: 'font', value: '🎬' }, [])
    rootElement.appendChild(icon)

    const div = rootElement.querySelector('div')
    expect(div).toBeTruthy()
    expect(div?.textContent).toBe('🎬')
  })

  it('should render URL icon type as img', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    const icon = DynamicIcon({ type: 'url', value: 'https://example.com/icon.png' }, [])
    rootElement.appendChild(icon)

    const img = rootElement.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.src).toBe('https://example.com/icon.png')
    expect(img?.alt).toBe('')
  })

  it('should render base64 icon type as img', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    const base64Data =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const icon = DynamicIcon({ type: 'base64', value: base64Data }, [])
    rootElement.appendChild(icon)

    const img = rootElement.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.src).toBe(base64Data)
  })

  it('should render lottie icon type as lottie-player', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    const lottieValue = { src: 'animation.json', autoplay: true }
    const icon = DynamicIcon({ type: 'lottie', value: lottieValue }, [])
    rootElement.appendChild(icon)

    const lottiePlayer = rootElement.querySelector('lottie-player')
    expect(lottiePlayer).toBeTruthy()
  })

  it('should render children as fallback for unknown type', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    const fallbackSpan = document.createElement('span')
    fallbackSpan.textContent = 'Fallback content'
    const icon = DynamicIcon({ type: 'unknown' as never, value: '' }, [fallbackSpan])
    rootElement.appendChild(icon)

    const fallback = rootElement.querySelector('span')
    expect(fallback).toBeTruthy()
    expect(fallback?.textContent).toBe('Fallback content')
  })

  it('should apply title attribute when provided', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    const icon = DynamicIcon({ type: 'font', value: '🎬', title: 'Movie icon' }, [])
    rootElement.appendChild(icon)

    const div = rootElement.querySelector('div')
    expect(div?.title).toBe('Movie icon')
  })

  it('should apply custom styles when provided', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    const icon = DynamicIcon(
      {
        type: 'font',
        value: '🎬',
        style: { fontSize: '24px', color: 'red' },
      },
      [],
    )
    rootElement.appendChild(icon)

    const div = rootElement.querySelector('div') as HTMLDivElement
    expect(div?.style.fontSize).toBe('24px')
    expect(div?.style.color).toBe('red')
  })

  it('should attach onclick handler when provided', () => {
    const rootElement = document.getElementById('root') as HTMLDivElement
    let clicked = false
    const icon = DynamicIcon(
      {
        type: 'font',
        value: '🎬',
        onclick: () => {
          clicked = true
        },
      },
      [],
    )
    rootElement.appendChild(icon)

    const div = rootElement.querySelector('div') as HTMLDivElement
    div.click()
    expect(clicked).toBe(true)
  })
})
