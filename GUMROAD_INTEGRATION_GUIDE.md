# Gumroad Integration Guide - AI Counselor Time Purchase & Auto-Sync

## Overview
This guide explains how to integrate Gumroad payment with automatic time synchronization for the AI Counselor app.

## Flow Diagram

\`\`\`
User Session → 1 Minute Remaining → Show Purchase Modal
                                          ↓
                                    User Clicks Package
                                          ↓
                              Not Logged In? → Login First
                                          ↓
                              Redirect to Gumroad (with email)
                                          ↓
                              User Completes Payment
                                          ↓
                    Gumroad Sends Webhook → /api/gumroad-webhook
                                          ↓
                              Parse Purchase Data (hours, email, sale_id)
                                          ↓
                              Store in Database & Update User Account
                                          ↓
                    Redirect User → /purchase-success?hours=X
                                          ↓
                              Client Calls /api/sync-purchase
                                          ↓
                              Update Local State & Resume Session
\`\`\`

## 1. Gumroad Product Setup

### Products Created
- **1 Hour Package**: https://chinastream.gumroad.com/l/arina?variant=1hour
- **10 Hours Package**: https://chinastream.gumroad.com/l/arina?variant=10hours
- **100 Hours Package**: https://chinastream.gumroad.com/l/arina?variant=100hours

### Required Gumroad Configuration

1. **Enable Webhooks**:
   - Go to Gumroad Settings → Advanced → Webhooks
   - Add Ping URL: `https://your-domain.com/api/gumroad-webhook`
   - This webhook will be called after every successful purchase

2. **Product Variants**:
   - Each product should have a variant field indicating hours (e.g., "1hour", "10hours", "100hours")
   - This helps the webhook identify which package was purchased

3. **Return URL** (Optional):
   - Set a custom redirect URL in Gumroad product settings
   - Or pass it dynamically via URL parameter: `&redirect_url=https://your-domain.com/purchase-success`

## 2. Webhook Data Format

When a purchase is completed, Gumroad sends a POST request to your webhook URL with the following data:

