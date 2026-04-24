const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema(
  {
    brandName: { type: String, default: 'Shiv Travels' },
    brandLogoUrl: { type: String, default: '' }, // optional; can be /assets/...

    agentPhone: { type: String, default: '9824926485' },
    whatsappAdminPhone: { type: String, default: '9824926485' },

    locationLine: { type: String, default: 'Vadodara, Gujarat, India' },

    heroTitle: { type: String, default: 'Your Journey, Our Cars' },
    heroSubtitle: {
      type: String,
      default: 'Explore premium cars for every trip — sedans, SUVs, tempo travellers and more.',
    },

    servicesIntro: { type: String, default: 'Services provided by Shiv Travels' },

    whyChooseTitle: { type: String, default: 'Why Choose Shiv Travel' },

    missionText: {
      type: String,
      default:
        'To make travel accessible, reliable, and joyful for every traveler — respecting your time, budget, and preferences. We remove the planning stress so you can create memories.',
    },
    visionText: {
      type: String,
      default:
        'To become India’s most loved travel brand by consistently delivering trust, value, and exceptional service — one journey at a time.',
    },

    footerCtaText: { type: String, default: 'Let’s Plan Your Next Trip' },
    footerSupportLabel: { type: String, default: 'Contact Support' },

    featuredCard: {
      carName: { type: String, default: 'Innova Crysta' },
      carImageUrl: {
        type: String,
        default: '/assets/images/innova-crysta.svg',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);

