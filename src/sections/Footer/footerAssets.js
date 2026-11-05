import playStore from '../../../other_images/play_store (2).png'
import appStore from '../../../other_images/app_store (1).png'
import youtube from '../../../testimonial_icon/Link - YouTube.png'
import instagram from '../../../testimonial_icon/Link - Instagram.png'
import x from '../../../testimonial_icon/Link - X.png'
import tiktok from '../../../testimonial_icon/Link - TikTok.png'

// Populate with approved destinations when supplied; never infer profile handles.
export const FOOTER_LINKS = {
  stores: [
    { label: 'Get it on Play Store', image: playStore, href: null },
    { label: 'Download on App Store', image: appStore, href: null },
  ],
  social: [
    { label: 'YouTube', image: youtube, href: null },
    { label: 'Instagram', image: instagram, href: null },
    { label: 'X', image: x, href: null },
    { label: 'TikTok', image: tiktok, href: null },
  ],
  company: ['About Us', 'Download', 'Blog', 'FAQs', 'Privacy policy', 'Terms of use'].map(label => ({ label, href: label === 'Download' ? '#download-spenda' : null })),
}
