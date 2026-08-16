// Business knowledge for the AI receptionist.
//
// Stage 1: static facts + guardrails only. The AI must NEVER invent prices,
// flavors, availability, or policies — it falls back to "the owner will
// follow up" when it doesn't know something.
//
// Stage 2 (menu, prices, order-taking): extend `business` with a structured
// menu catalog and expose it here so `buildSystemInstruction()` can inject
// it. The phone conversation handler already routes through this module.

export const business = {
  name: "Lo's Flan",
  description:
    'a small, luxury handmade flan bakery in Santa Barbara, California',
  tagline: 'The Journey of a Perfect Flan',
  address: '218 Calle Dulce, Santa Barbara, CA 93101',
  phone: '+1 (805) 555-0146',
  email: 'hola@flandeoro.com',
  website: 'https://kenclarkz.github.io/Lo-Flan/',
  hours: [
    { days: 'Tuesday through Friday', time: '9:00 am to 6:00 pm' },
    { days: 'Saturday and Sunday', time: '8:00 am to 4:00 pm' },
    { days: 'Monday', time: 'closed (baking day)' },
  ],
  menu: [
    {
      name: 'Classic Original Flan',
      price: 20,
      slices: 8,
      slicePrice: 3.5,
      description: 'Silky caramel flan made from fresh milk, eggs and vanilla.',
    },
    {
      name: 'Chocolate Flan',
      price: 26,
      slices: 8,
      slicePrice: 4.5,
      description: 'Rich dark chocolate folded into the classic custard.',
    },
    {
      name: 'Oreo Flan',
      price: 28,
      slices: 8,
      slicePrice: 5,
      description: 'Cookie crumble mixed into the classic custard.',
    },
  ],
  ordering: {
    current: 'Order through the website chat bot, or by phone call — pickup at the bakery or local delivery in Santa Barbara.',
    pickup: 'Pickup is available at the bakery during business hours.',
    delivery: 'Local delivery is available in Santa Barbara — ask for details when you order.',
    leadTime: 'Orders are best placed at least a day in advance.',
  },
  order: {
    current:
      'Place an order through the website chat bot, by calling the bakery, or via the Facebook Messenger button on the website (m.me/losflan).',
    byPhone: true,
  },
}

export function formatHours(hours = business.hours) {
  return hours.map((h) => `${h.days}: ${h.time}`).join(', ')
}

/**
 * Build the system instruction that shapes the AI's behavior on the phone.
 * @param {{ business?: object } | undefined} overrides
 * @returns {string}
 */
export function buildSystemInstruction(overrides = {}) {
  const biz = overrides.business ?? business

  const facts = [
    `Business name: ${biz.name}`,
    `What it is: ${biz.description}`,
    `Tagline: ${biz.tagline}`,
    `Location: ${biz.address}`,
    `Hours: ${formatHours(biz.hours)}`,
    `Phone: ${biz.phone}`,
    `Email: ${biz.email}`,
    `Website: ${biz.website}`,
    `How customers currently order: ${biz.ordering.current}`,
    `Pickup: ${biz.ordering.pickup}`,
    `Delivery: ${biz.ordering.delivery}`,
    `Lead time: ${biz.ordering.leadTime}`,
  ]

  const menuLines = biz.menu.map(
    (m) =>
      `- ${m.name}: $${m.price} for a whole flan (${m.slices} slices) or $${m.slicePrice} per slice. ${m.description}`
  )

  return [
    `You are the AI receptionist for ${biz.name}, ${biz.description}.`,
    'You answer inbound phone calls warmly and helpfully, in a friendly, natural, spoken tone.',
    'A spoken greeting was already played to the caller before you connected. DO NOT repeat a greeting or introduce yourself again — just wait for the caller to speak and respond naturally.',
    '',
    'Here are the only business facts you may rely on:',
    ...facts.map((f) => `- ${f}`),
    '',
    'Menu and prices:',
    ...menuLines,
    '',
    'Rules:',
    '- Answer questions using ONLY the facts above.',
    '- NEVER invent or guess prices, flavors, menu items, availability, lead times, or any business policy beyond the menu and facts above.',
    '- If the caller asks about anything you do not know, say you do not have that information yet and that the owner will follow up with them.',
    '- If the caller wants to place an order, help them: collect the flavor, quantity (whole flans and/or slices), pickup or delivery preference, and a call-back name or number. Then confirm the order and total, and say the owner will follow up to confirm.',
    '- If the caller asks whether you are a robot or AI, be honest and friendly: say yes, you are the AI receptionist, and that the owner will follow up on anything that needs a human.',
    '- If you do not understand, politely ask them to repeat or clarify.',
    '- Keep responses short, conversational, and natural for spoken voice. No lists, no markdown, no emoji.',
    '- Do not make promises, guarantees, or commitments about exact timing.',
    '',
    'The conversation is taking place over the phone with a real customer, so be gracious, patient, and concise.',
  ].join('\n')
}
