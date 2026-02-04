# Production Deployment Guide

This guide walks you through deploying the NBG Coaching Practice Platform to production using Supabase and Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Overview](#deployment-overview)
- [Supabase Production Setup](#supabase-production-setup)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [Third-Party Service Configuration](#third-party-service-configuration)
- [Post-Deployment Verification](#post-deployment-verification)
- [Monitoring & Logging](#monitoring--logging)
- [Rollback Procedures](#rollback-procedures)
- [Production Checklist](#production-checklist)

## Prerequisites

Before deploying to production, ensure you have:

- [ ] **GitHub account** with repository access
- [ ] **Vercel account** (free tier works)
- [ ] **Supabase account** (free tier works for testing)
- [ ] **OpenAI API key** with billing set up
- [ ] **ElevenLabs account** with agent configured
- [ ] **Domain name** (optional, Vercel provides free subdomain)
- [ ] All features tested locally
- [ ] Database schema finalized

## Deployment Overview

The deployment process involves:

1. **Supabase**: Set up production database
2. **Vercel**: Deploy Next.js application
3. **Environment Variables**: Configure secrets
4. **Third-Party Services**: Update webhook URLs
5. **Verification**: Test all features
6. **Monitoring**: Set up alerts and logging

**Estimated Time**: 30-60 minutes

## Supabase Production Setup

### Step 1: Create Production Project

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Click "New Project"

2. **Configure Project**
   - **Organization**: Select or create
   - **Name**: `nbg-coaching-production` (or your choice)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select appropriate tier

3. **Wait for Provisioning**
   - Takes 2-3 minutes
   - Note your project reference ID

### Step 2: Import Database Schema

You have two options:

#### Option A: Import from Export (Recommended)

```bash
# Navigate to export directory
cd export

# Get your connection string from Supabase Dashboard
# Settings > Database > Connection string (Direct connection)

# Import schema
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f schema.sql

# Import data (optional - only if you want sample data)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f data.sql
```

#### Option B: Run Migrations

```bash
# Link to production project
supabase link --project-ref your-production-project-ref

# Push migrations
supabase db push

# Or run migrations individually
supabase migration up
```

### Step 3: Configure Storage Buckets

Storage buckets are created by the schema import, but verify:

1. **Go to Storage** in Supabase Dashboard
2. **Verify buckets exist**:
   - `character-profiles` (public)
   - `activity_images` (public)
   - `onboarding-vids` (public)
3. **Upload any required assets**

### Step 4: Configure Authentication

1. **Go to Authentication** > Settings
2. **Configure Site URL**:
   - Set to your production domain
   - Example: `https://your-app.vercel.app`
3. **Add Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/`
4. **Email Templates** (optional):
   - Customize confirmation emails
   - Add your branding

### Step 5: Set Up Row Level Security

RLS policies are included in the schema import, but verify:

```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

### Step 6: Create Admin User (Optional)

```sql
-- Create admin role if needed
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
VALUES ('admin@yourdomain.com', crypt('your-secure-password', gen_salt('bf')), now(), 'authenticated');

-- Or create via Dashboard > Authentication > Users > Add User
```

## Vercel Deployment

### Step 1: Connect GitHub Repository

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New" > "Project"

2. **Import Git Repository**
   - Select GitHub
   - Authorize Vercel (if first time)
   - Select `typeform-app-1` repository

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### Step 2: Configure Environment Variables

**⚠️ CRITICAL**: Add all environment variables before deploying!

Click "Environment Variables" and add:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_production_openai_key

# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_production_agent_id
```

**Environment Scope**:
- Select "Production" for production-only values
- Select "Preview" for staging/preview deployments
- Select "Development" for local development (optional)

### Step 3: Deploy

1. **Click "Deploy"**
   - Vercel will build and deploy your app
   - Takes 2-5 minutes

2. **Monitor Build**
   - Watch build logs for errors
   - Check for TypeScript errors
   - Verify all dependencies install

3. **Get Deployment URL**
   - Vercel provides: `https://your-app.vercel.app`
   - Or use custom domain (see below)

### Step 4: Configure Custom Domain (Optional)

1. **Go to Project Settings** > Domains
2. **Add Domain**
   - Enter your domain: `coaching.yourdomain.com`
3. **Configure DNS**
   - Add CNAME record pointing to Vercel
   - Or use A record with Vercel's IP
4. **Wait for SSL**
   - Vercel auto-provisions SSL certificate
   - Takes 5-10 minutes

### Step 5: Enable Vercel Workflows

Workflows are automatically enabled with the `workflow` package.

**Verify**:
1. Go to Project > Workflow
2. Check workflow is detected
3. Test by triggering a scoring workflow

**Monitor**:
- Workflow executions appear in Vercel dashboard
- Check logs for errors
- Set up alerts for failures

## Environment Variables

### Production Environment Variables

**Required Variables:**

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Public API key | Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret!) | Dashboard > Settings > API |
| `OPENAI_API_KEY` | OpenAI API key | https://platform.openai.com/api-keys |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | ElevenLabs agent ID | Dashboard > Agent Settings |

**Security Best Practices:**

1. **Use different keys for production and development**
2. **Never commit secrets to git**
3. **Rotate keys regularly**
4. **Set up billing alerts**
5. **Use Vercel's encrypted environment variables**

### Updating Environment Variables

**In Vercel:**
1. Go to Project Settings > Environment Variables
2. Edit or add variables
3. Redeploy for changes to take effect

**Redeployment Required:**
- Environment variables are baked into build
- Must redeploy after changing any variable
- Use "Redeploy" button in Vercel dashboard

## Third-Party Service Configuration

### ElevenLabs Webhook Configuration

**⚠️ CRITICAL**: Update webhook URL to point to production

1. **Go to ElevenLabs Dashboard**
   - Navigate to your Conversational AI agent
   - Go to Settings > Webhooks

2. **Update Webhook URL**
   - Old: `https://make.com/...` (if using Make)
   - New: `https://your-app.vercel.app/api/webhooks/elevenlabs`

3. **Test Webhook**
   - Start a test conversation
   - End the conversation
   - Check Vercel logs for webhook delivery
   - Verify transcript is saved to database

4. **Webhook Security** (Optional)
   - Implement signature verification
   - Add webhook secret to environment variables
   - Validate requests in webhook handler

### OpenAI Configuration

1. **Set Usage Limits**
   - Go to https://platform.openai.com/account/limits
   - Set monthly spending limit
   - Set up billing alerts

2. **Monitor Usage**
   - Check usage dashboard regularly
   - Set up email alerts for high usage
   - Review API logs for errors

### Typeform Configuration (If Used)

1. **Update Webhook URLs**
   - Go to Typeform form settings
   - Update webhook destination
   - Point to your production API

2. **Test Form Submissions**
   - Submit test responses
   - Verify data is saved correctly

## Post-Deployment Verification

### Verification Checklist

#### ✅ Basic Functionality
- [ ] Application loads at production URL
- [ ] No console errors in browser
- [ ] Static assets load (images, fonts)
- [ ] Styles render correctly

#### ✅ Authentication
- [ ] Can access login page
- [ ] Can create new account
- [ ] Can log in with existing account
- [ ] Session persists across page reloads
- [ ] Logout works correctly
- [ ] Password reset flow works

#### ✅ Database Connection
- [ ] Data loads from Supabase
- [ ] Can create new records
- [ ] Can update existing records
- [ ] RLS policies work correctly
- [ ] No unauthorized data access

#### ✅ Practice Sessions
- [ ] Can select character
- [ ] ElevenLabs conversation starts
- [ ] Audio works in both directions
- [ ] Conversation can be ended
- [ ] Webhook delivers transcript
- [ ] Session saved to database

#### ✅ AI Scoring
- [ ] Can trigger scoring workflow
- [ ] Workflow executes successfully
- [ ] Scorecard is generated
- [ ] Results display correctly
- [ ] No OpenAI API errors

#### ✅ Learning Activities
- [ ] Course list loads
- [ ] Can navigate modules/topics
- [ ] Typeform embeds work
- [ ] Progress tracking updates
- [ ] Activity completion saves

#### ✅ Performance
- [ ] Page load times < 3 seconds
- [ ] No memory leaks
- [ ] Images optimized
- [ ] API responses < 1 second

## Monitoring & Logging

### Vercel Analytics

**Enable:**
1. Go to Project > Analytics
2. Enable Web Analytics
3. View metrics:
   - Page views
   - Unique visitors
   - Performance scores

### Vercel Logs

**Access:**
1. Go to Project > Logs
2. Filter by:
   - Time range
   - Log level (info, warning, error)
   - Source (build, function, edge)

**Key Logs to Monitor:**
- API route errors
- Webhook deliveries
- Workflow executions
- Build failures

### Supabase Logs

**Access:**
1. Go to Supabase Dashboard > Logs
2. View:
   - Database logs
   - API logs
   - Auth logs
   - Storage logs

**Set Up Alerts:**
- High error rates
- Slow queries
- Failed authentication attempts
- Storage quota warnings

### Error Tracking (Optional)

**Recommended Services:**
- **Sentry** - Error tracking and performance monitoring
- **LogRocket** - Session replay and error tracking
- **Datadog** - Full-stack monitoring

**Setup:**
```bash
# Install Sentry (example)
npm install @sentry/nextjs

# Configure in next.config.ts
# Add Sentry DSN to environment variables
```

### Uptime Monitoring (Optional)

**Recommended Services:**
- **UptimeRobot** - Free uptime monitoring
- **Pingdom** - Advanced monitoring
- **StatusCake** - Multi-location checks

**Monitor:**
- Main application URL
- API endpoints
- Database connectivity

## Rollback Procedures

### Quick Rollback (Vercel)

**If deployment has issues:**

1. **Go to Vercel Dashboard** > Deployments
2. **Find last working deployment**
3. **Click "..." menu** > "Promote to Production"
4. **Confirm** - Instant rollback

**Rollback Time**: < 1 minute

### Database Rollback

**If database migration fails:**

```bash
# Connect to production database
supabase link --project-ref production-ref

# Rollback last migration
supabase migration down

# Or restore from backup
# Go to Supabase Dashboard > Database > Backups
# Click "Restore" on desired backup
```

**⚠️ Warning**: Database rollbacks may cause data loss

### Environment Variable Rollback

1. Go to Vercel > Settings > Environment Variables
2. Edit variable to previous value
3. Redeploy application

## Production Checklist

### Pre-Deployment
- [ ] All features tested locally
- [ ] Database schema finalized
- [ ] Migrations tested
- [ ] Environment variables documented
- [ ] API keys obtained
- [ ] Security review completed
- [ ] Performance testing done

### During Deployment
- [ ] Supabase project created
- [ ] Database imported successfully
- [ ] Storage buckets configured
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Custom domain configured (if applicable)
- [ ] First deployment successful

### Post-Deployment
- [ ] All verification checks passed
- [ ] Webhooks configured
- [ ] Monitoring enabled
- [ ] Logs reviewed
- [ ] Team notified
- [ ] Documentation updated
- [ ] Backup strategy confirmed

### Ongoing Maintenance
- [ ] Monitor error rates
- [ ] Review usage and costs
- [ ] Update dependencies regularly
- [ ] Rotate API keys periodically
- [ ] Review and optimize performance
- [ ] Test backup restoration
- [ ] Update documentation

## Troubleshooting Deployment Issues

### Build Fails on Vercel

**Error**: TypeScript errors or build failures

**Solutions:**
1. Check build logs for specific errors
2. Verify all dependencies are in `package.json`
3. Test build locally: `npm run build`
4. Check Node.js version compatibility
5. Clear Vercel cache and redeploy

### Database Connection Errors

**Error**: Cannot connect to Supabase

**Solutions:**
1. Verify environment variables are correct
2. Check Supabase project is not paused
3. Verify RLS policies allow access
4. Test connection with curl:
   ```bash
   curl https://your-project.supabase.co/rest/v1/
   ```

### Webhook Not Firing

**Error**: ElevenLabs webhook not delivering

**Solutions:**
1. Verify webhook URL is correct
2. Check Vercel function logs
3. Test webhook manually with curl
4. Verify function timeout is sufficient
5. Check ElevenLabs dashboard for delivery errors

### Workflow Execution Fails

**Error**: Scoring workflow fails

**Solutions:**
1. Check Vercel Workflow logs
2. Verify OpenAI API key is valid
3. Check OpenAI usage limits
4. Verify database connection
5. Test workflow locally if possible

## Cost Considerations

### Supabase Costs
- **Free Tier**: 500MB database, 1GB storage, 2GB bandwidth
- **Pro Tier**: $25/month - 8GB database, 100GB storage
- **Monitor**: Database size, API requests, storage usage

### Vercel Costs
- **Hobby**: Free - 100GB bandwidth, unlimited deployments
- **Pro**: $20/month - 1TB bandwidth, advanced features
- **Monitor**: Bandwidth usage, function executions

### OpenAI Costs
- **Pay-per-use**: Based on token consumption
- **GPT-4**: ~$0.03 per 1K tokens (input), ~$0.06 per 1K tokens (output)
- **Monitor**: Set monthly limits, track usage

### ElevenLabs Costs
- **Free Tier**: Limited minutes
- **Paid Plans**: Based on usage
- **Monitor**: Conversation minutes, API calls

**Total Estimated Cost**: $50-100/month for moderate usage

---

**Deployment Complete?** Head to [Monitoring & Logging](#monitoring--logging) to set up ongoing monitoring.

**Need Help?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues.
