# Vercel Deployment Guide

This project has been migrated from Cloudflare Pages to Vercel for simpler deployment and better Next.js compatibility.

## Deployment Setup

### 1. Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com)
2. Import your GitHub repository
3. Configure the project settings

### 2. Environment Variables
Set these in Vercel dashboard (Project Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_APP_URL
```

### 3. Build Settings
Vercel automatically detects Next.js projects. Default settings should work:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (or `next build`)
- **Output Directory**: `.next` (default)

### 4. GitHub Actions Deployment
The workflow deploys on:
- GitHub releases (recommended for production)
- Manual workflow dispatch

**Required Secrets in GitHub:**
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_PROJECT_ID`: Project ID from Vercel dashboard
- `VERCEL_ORG_ID`: Organization ID

## Local Development

```bash
npm install
npm run dev
```

## Production Deployment

1. Create a GitHub release to trigger automatic deployment
2. Or manually run the GitHub Actions workflow

## Migration Notes

- Removed OpenNext and Cloudflare-specific configurations
- Build scripts simplified to standard Next.js
- TypeScript error checking enabled
- Images remain unoptimized (can be changed if needed)

## Troubleshooting

- Check Vercel function logs for runtime errors
- Ensure all environment variables are set
- Verify Supabase and Stripe configurations