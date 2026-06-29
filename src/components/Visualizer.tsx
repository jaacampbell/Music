import { useEffect, useRef } from 'react'

interface VisualizerProps {
  analyser: AnalyserNode | null
  isPlaying: boolean
  colors: [string, string]
}

export function Visualizer({ analyser, isPlaying, colors }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const { clientWidth, clientHeight } = canvas
      canvas.width = clientWidth * dpr
      canvas.height = clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)

      const bars = 48
      const gap = 3
      const barWidth = (w - gap * (bars - 1)) / bars

      const gradient = ctx.createLinearGradient(0, 0, w, 0)
      gradient.addColorStop(0, colors[0])
      gradient.addColorStop(1, colors[1])
      ctx.fillStyle = gradient

      if (analyser && data && isPlaying) {
        analyser.getByteFrequencyData(data)
      }

      for (let i = 0; i < bars; i++) {
        let value: number
        if (analyser && data && isPlaying) {
          const idx = Math.floor((i / bars) * data.length)
          value = data[idx] / 255
        } else {
          value = 0.04
        }
        const barHeight = Math.max(3, value * h)
        const x = i * (barWidth + gap)
        const y = (h - barHeight) / 2
        const r = Math.min(barWidth / 2, 3)
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, r)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [analyser, isPlaying, colors])

  return <canvas ref={canvasRef} className="visualizer" aria-hidden="true" />
}
