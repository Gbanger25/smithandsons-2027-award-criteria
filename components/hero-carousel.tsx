"use client"

import { useEffect, useRef, useState } from "react"

export type HeroSlide = {
  src: string
  alt: string
  /**
   * CSS object-position for the crop. Lower vertical values pull the subject
   * further down the frame (e.g. "center 25%"). Defaults to "center".
   */
  position?: string
}

const SLIDE_MS = 5000

/**
 * Background image carousel for the Awards Criteria hero.
 *
 * Slides translate horizontally as a single track so the motion reads as a
 * genuine slide rather than a crossfade. It sits behind the hero copy, so the
 * images are decorative-with-context: each one carries an alt describing the
 * moment for screen readers, and the auto-advance pauses on hover/focus and
 * when the user prefers reduced motion.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = useRef(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    reducedMotion.current = query.matches
    const onChange = () => {
      reducedMotion.current = query.matches
    }
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (paused || slides.length < 2) return
    const id = window.setInterval(() => {
      if (reducedMotion.current) return
      setIndex((current) => (current + 1) % slides.length)
    }, SLIDE_MS)
    return () => window.clearInterval(id)
  }, [paused, slides.length])

  return (
    <>
      {/* Image track sits behind the hero's gradient scrims. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-1000 ease-in-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.src} className="relative h-full w-full shrink-0 grow-0 basis-full">
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover"
                style={{ objectPosition: slide.position ?? "center" }}
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls live above the scrims so they stay clickable. */}
      <div
        className="absolute bottom-5 left-0 right-0 z-10 flex justify-center gap-2 px-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === index
          return (
            <button
              key={slide.src}
              type="button"
              onClick={() => setIndex(slideIndex)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              aria-label={`Show hero image ${slideIndex + 1} of ${slides.length}: ${slide.alt}`}
              aria-current={active ? "true" : undefined}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: active ? "1.75rem" : "0.375rem",
                backgroundColor: active
                  ? "var(--aw-apply-heading)"
                  : "color-mix(in srgb, var(--aw-apply-heading) 40%, transparent)",
              }}
            />
          )
        })}
      </div>
    </>
  )
}
