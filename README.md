# 🏗️ JobProof - Never Lose a Lien Claim Again

**Construction field evidence app with offline-first photo capture, GPS timestamping, client signatures, and cryptographic proof seals.**

Built with React/Next.js. Works completely offline. Designed to make millions.

---

## 🎯 What It Does

1. **Crew gets job link** (via text/email from manager)
2. **Takes before/after photos** (offline, camera works without WiFi)
3. **Captures location & timestamp** (GPS or W3W - works offline)
4. **Client signs off** (digital signature pad on phone/tablet)
5. **File sealed cryptographically** (tamper-proof proof)
6. **Auto-syncs when online** (sends to cloud automatically)
7. **Manager exports as proof** (ready for insurance/court)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run Locally

```bash
# Clone the repo
git clone https://github.com/vm799/jobproof.git
cd jobproof

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Try the Demo
1. Go to homepage
2. Click "Try Free Demo" or "Try Demo" button
3. Follow the flow: before photo → after photo → location → notes → signature → export

**Works completely offline!** Turn off WiFi and try it.

---

## 📱 Mobile First

This is a **Progressive Web App (PWA)**. 

### Install on your phone:
- **iPhone:** Open in Safari → Share → Add to Home Screen
- **Android:** Open in Chrome → Menu → Install App

Then:
- Works offline completely
- Camera access (native iOS/Android)
- Syncs when WiFi available
- Push notifications (future)

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (React 18)
- **Styling:** Tailwind CSS
- **PWA:** next-pwa
- **Camera:** HTML5 getUserMedia
- **Signature:** HTML5 Canvas
- **Crypto:** TweetNaCl.js (for sealing)
- **Storage:** IndexedDB (offline persistence)
- **Hosting:** Vercel
- **Email:** Mailchimp API

---

## 📋 Features Implemented

### Phase 1: MVP (Complete) ✅
- [x] Landing page (conversion-focused)
- [x] Interactive demo (photo capture, offline, signature)
- [x] Cryptographic sealing (tamper-proof)
- [x] GPS timestamping
- [x] Email capture (Mailchimp ready)
- [x] PWA configuration
- [x] Mobile-responsive design
- [x] Export proof file

### Phase 2: SaaS (In Progress)
- [ ] User authentication
- [ ] Team management
- [ ] Manager dashboard
- [ ] Job assignment workflow
- [ ] Stripe billing integration
- [ ] Email automation (5-email nurture)
- [ ] API endpoints

### Phase 3: Scale (Planned)
- [ ] Mobile app (native iOS/Android)
- [ ] Advanced analytics
- [ ] Integrations (insurance APIs, project management tools)
- [ ] Lien filing automation
- [ ] Multi-language support

---

## 🎨 Customization

### Change Your Branding
Edit `app/page.tsx`:
- Hero headline (line 55)
- Logo/colors (Tailwind classes)
- Case study (lines 180-195)
- Features (lines 220-250)
- Pricing (lines 295-340)

### Connect Mailchimp
1. Create Mailchimp account: https://mailchimp.com
2. Get API key from settings
3. Create audience, get audience ID
4. Add to `.env.local`:
```bash
MAILCHIMP_API_KEY=your_key
MAILCHIMP_AUDIENCE_ID=your_id
MAILCHIMP_SERVER_PREFIX=us1  # or your server
```
5. Restart dev server

### Add Email Automation
Update `app/api/subscribe/route.ts` to add tags/automation:
```typescript
merge_fields: {
  SOURCE: 'landing_page',
  CONTACTED: new Date().toISOString()
},
tags: ['jobproof-demo', 'phase-1']
```

---

## 📤 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add MAILCHIMP_API_KEY
vercel env add MAILCHIMP_AUDIENCE_ID
vercel env add MAILCHIMP_SERVER_PREFIX
```

Your site is now live!

### Deploy to Your Own Domain

1. Register domain (jobproof.pro, jobseal.app, etc.)
2. Point DNS to Vercel
3. Add custom domain in Vercel dashboard

---

## 📊 Success Metrics

Track these in Google Analytics:

```bash
# Add GA4 to next.config.js:
"scripts": {
  "gtag": "window.gtag=window.dataLayer||[],function(){gtag.push(arguments)}"
}
```

**Key metrics:**
- Landing page views
- "Try Demo" clicks
- Email signups
- Demo completion rate
- "Get Full Version" clicks

---

## 💬 Conversion Strategy

### Landing Page Flow
1. **Hero** → Attention (problem statement)
2. **Pain points** → Validation (recognition)
3. **Solution** → Desire (shows it works)
4. **Case study** → Proof (real example)
5. **Demo CTA** → Action (try it yourself)
6. **Features** → Reassurance
7. **Pricing** → Clarity
8. **Email form** → Commitment (lowest barrier)

### Email Sequence (After Signup)
- **Day 1:** Welcome + demo link
- **Day 3:** Case study (disputed claim saved $45k)
- **Day 5:** Feature breakdown (offline, GPS, seal)
- **Day 7:** Social proof (testimonial)
- **Day 10:** Limited offer (14 days free)

---

## 🎯 Roadmap to $1M ARR

| Phase | Timeline | Target | Revenue |
|-------|----------|--------|---------|
| **Launch** | Weeks 1-2 | 100 email signups | $0 |
| **Feedback** | Weeks 3-4 | 20 customer interviews | $0 |
| **Build** | Weeks 5-8 | 10 paying customers | $500/mo |
| **Growth** | Months 3-6 | 50 customers | $2.5k/mo |
| **Scale** | Months 6-12 | 300 customers | $15k/mo |
| **Millions** | Year 2 | 2,000+ customers | $100k+/mo |

---

## 📞 Support

### Getting Help
- **Docs:** Read this README
- **Code:** Read comments in `app/page.tsx` and `app/demo/page.tsx`
- **Issues:** Check GitHub issues
- **Contact:** Vaishalimehmi@yahoo.co.uk

### Customization
- Change pricing: Edit `app/page.tsx` line 295
- Change demo flow: Edit `app/demo/page.tsx`
- Add features: Create new routes under `app/`
- Add API endpoints: Create files under `app/api/`

---

## 📄 License

MIT - Use freely for your business

---

## 🚀 Next Steps

1. **Deploy to Vercel** (5 min)
2. **Set up custom domain** (5 min)
3. **Connect Mailchimp** (10 min)
4. **Share link with 100 construction managers** (1 week)
5. **Get 100 email signups** (1 week)
6. **Interview 20 customers** (2 weeks)
7. **Refine based on feedback** (1 week)
8. **Build SaaS features** (3 weeks)
9. **Get 10 paying customers** (2 weeks)
10. **Scale to $1M ARR** (6-12 months)

---

## 💡 Pro Tips

- **A/B test headlines:** Try 5 different hero statements
- **Video demo:** Record 60-sec video of app in action (2x conversion)
- **Social proof early:** Get testimonials from beta customers
- **Cold email works:** 1-2% response rate from construction PMs
- **Reddit is gold:** r/construction, r/HomeImprovement
- **Content marketing:** Blog posts about lien claims (SEO gold)
- **Partnerships:** General contractors, insurance brokers

---

**Built by Rohan Mehmi**
**Contact:** Vaishalimehmi@yahoo.co.uk

**Ready to make millions? Deploy this today.** 🚀
