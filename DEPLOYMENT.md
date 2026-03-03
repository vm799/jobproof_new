# 🚀 Deployment Guide - Get JobProof Live in 10 Minutes

**Goal:** Deploy to Vercel (free tier) and get a live URL you can share with customers.

---

## Step 1: Push to GitHub (5 minutes)

### Create GitHub Repo
1. Go to https://github.com/new
2. Name: `jobproof`
3. Description: `Construction field evidence app - never lose a lien claim`
4. **Public** (so you can use Vercel free tier)
5. **Do NOT initialize with README**
6. Click **Create repository**

### Push Your Code
```bash
cd jobproof

git init
git add .
git commit -m "Initial commit: JobProof - offline-first field evidence"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jobproof.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**Result:** Your code is now on GitHub at:
```
https://github.com/YOUR_USERNAME/jobproof
```

---

## Step 2: Deploy to Vercel (3 minutes)

### Option A: Automatic (Easiest)

1. Go to https://vercel.com
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. Paste your GitHub URL: `https://github.com/YOUR_USERNAME/jobproof`
5. Click **Import**
6. Vercel auto-detects Next.js
7. Click **Deploy**

✅ **Your app is live!** URL: `https://jobproof-XXXX.vercel.app`

### Option B: Using Vercel CLI

```bash
npm install -g vercel
vercel login  # Authenticate with GitHub
vercel        # Deploy from current directory
```

---

## Step 3: Set Up Custom Domain (2 minutes)

### Use Your Own Domain
If you own `jobproof.pro` or similar:

1. In Vercel dashboard, go to your project
2. Go to **Settings → Domains**
3. Click **Add Domain**
4. Enter your domain name
5. Point your domain's DNS to Vercel:
   - Your registrar (GoDaddy, Namecheap, etc.)
   - Change nameservers to:
     - `ns1.vercel.com`
     - `ns2.vercel.com`

**Wait 5-10 minutes** for DNS to propagate.

---

## Step 4: Add Mailchimp Integration (3 minutes)

### Get Mailchimp API Key
1. Create account: https://mailchimp.com
2. Go to **Account** → **Extras** → **API Keys**
3. Create a key, copy it
4. Get your **Audience ID** from Lists section

### Set Environment Variables in Vercel
1. In Vercel dashboard, go to **Settings → Environment Variables**
2. Add:
   ```
   MAILCHIMP_API_KEY = your_api_key
   MAILCHIMP_AUDIENCE_ID = your_audience_id
   MAILCHIMP_SERVER_PREFIX = us1  (or your region)
   ```
3. Click **Save**
4. Deploy again: `vercel --prod`

**Now email signups will go to your Mailchimp list!**

---

## Step 5: Test Everything (2 minutes)

### Visit Your Live Site
1. Go to `https://jobproof-XXXX.vercel.app`
2. Test landing page (scroll through)
3. Click "Try Demo"
4. Try taking photos (or upload test images)
5. Try signing
6. Download proof file

### Test Email Signup
1. Scroll to bottom
2. Enter your email
3. Click "Get Access"
4. Check your email (should receive welcome)
5. Check Mailchimp list (email should appear)

✅ **Everything works!**

---

## 📊 Monitoring & Analytics

### Add Google Analytics (Optional)
1. Create GA4 property: https://analytics.google.com
2. Get your Measurement ID
3. Add to `next.config.js` or use `gtag` script in layout

### Monitor Deployments
- Vercel dashboard shows all deployments
- GitHub shows all commits
- Check Mailchimp for signups

---

## 🔄 Making Updates

### Update Your Code
```bash
# Make changes to code
git add .
git commit -m "Update: description of changes"
git push origin main

# Vercel auto-deploys from main branch
# Check https://vercel.com dashboard for deployment status
```

**Deploys automatically!** No manual steps needed.

---

## 💰 Costs

| Service | Cost |
|---------|------|
| Vercel | FREE (up to 100GB bandwidth/mo) |
| Domain | ~$10/year (optional) |
| Mailchimp | FREE (up to 500 contacts) |
| **Total** | **FREE to start** |

---

## 🎯 What's Live?

Once deployed, your site has:

✅ Landing page (converts visitors to email signups)
✅ Interactive demo (PWA, offline-capable)
✅ Email capture (Mailchimp integration)
✅ Mobile responsive (works on phone)
✅ Fast performance (Vercel CDN)
✅ SSL/HTTPS (automatic)

---

## 📝 Next Steps

### Week 1: Drive Traffic
- Share link on Reddit (r/construction)
- Cold email construction PMs
- Share on LinkedIn
- Ask friends to test & give feedback

### Week 2: Optimize
- Check analytics (what's the conversion rate?)
- A/B test headlines
- Refine copy based on feedback
- Add testimonials from beta users

### Week 3+: Build SaaS
- Add authentication
- Build manager dashboard
- Add Stripe billing
- Build team management
- Launch full product

---

## ⚡ Performance Tips

### Check Your Speed
```bash
# Check Lighthouse score
npm run build
npm start
# Open Chrome DevTools → Lighthouse
```

### Optimize Images
```bash
# Use next/image component
# Vercel optimizes automatically
```

### Monitor Database (Future)
When you add a database:
- Use Vercel KV for Redis
- Use Vercel Postgres
- Both free tier available

---

## 🔒 Security

### Environment Variables
- Never commit `.env` files
- Store secrets in Vercel dashboard
- Use `NEXT_PUBLIC_` only for public values

### Authentication (Future)
- Use Vercel's Auth.js
- Or Auth0 free tier
- Or Clerk (free tier)

---

## 📞 Troubleshooting

**Q: Deployment failed**
A: Check Vercel logs. Usually missing dependency. Run `npm install` locally first.

**Q: Custom domain not working**
A: DNS changes take 5-30 minutes. Wait and try again.

**Q: Email signup not working**
A: Check environment variables in Vercel dashboard. Restart deployment.

**Q: App slow on mobile**
A: Check image sizes. Use `next/image` for optimization.

---

## ✅ You're Done!

Your JobProof app is now:
- ✅ Live on the internet
- ✅ Accessible from any device
- ✅ Collecting emails
- ✅ Ready to convert customers

**Share your link and start making millions!** 🚀

---

**Vercel Dashboard:** https://vercel.com/dashboard
**GitHub:** https://github.com/YOUR_USERNAME/jobproof
**Live Site:** https://jobproof-XXXX.vercel.app

**Need help?** Check Vercel docs: https://vercel.com/docs
