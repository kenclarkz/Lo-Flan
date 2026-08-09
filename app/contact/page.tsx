import { Metadata } from 'next'
import { Reveal } from '@/components/Reveal'
import { ContactForm } from '@/components/ContactForm'
import { Mail, MapPin, Phone, Clock, Send, CheckCircle2 } from 'lucide-react'
import { site } from '@/data/site'

export const metadata: Metadata = {
  title: 'Contact',
  description: "Get in touch with Lo's Flan - custom orders, catering, wholesale, or just say hello.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      <section className="relative min-h-[60vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-espresso via-espresso to-espresso-dark" />
        <div className="relative z-10 max-w-4xl text-center">
          <Reveal className="eyebrow">Contact</Reveal>
          <Reveal delay={0.1} className="display mt-3 text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.05] mb-6">
            Let&apos;s talk flan.
          </Reveal>
          <Reveal delay={0.2} className="text-lg sm:text-xl text-cream/70 max-w-2xl mx-auto leading-relaxed">
            Custom orders, catering inquiries, wholesale partnerships, or just a question
            about our flans - we&apos;d love to hear from you.
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-8">
              <Reveal className="eyebrow">Visit Us</Reveal>
              <Reveal delay={0.1} className="font-serif text-3xl font-light mb-8">
                218 Calle Dulce, Santa Barbara
              </Reveal>

              <dl className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cream/5 flex items-center justify-center text-gold flex-shrink-0">
                    <MapPin className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <dt className="eyebrow mb-1">Address</dt>
                    <dd className="text-cream/70">{site.address}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cream/5 flex items-center justify-center text-gold flex-shrink-0">
                    <Phone className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <dt className="eyebrow mb-1">Phone</dt>
                    <dd className="text-cream/70">
                      <a href={`tel:${site.phone.replace(/\D/g, '')}`} className="hover:text-gold transition-colors">{site.phone}</a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cream/5 flex items-center justify-center text-gold flex-shrink-0">
                    <Mail className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <dt className="eyebrow mb-1">Email</dt>
                    <dd className="text-cream/70">
                      <a href={`mailto:${site.email}`} className="hover:text-gold transition-colors">{site.email}</a>
                    </dd>
                  </div>
                </div>
              </dl>

              <Reveal delay={0.2} className="pt-8 border-t border-cream/10">
                <h3 className="eyebrow mb-4">Hours</h3>
                <dl className="space-y-3 text-cream/70">
                  {site.hours.map((h, i) => (
                    <div key={i} className="flex justify-between gap-4">
                      <dt className="text-cream/50">{h.day}</dt>
                      <dd className="whitespace-nowrap">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            <div className="lg:col-span-2">
              <Reveal className="eyebrow">Send a Message</Reveal>
              <Reveal delay={0.1} className="font-serif text-3xl font-light mb-8">
                We typically reply within 24 hours.
              </Reveal>

              <ContactForm />
            </div>
          </div>

          <div className="mt-20 grid md:grid-cols-2 gap-8">
            <Reveal delay={0.1} className="p-8 rounded-3xl bg-cream/5 border border-cream/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blush/20 flex items-center justify-center text-blush">
                  <Send className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-light">Catering & Events</h3>
                  <p className="text-cream/50 text-sm">Weddings, corporate, birthdays - we build custom flan towers and dessert tables.</p>
                </div>
              </div>
              <ul className="space-y-2 text-cream/70 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Minimum 48 hours notice</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Serves 12-200+</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Delivery & setup available</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Dietary accommodations</li>
              </ul>
              <a href="/contact?subject=catering" className="mt-6 inline-flex items-center gap-2 text-gold hover:text-gold-light font-medium text-sm uppercase tracking-[0.1em]">
                Request a quote <Send className="w-4 h-4" strokeWidth={2} />
              </a>
            </Reveal>

            <Reveal delay={0.2} className="p-8 rounded-3xl bg-cream/5 border border-cream/10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-sage/20 flex items-center justify-center text-sage">
                  <Mail className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-light">Wholesale Partnerships</h3>
                  <p className="text-cream/50 text-sm">Stock Lo&apos;s Flan in your caf&eacute;, restaurant, or specialty shop.</p>
                </div>
              </div>
              <ul className="space-y-2 text-cream/70 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Volume pricing tiers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Weekly fresh delivery</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Marketing support & POS</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> Exclusive seasonal access</li>
              </ul>
              <a href="/contact?subject=wholesale" className="mt-6 inline-flex items-center gap-2 text-gold hover:text-gold-light font-medium text-sm uppercase tracking-[0.1em]">
                Become a partner <Send className="w-4 h-4" strokeWidth={2} />
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 border-y border-cream/10">
        <div className="max-w-7xl mx-auto">
          <Reveal className="aspect-video rounded-3xl bg-cream/5 flex items-center justify-center relative overflow-hidden">
            <div className="text-center text-cream/50">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gold/50" strokeWidth={1.5} />
              <p className="font-serif text-xl">Interactive map coming soon</p>
              <p className="text-sm mt-1">{site.address}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
