# Google Login 400 Error - Critical Fix

## The Problem
Google OAuth returns "400: malformed request" error.

## Root Cause
The NEXTAUTH_URL environment variable is not correctly configured in Vercel.

## Solution

### Step 1: Check Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Find `NEXTAUTH_URL` and check its value

### Step 2: Correct Configuration
The `NEXTAUTH_URL` must be **EXACTLY**:
\`\`\`
NEXTAUTH_URL=https://ai-counselor-2025-11-3-v1.vercel.app
\`\`\`

**Important:**
- NO trailing slash (/)
- Must use https://
- Must match your actual Vercel domain

### Step 3: Check Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", make sure you have:
\`\`\`
https://ai-counselor-2025-11-3-v1.vercel.app/api/auth/callback/google
\`\`\`

### Step 4: Generate NEXTAUTH_SECRET
If you don't have `NEXTAUTH_SECRET`, generate one:
\`\`\`bash
openssl rand -base64 32
\`\`\`
Add it to Vercel environment variables.

### Step 5: Redeploy
After updating environment variables, you MUST redeploy:
1. Go to "Deployments" tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"

## Verification
After redeployment, try Google login again. It should work without 400 error.

## Still Not Working?
Check the browser console for errors and verify:
1. All environment variables are set correctly
2. Google Cloud Console redirect URI matches exactly
3. You've redeployed after changing environment variables
