import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export { gsap, ScrollTrigger, useGSAP }

export const ease = {
  expo: 'power4.inOut',
  out: 'power3.out',
  inOut: 'power2.inOut',
}
