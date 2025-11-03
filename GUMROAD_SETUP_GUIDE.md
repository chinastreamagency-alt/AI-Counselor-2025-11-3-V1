# Gumroad Integration Setup Guide

This guide will help you set up Gumroad for your AI Counselor app with payment processing and affiliate tracking.

## 1. Create Gumroad Account

1. Go to https://gumroad.com/
2. Click "Start Selling" and create your account
3. Complete your profile and payment information

## 2. Create Products (Recommended: Multiple Products Approach)

Create separate products for each time package:

### Product 1: AI Counselor - 1 Hour
- **Price**: $19
- **Product Type**: Digital Product
- **Description**: "Get 1 hour of AI counseling with Arina. Talk time never expires."
- **Permalink**: `ai-counselor-1hour`

### Product 2: AI Counselor - 5 Hours (Most Popular)
- **Price**: $85
- **Description**: "Get 5 hours of AI counseling with Arina. Save $10! Talk time never expires."
- **Permalink**: `ai-counselor-5hours`

### Product 3: AI Counselor - 10 Hours
- **Price**: $150
- **Description**: "Get 10 hours of AI counseling with Arina. Save $40! Talk time never expires."
- **Permalink**: `ai-counselor-10hours`

### Product 4: AI Counselor - 20 Hours
- **Price**: $280
- **Description**: "Get 20 hours of AI counseling with Arina. Save $100! Talk time never expires."
- **Permalink**: `ai-counselor-20hours`

## 3. Update Product URLs in Code

In `components/payment-modal.tsx`, replace the placeholder URLs with your actual Gumroad product URLs:

\`\`\`typescript
const pricingPackages = [
  { 
    hours: 1, 
    gumroadUrl: "https://YOURSTORE.gumroad.com/l/ai-counselor-1hour"
  },
  // ... update all URLs
]
\`\`\`

## 4. Set Up Webhook for Purchase Verification

1. Go to Gumroad Settings → Advanced → Webhooks
2. Add webhook URL: `https://your-app-domain.com/api/gumroad-webhook`
3. This will notify your app when purchases are made

## 5. Enable Affiliate Program

### For Each Product:

1. Go to product settings
2. Click "Affiliates" tab
3. Enable "Allow affiliates to promote this product"
4. Set commission rate (recommended: 20-30%)
5. Click "Save"

### Add Affiliates:

1. Go to your Gumroad Affiliates page
2. Click "Add affiliate"
3. Enter affiliate's email (must have Gumroad account)
4. Select product
5. Set commission percentage
6. Click "Add affiliate"

The affiliate will receive an email with their unique affiliate link like:
`https://yourstore.gumroad.com/l/ai-counselor-5hours?ref=AFFILIATE_ID`

## 6. Affiliate Link Tracking

Your app automatically tracks affiliate referrals:

1. When someone visits your app with `?ref=AFFILIATE_ID` or `?affiliate=AFFILIATE_ID`
2. The app stores this in the URL
3. When they click "Purchase", the affiliate parameter is passed to Gumroad
4. Gumroad automatically credits the affiliate with commission

### Share Links with Affiliates:

Give affiliates these formats:
- `https://your-app-domain.com/?ref=THEIR_AFFILIATE_ID`
- They can use link shorteners (bit.ly, etc.) as long as they point to this URL

## 7. Test the Integration

1. Create a test product or use Gumroad's test mode
2. Click "Purchase" button in your app
3. Complete test purchase
4. Verify webhook is received at `/api/gumroad-webhook`
5. Check that hours are credited to user account

## 8. Embed Options

Your app uses the **Overlay Widget** which:
- Opens payment in a popup
- Keeps users on your site
- Provides seamless experience
- Automatically handles affiliate tracking

## 9. Commission Payout

Gumroad handles all commission payouts automatically:
- Affiliates get paid directly by Gumroad
- You don't need to manage payments
- Commissions are paid on your payout schedule
- Affiliates can track earnings in their Gumroad dashboard

## 10. Monitoring Sales

Track your sales in Gumroad dashboard:
- View all purchases
- See affiliate-driven sales
- Export data for analysis
- Monitor commission payouts

## Alternative: Single Product with Variants

If you prefer one product with multiple options:

1. Create one product: "AI Counselor - Talk Time"
2. Use Gumroad's "Variants" feature
3. Add variants: 1 hour ($19), 5 hours ($85), etc.
4. Update code to pass variant parameter

However, **multiple products is recommended** because:
- Easier to set different affiliate rates per package
- Clearer analytics per time package
- Simpler to manage and promote
- Better for A/B testing pricing

## Support

- Gumroad Help: https://help.gumroad.com
- Gumroad API Docs: https://app.gumroad.com/api
- Contact Gumroad Support for technical issues
