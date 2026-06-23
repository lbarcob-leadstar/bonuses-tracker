'use client'
import dynamic from 'next/dynamic'
const TrackerApp = dynamic(() => import('./TrackerApp'), { ssr: false })
export default function AppPage() { return <TrackerApp /> }
