'use client'

import dynamic from 'next/dynamic'
import ProcessIndicator from '@/components/ProcessIndicator'

// Import scenes dynamically to avoid SSR issues with Three.js
const HeroFlan = dynamic(() => import('@/components/HeroFlan'), { ssr: false })
const IngredientExplosion = dynamic(() => import('@/components/IngredientExplosion'), { ssr: false })
const BlenderScene = dynamic(() => import('@/components/BlenderScene'), { ssr: false })
const BatterPour = dynamic(() => import('@/components/BatterPour'), { ssr: false })
const OvenScene = dynamic(() => import('@/components/OvenScene'), { ssr: false })
const FinalProduct = dynamic(() => import('@/components/FinalProduct'), { ssr: false })
const ScrollController = dynamic(() => import('@/components/ScrollController'), { ssr: false })
const JourneyFireCanvas = dynamic(() => import('@/components/JourneyFireCanvas'), { ssr: false })

export default function Experience() {
  return (
    <ScrollController>
      <JourneyFireCanvas />
      <ProcessIndicator />
      <HeroFlan />
      <IngredientExplosion />
      <BlenderScene />
      <BatterPour />
      <OvenScene />
      <FinalProduct />
    </ScrollController>
  )
}