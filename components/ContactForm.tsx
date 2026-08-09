'use client'

import { Send } from 'lucide-react'

export function ContactForm() {
  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-cream/70 mb-2">
            Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-4 py-3 bg-cream/5 border border-cream/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-cream/70 mb-2">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 bg-cream/5 border border-cream/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
          />
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-cream/70 mb-2">
          Subject *
        </label>
        <select
          id="subject"
          name="subject"
          required
          className="w-full px-4 py-3 bg-cream/5 border border-cream/10 rounded-xl text-cream focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold appearance-none bg-no-repeat bg-right pr-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23C9A96A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          }}
        >
          <option value="">Select a topic</option>
          <option value="general">General Inquiry</option>
          <option value="catering">Catering & Events</option>
          <option value="wholesale">Wholesale Partnership</option>
          <option value="custom">Custom Order</option>
          <option value="press">Press & Media</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-cream/70 mb-2">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="w-full px-4 py-3 bg-cream/5 border border-cream/10 rounded-xl text-cream placeholder-cream/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all resize-none"
          placeholder="Tell us about your order, event, or question..."
        />
      </div>
      <button type="submit" className="btn-primary w-full sm:w-auto">
        <Send className="w-5 h-5 mr-2" strokeWidth={2} />
        Send Message
      </button>
      <p className="text-xs text-cream/40 text-center">
        By submitting, you agree to our Privacy Policy.
      </p>
    </form>
  )
}