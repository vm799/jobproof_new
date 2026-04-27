// Stripe Payment Links — public buy.stripe.com URLs, not secrets
// GBP: Solo £29 | Team £99 | Enterprise £299
export const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  tier1: process.env.NEXT_PUBLIC_STRIPE_LINK_TIER1 || 'https://buy.stripe.com/3cI9AT6lL00U7kbfATeAg08',
  tier2: process.env.NEXT_PUBLIC_STRIPE_LINK_TIER2 || 'https://buy.stripe.com/8x24gzh0p14Y7kbdsLeAg07',
  tier3: process.env.NEXT_PUBLIC_STRIPE_LINK_TIER3 || 'https://buy.stripe.com/dRm4gz5hH9Bu8of3SbeAg06',
}
