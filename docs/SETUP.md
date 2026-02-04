# Local Development Setup Guide

This guide will walk you through setting up the NBG Coaching Practice Platform on your local machine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Setup](#quick-setup)
- [Detailed Setup Steps](#detailed-setup-steps)
- [Database Setup Options](#database-setup-options)
- [Running the Application](#running-the-application)
- [Verification Checklist](#verification-checklist)
- [Common Setup Issues](#common-setup-issues)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js 18 or higher**
   ```bash
   # Check your version
   node --version  # Should be v18.x.x or higher
   
   # Install from https://nodejs.org if needed
   ```

2. **npm** (comes with Node.js)
   ```bash
   # Check your version
   npm --version  # Should be 9.x.x or higher
   ```

3. **Git**
   ```bash
   # Check if installed
   git --version
   
   # Install from https://git-scm.com if needed
   ```

4. **Supabase CLI** (for local database development)
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # npm (all platforms)
   npm install -g supabase
   
   # Verify installation
   supabase --version
   ```

### Required Accounts & API Keys

You'll need accounts and API keys for:

1. **Supabase** - Database, auth, and storage
   - Sign up at https://supabase.com
   - Create a new project or use existing

2. **OpenAI** - AI scoring functionality
   - Sign up at https://platform.openai.com
   - Create an API key
   - Set up billing and usage limits

3. **ElevenLabs** - Voice AI conversations
   - Sign up at https://elevenlabs.io
   - Create a Conversational AI agent
   - Get your Agent ID

**Required Variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
```

**Where to find these values:**

- **Supabase keys**: Dashboard > Settings > API
- **OpenAI key**: https://platform.openai.com/api-keys
- **ElevenLabs Agent ID**: Dashboard > Conversational AI > Your Agent

## Database Setup Options

You have two options for setting up your database:

### Option A: Import Existing Database (Recommended)

This option imports a complete database with schema, data, and configuration.

**Advantages:**
- Complete database with sample data
- All tables, functions, triggers, and policies included
- Faster setup

**Steps:**

1. **Create a Supabase project** (if you haven't already)
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Save your database password!

2. **Get your connection string**
   - Dashboard > Settings > Database
   - Copy the "Connection string" (Direct connection)
   - Replace `[YOUR-PASSWORD]` with your actual password

3. **Import the database**
   ```bash
   # Navigate to the export directory
   cd export
   
   # Import schema (creates tables, functions, triggers)
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f schema.sql
   
   # Import data (optional - loads sample data)
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f data.sql
   
   # Return to project root
   cd ..
   ```

4. **Update your .env.local** with the new project's credentials

**For detailed instructions, see:** [export/README.md](../export/README.md)

### Option B: Start Fresh with Migrations

This option creates a fresh database using migration files.

**Advantages:**
- Clean slate
- Learn the database structure incrementally
- Full control over what gets created

**Steps:**

1. **Link your Supabase project**
   ```bash
   supabase link --project-ref your-project-ref
   # Enter your database password when prompted
   ```

2. **Run migrations**
   ```bash
   supabase migration up
   
   # This will create:
   # - All database tables
   # - Functions and triggers
   # - RLS policies
   # - Storage buckets
   ```

3. **Verify migrations**
   ```bash
   # Check migration status
   supabase migration list
   
   # All migrations should show as "applied"
   ```

### Option C: Local Development with Supabase CLI

For completely local development without a cloud Supabase project:

```bash
# Start local Supabase (Docker required)
supabase start

# This will:
# - Start PostgreSQL locally
# - Run all migrations automatically
# - Start Supabase Studio at http://127.0.0.1:54323
# - Provide local API credentials

# Copy the local credentials to .env.local
# (displayed after `supabase start` completes)

# When done developing
supabase stop
```

## Running the Application

### Start the Development Server

```bash
# Start Next.js development server
npm run dev

# The server will start on http://localhost:3000
# You should see output like:
#   ▲ Next.js 16.1.1
#   - Local:        http://localhost:3000
#   - Environments: .env.local
```

### Access the Application

1. **Open your browser** to http://localhost:3000
2. **You should see** the landing page
3. **Try to sign up** or log in to test the connection

### Access Supabase Studio (Optional)

If using local Supabase:

```bash
# Supabase Studio runs at:
http://127.0.0.1:54323

# Use this to:
# - Browse database tables
# - Run SQL queries
# - Manage storage buckets
# - View authentication users
```

## Verification Checklist

After setup, verify everything works:

### ✅ Environment Variables
- [ ] `.env.local` file exists and has all required variables
- [ ] No placeholder values remain (no `your_xxx_here`)
- [ ] Supabase URL and keys are correct
- [ ] OpenAI API key is valid
- [ ] ElevenLabs Agent ID is correct

### ✅ Database Connection
- [ ] Development server starts without errors
- [ ] Can access http://localhost:3000
- [ ] No Supabase connection errors in browser console
- [ ] Can view database tables in Supabase Dashboard

### ✅ Authentication
- [ ] Can access login page at http://localhost:3000/login
- [ ] Can create a new account (sign up)
- [ ] Can log in with created account
- [ ] Redirects to `/home` after successful login

### ✅ Core Features
- [ ] Home page loads with user data
- [ ] Can navigate to `/practice` page
- [ ] Can navigate to `/learn` page
- [ ] Character images load correctly
- [ ] No console errors related to missing data

### ✅ Optional: Test Integrations
- [ ] ElevenLabs conversation starts (requires agent setup)
- [ ] Can complete a practice session
- [ ] Scoring workflow triggers (check Vercel dashboard)

## Common Setup Issues

### Issue: Supabase Connection Failed

**Error:** `Failed to fetch` or `Network error` when accessing the app

**App-specific causes:**
1. **Project paused (free tier):**
   - Free tier projects pause after inactivity
   - Resume in Supabase Dashboard

2. **Missing service role key:**
   - This app requires `SUPABASE_SERVICE_ROLE_KEY` (not just anon key)
   - Required for server-side operations and workflows
   - Get from Supabase Dashboard > Settings > API

3. **Wrong client usage:**
   - This app uses multiple Supabase clients
   - Verify correct client for context (see [TROUBLESHOOTING.md](TROUBLESHOOTING.md))

### Issue: TypeScript Errors After Schema Changes

**Error:** Type errors after modifying database schema

**Solution:**
```bash
# Regenerate Supabase types
npx supabase gen types typescript --project-id your-project-ref --schema public > lib/supabase/types.ts

# Or if using local Supabase
npx supabase gen types typescript --local > lib/supabase/types.ts
```

### Issue: Database Migration Errors

**Error:** `Migration failed` or `relation already exists`

**Solution:**
```bash
# Check migration status
supabase migration list

# Reset database (WARNING: destroys all data)
supabase db reset

# Or manually fix conflicts in Supabase Dashboard
```

### Issue: OpenAI API Errors

**Error:** `401 Unauthorized` or `Invalid API key`

**App-specific notes:**
- Used in Vercel Workflow for scoring (`workflows/score/workflow.ts`)
- Check Vercel Dashboard > Workflow logs for errors
- Verify billing and credits at https://platform.openai.com/account/billing

### Issue: ElevenLabs Connection Issues

**Error:** Conversation doesn't start or audio doesn't work

**App-specific notes:**
- Uses `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (not API key)
- Agent ID format: `agent_xxxxxxxxxxxxxxxxxxxxx`
- Check `components/elevenlabs/conversation-bar.tsx` for connection logic
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed integration issues

## Next Steps

Once your local environment is running:

1. **Explore the codebase** - See [Architecture Documentation](ARCHITECTURE.md)
2. **Learn about features** - See [Features Documentation](FEATURES.md)
3. **Understand the API** - See [API Reference](API.md)
4. **Deploy to production** - See [Deployment Guide](DEPLOYMENT.md)

## Getting Help

For app-specific issues, see the [Troubleshooting Guide](TROUBLESHOOTING.md).

For setup issues:
- Check all environment variables are set correctly
- Verify Supabase project is active (not paused)
- Review error messages in browser console and terminal

---

**Setup complete?** Head to the [Architecture Documentation](ARCHITECTURE.md) to understand how the system works.