\`\`\`json
{
  "sale_id": "abc123xyz",
  "product_name": "AI Counselor - 10 Hours",
  "product_permalink": "arina",
  "email": "user@example.com",
  "price": "150",
  "currency": "USD",
  "quantity": 1,
  "variants": {
    "Package": "10hours"
  },
  "affiliate": "affiliate_id_if_any",
  "referrer": "https://referrer-site.com",
  "timestamp": "2025-01-15T10:30:00Z"
}
\`\`\`

### Key Parameters

| Parameter | Description | Usage |
|-----------|-------------|-------|
| `sale_id` | Unique purchase ID | Store for record-keeping and duplicate prevention |
| `email` | Buyer's email | Link purchase to user account |
| `variants` | Product variant info | Extract hours (e.g., "10hours" → 10) |
| `product_name` | Product name | Fallback for extracting hours if variant missing |
| `affiliate` | Affiliate ID | Track referral commissions |
| `price` | Purchase amount | Record transaction value |

## 3. Backend Implementation

### Webhook Endpoint: `/api/gumroad-webhook/route.ts`

**Purpose**: Receive and process Gumroad purchase notifications

**Steps**:
1. Receive POST request from Gumroad
2. Extract hours from `variants` or `product_name`
3. Validate purchase data
4. Store purchase record in database
5. Update user's available hours
6. Log affiliate information (if applicable)
7. Return success response

**Database Schema** (Recommended):

\`\`\`typescript
// Purchase Record
{
  saleId: string          // Gumroad sale_id
  userId: string          // User's unique ID
  email: string           // User's email
  hours: number           // Purchased hours (1, 10, or 100)
  price: number           // Amount paid
  currency: string        // USD, EUR, etc.
  timestamp: Date         // Purchase time
  productName: string     // Product name
  affiliate: string?      // Affiliate ID (if any)
  status: string          // "completed", "pending", "refunded"
  synced: boolean         // Whether hours were added to user account
}

// User Account
{
  userId: string
  email: string
  availableHours: number  // Total hours available
  usedMinutes: number     // Minutes used in sessions
  purchaseHistory: string[] // Array of sale IDs
}
\`\`\`

### Sync Endpoint: `/api/sync-purchase/route.ts`

**Purpose**: Client-side endpoint to verify and sync purchases

**Steps**:
1. Receive user email from client
2. Query database for unsynced purchases
3. Calculate total hours
4. Update user's available hours
5. Mark purchases as synced
6. Return updated hours to client

## 4. Frontend Implementation

### Payment Modal Trigger

**When**: Remaining time ≤ 1 minute

**Action**:
1. Show warning banner: "Your service time is about to expire"
2. Auto-open payment modal with 3 package options
3. If not logged in, show login modal first

### Purchase Flow

1. **User clicks package** → Open Gumroad overlay/new window
2. **Append user email** to Gumroad URL for auto-fill
3. **Add return URL** for post-purchase redirect
4. **User completes payment** on Gumroad
5. **Gumroad redirects** to `/purchase-success?hours=X`
6. **Client calls** `/api/sync-purchase` to verify and sync
7. **Update local state** with new hours
8. **Resume session** or show success message

### Purchase Success Page

**URL**: `/purchase-success?hours=X`

**Steps**:
1. Show loading spinner: "Syncing your purchase..."
2. Call `/api/sync-purchase` with user email
3. Update localStorage with new hours
4. Show success message: "X hours added to your account"
5. Provide button to return to app

## 5. Error Handling

### Webhook Failures

**Scenario**: Webhook endpoint is down or returns error

**Solution**:
- Gumroad will retry webhook delivery (up to 3 times)
- Implement idempotency: Check if `sale_id` already exists before processing
- Log all webhook attempts for manual review

### Sync Failures

**Scenario**: Client-side sync fails (network error, server down)

**Solution**:
1. Show message: "Purchase completed, time sync pending. Please refresh in a moment."
2. Implement auto-retry: Retry sync every 30 seconds (max 10 attempts)
3. Store pending sync in localStorage for retry on next app load

### Duplicate Purchases

**Scenario**: User clicks "Purchase" multiple times

**Solution**:
- Check `sale_id` in database before processing
- If exists, return existing record instead of creating duplicate

## 6. Testing

### Test Webhook Locally

Use ngrok or similar tool to expose local server:

\`\`\`bash
ngrok http 3000
# Copy ngrok URL: https://abc123.ngrok.io
# Set Gumroad webhook: https://abc123.ngrok.io/api/gumroad-webhook
\`\`\`

### Test Purchase Flow

1. Create test product on Gumroad (or use existing)
2. Enable "Test Mode" in Gumroad settings
3. Complete test purchase with test card
4. Verify webhook is received and processed
5. Check user account is updated with hours

### Manual Webhook Testing

Send POST request to webhook endpoint:

\`\`\`bash
curl -X POST https://your-domain.com/api/gumroad-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": "test_123",
    "email": "test@example.com",
    "product_name": "AI Counselor - 10 Hours",
    "variants": {"Package": "10hours"},
    "price": "150",
    "currency": "USD"
  }'
\`\`\`

## 7. Security Considerations

### Webhook Verification

Gumroad doesn't provide signature verification by default. To secure your webhook:

1. **IP Whitelist**: Only accept requests from Gumroad's IP addresses
2. **HTTPS Only**: Ensure webhook URL uses HTTPS
3. **Rate Limiting**: Prevent abuse by limiting requests per IP
4. **Duplicate Check**: Verify `sale_id` hasn't been processed before

### User Data Protection

- Store minimal user data (email, hours only)
- Encrypt sensitive information in database
- Implement proper authentication for sync endpoint
- Use HTTPS for all API calls

## 8. Deployment Checklist

- [ ] Update Gumroad product URLs in `payment-modal.tsx`
- [ ] Set webhook URL in Gumroad settings
- [ ] Configure database for purchase records
- [ ] Test webhook with real purchase
- [ ] Verify time sync works correctly
- [ ] Test error handling (network failures, etc.)
- [ ] Monitor webhook logs for issues
- [ ] Set up affiliate tracking (if applicable)

## 9. Monitoring & Maintenance

### Key Metrics to Track

- Purchase success rate
- Webhook delivery success rate
- Time sync success rate
- Average time from purchase to sync
- Affiliate conversion rate

### Logs to Monitor

- Webhook received: `[v0] Gumroad webhook received`
- Purchase verified: `[v0] Purchase verified: {email} bought {hours} hours`
- Sync completed: `[v0] Purchase synced: {data}`
- Errors: `[v0] Gumroad webhook error` / `[v0] Purchase sync error`

## 10. Future Enhancements

- **Email Notifications**: Send confirmation email after purchase
- **Refund Handling**: Webhook for refunds to deduct hours
- **Usage Analytics**: Track how users spend their hours
- **Subscription Model**: Recurring monthly packages
- **Gift Cards**: Allow users to gift hours to others
