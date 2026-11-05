import { TESTIMONIAL_ASSETS } from './testimonialAssets.js'
// Transcribed from testimonial_reference.png; no ratings or verification claims added.
export const TESTIMONIALS = [
  { quote: 'We love Spenda', name: 'Mr stupendous', source: 'X' },
  { quote: 'I recommend everyone to have and use this app, this is the new generation of cryptocurrency.', name: 'Future of Crypto', source: 'App Store' },
  { quote: "A hell of a fast app, I haven't seen any with awesome transaction speed like spenda... keep up the good work good", name: 'Jide Badmus', source: 'Google Play' },
  { quote: 'This is one of the easiest way i have traded crypto in all my life.', name: 'Mr Slim', source: 'X' },
  { quote: 'Easy crypto payment for everyone', name: '@Web3cheff', source: 'Instagram' },
  { quote: 'I love spenda.', name: 'iTACHI', source: 'X' },
  { quote: 'I swear there\u2019s nothing you\u2019ll tell me this thing runs on 5Gb see speed asap payment rate sweeeeet!!!', name: 'Victorvalacv', source: 'App Store' },
].map(review => ({ ...review, platformIcon: TESTIMONIAL_ASSETS.platforms[review.source] }))
