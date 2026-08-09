import { Metadata } from 'next'
import Link from 'next/link'
import { Reveal } from '@/components/Reveal'
import { cn } from '@/lib/utils'
import { Sparkles, Heart, Leaf, Award, Truck, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Our Story',
  description: "The story behind Lo's Flan — a luxury handmade flan bakery born from obsession with the perfect custard.",
}

const values = [
  { icon: Heart, title: 'Obsessive Quality', desc: 'We test every batch. If it\'s not perfect, it doesn\'t leave the kitchen.' },
  { icon: Leaf, title: 'Honest Ingredients', desc: 'Six ingredients. No stabilisers, no artificial flavours, no shortcuts.' },
  { icon: Award, title: 'Craft Over Scale', desc: 'Every flan is hand-poured, hand-torched, and hand-packed. Always.' },
  { icon: Sparkles, title: 'Moments Matter', desc: 'We\'re not selling dessert. We\'re helping you create memories.' },
]

const timeline = [
  { year: '2019', title: 'The First Flan', desc: 'Founder Isabella burns her first caramel in a tiny Santa Barbara apartment kitchen. She tries again. And again.' },
  { year: '2020', title: 'The Pop-Up', desc: 'Weekend farmers market stall sells out in 47 minutes. The line wraps around the block.' },
  { year: '2021', title: 'The Kitchen', desc: 'A 1,200 sq ft bakery opens on Calle Dulce. Three copper ovens. One mission.' },
  { year: '2023', title: 'National Shipping', desc: 'Overnight cold-chain delivery launches. Flans arrive chilled, perfect, nationwide.' },
  { year: '2024', title: 'The Journey', desc: 'This experience goes live — so everyone can witness the alchemy of six ingredients becoming one.' },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-espresso via-espresso to-espresso-dark" />
        <div className="relative z-10 max-w-4xl text-center">
          <Reveal className="eyebrow">Our Story</Reveal>
          <Reveal delay={0.1} className="display mt-3 text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.05] mb-6">
            Six ingredients.<br />One obsession.
          </Reveal>
          <Reveal delay={0.2} className="text-lg sm:text-xl text-cream/70 max-w-2xl mx-auto leading-relaxed">
            Lo&apos;s Flan began with a simple question: what if we made flan the way
            abuelas used to — no shortcuts, no stabilisers, just honest ingredients
            and patience?
          </Reveal>
        </div>
      </section>

      {/* Founder Story */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Reveal className="eyebrow">The Beginning</Reveal>
              <Reveal delay={0.1} className="display mt-3 text-3xl sm:text-4xl font-light leading-tight mb-6">
                It started with a burnt caramel.
              </Reveal>
              <Reveal delay={0.2} className="prose prose-invert max-w-none text-cream/70 leading-relaxed space-y-4">
                <p>
                  Isabella Moreno grew up watching her abuela make flan in their
                  Oaxaca kitchen. No measuring cups. No timers. Just intuition,
                  six ingredients, and a copper pot that had been in the family
                  for three generations.
                </p>
                <p>
                  When she moved to Santa Barbara, she couldn&apos;t find flan that
                  tasted like home. The store-bought versions were rubbery,
                  overly sweet, missing that deep caramel complexity. So she
                  started making her own.
                </p>
                <p>
                  The first fifty attempts ended in the bin. Burnt caramel.
                  Curdled custard. Soggy bottoms. But attempt fifty-one — that
                  one was perfect. Silky, glossy, with a caramel that sang.
                </p>
                <p>
                  She brought it to the Saturday farmers market. It sold out
                  before noon. People asked for the recipe. She smiled and said,
                  <em>&ldquo;It&apos;s not a recipe. It&apos;s a ritual.&rdquo;</em>
                </p>
              </Reveal>
            </div>
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-cream/5">
              <Reveal delay={0.3}>
                <svg viewBox="0 0 900 1100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Founder Isabella in her kitchen">
                  <rect width="900" height="1100" fill="#1B120C"/>
                  <ellipse cx="450" cy="920" rx="380" ry="80" fill="#2B1B10"/>
                  <ellipse cx="450" cy="880" rx="340" ry="68" fill="url(#plateGrad)"/>
                  <defs>
                    <radialGradient id="plateGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#EFE6D6"/>
                      <stop offset="100%" stopColor="#DCC9A8"/>
                    </radialGradient>
                    <radialGradient id="custardGrad" cx="50%" cy="30%" r="60%">
                      <stop offset="0%" stopColor="#F4DCAB"/>
                      <stop offset="100%" stopColor="#E8C48A"/>
                    </radialGradient>
                    <linearGradient id="caramelGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C97B2C"/>
                      <stop offset="100%" stopColor="#8A4514"/>
                    </linearGradient>
                  </defs>
                  <path d="M280 830 v-280 q0 -180 170 -180 q170 0 170 180 v280 z" fill="url(#custardGrad)"/>
                  <ellipse cx="450" cy="450" rx="140" ry="38" fill="url(#caramelGrad)"/>
                  <ellipse cx="450" cy="450" rx="95" ry="24" fill="#B5651D"/>
                  <g stroke="#8A451D" strokeWidth="3" fill="none">
                    <path d="M340 450 q-18 70 4 140"/>
                    <path d="M410 440 q-12 90 8 180"/>
                    <path d="M500 445 q10 85 -2 160"/>
                    <path d="M570 450 q16 75 -6 145"/>
                  </g>
                  <text x="450" y="1020" textAnchor="middle" fontFamily="Georgia, serif" fontSize="28" fill="#C9A96A" opacity="0.6">Isabella&apos;s Copper Pot</text>
                </svg>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 py-20 bg-espresso-dark border-y border-cream/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Reveal className="eyebrow">The Journey</Reveal>
            <Reveal delay={0.1} className="display mt-3 text-3xl sm:text-4xl font-light">
              From kitchen to nationwide
            </Reveal>
          </div>
          <div className="relative">
            <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-px bg-cream/10" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <Reveal key={item.year} delay={i * 0.08} className="relative flex lg:flex-row gap-8">
                  <div className="absolute left-8 lg:left-[calc(50%-120px)] top-4 w-6 h-6 rounded-full bg-gold border-4 border-espresso z-10 lg:-translate-x-full" />
                  <div className={cn(
                    'w-[calc(50%-140px)] lg:w-[calc(50%-140px)] px-6 py-4',
                    i % 2 === 0 ? 'lg:ml-auto text-right' : 'lg:mr-auto'
                  )}>
                    <span className="eyebrow">{item.year}</span>
                    <h3 className="font-serif text-2xl font-light mt-2 mb-2">{item.title}</h3>
                    <p className="text-cream/70">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Reveal className="eyebrow">Our Values</Reveal>
            <Reveal delay={0.1} className="display mt-3 text-3xl sm:text-4xl font-light">
              What we stand for
            </Reveal>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.1} className="group p-8 rounded-3xl bg-cream/5 border border-cream/10 hover:border-gold/30 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-cream/5 flex items-center justify-center text-gold mb-6 group-hover:bg-gold/10 transition-colors">
                  <v.icon className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl font-light mb-3">{v.title}</h3>
                <p className="text-cream/60 leading-relaxed">{v.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 bg-gradient-to-b from-espresso to-espresso-dark border-t border-cream/10">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal className="eyebrow">Ready to Taste?</Reveal>
          <Reveal delay={0.1} className="display mt-3 text-3xl sm:text-4xl font-light leading-tight mb-6">
            Experience the journey yourself
          </Reveal>
          <Reveal delay={0.2} className="text-cream/60 mb-8 max-w-xl mx-auto">
            Order a flan today and taste the difference six honest ingredients make.
          </Reveal>
          <Reveal delay={0.3} className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/products" className="btn-primary">Order Now</Link>
            <Link href="/contact" className="btn-ghost">Visit the Bakery</Link>
          </Reveal>
        </div>
      </section>
    </main>
  )
}