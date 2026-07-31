'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export default function GaPageViewTracker({ measurementId }: { measurementId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof window.gtag !== 'function') return

    const query = searchParams?.toString()
    const pagePath = query ? `${pathname}?${query}` : pathname

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_path: pagePath,
      page_location: window.location.href,
      send_to: measurementId,
    })
  }, [measurementId, pathname, searchParams])

  return null
}