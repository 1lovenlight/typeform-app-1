# NBG Coaching Practice Platform

A comprehensive coaching practice platform that enables coaches to practice roleplay conversations with AI characters, complete structured learning activities, and receive AI-powered feedback on their performance.

## 🚀 Quick Start

**New to this project?** Start here:

1. **[Setup Guide](docs/SETUP.md)** - Get your local development environment running
2. **[Architecture Overview](docs/ARCHITECTURE.md)** - Understand how the system works
3. **[Features Documentation](docs/FEATURES.md)** - Learn about all available features

**Ready to deploy?** See the **[Deployment Guide](docs/DEPLOYMENT.md)**

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Current Status](#current-status)
- [Getting Help](#getting-help)

## Overview

This platform helps NBG (Next Booking Guidance) coaches practice and improve their coaching skills through:

- **AI-Powered Roleplay**: Practice conversations with realistic AI characters using voice chat
- **Structured Learning**: Complete courses, modules, and activities in a guided curriculum
- **Intelligent Feedback**: Receive detailed AI-generated scorecards evaluating your performance
- **Progress Tracking**: Monitor your improvement over time with comprehensive analytics

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Framer Motion** - Animations

### Backend
- **Supabase** - PostgreSQL database, authentication, storage, and realtime
- **Vercel Workflows** - Async processing for AI scoring
- **Next.js API Routes** - Backend endpoints

### AI & Integrations
- **ElevenLabs** - Voice AI for realistic conversations (WebRTC)
- **OpenAI GPT-4** - AI scoring and evaluation
- **Typeform** - Embedded assessments and quizzes

### Development Tools
- **Supabase CLI** - Local development and migrations
- **ESLint** - Code linting
- **PostCSS** - CSS processing

## Key Features

### 🎭 Practice Sessions
Practice coaching conversations with AI characters through voice chat. Each session is recorded, transcribed, and available for review.

- Real-time voice conversations via ElevenLabs WebRTC
- Multiple character personas with unique personalities
- Session history with full transcripts
- Post-conversation dialog with scoring options

[Learn more →](docs/FEATURES.md#practice-sessions)

### 🎯 AI Scoring System
Get detailed feedback on your coaching performance with AI-powered evaluations.

- Rubric-based scoring (0-100 scale)
- Criteria-by-criteria breakdown
- Constructive feedback and improvement suggestions
- Progress tracking over time

[Learn more →](docs/FEATURES.md#ai-scoring-system) | [Implementation Details →](SCORECARD_IMPLEMENTATION.md)

### 📚 Learning Activities
Complete structured learning paths with courses, modules, and activities.

- Hierarchical curriculum (Courses → Modules → Topics → Activities)
- Typeform quizzes and assessments
- Roleplay practice activities
- Automatic progress tracking

[Learn more →](docs/FEATURES.md#learning-activities)

### 📊 Progress Tracking
Monitor your learning journey with comprehensive analytics.

- Course and module completion tracking
- Practice session statistics
- Performance trends over time
- Activity completion status

[Learn more →](docs/FEATURES.md#user-progress)

### 👤 Character Management
Rich character profiles with detailed personalities and communication styles.

- Multiple character personas
- Difficulty ratings (1-5)
- JSONB-based personality attributes
- Scenario-specific behaviors

[Learn more →](docs/FEATURES.md#character-management)

### 🎓 Onboarding System
Database-backed onboarding with cross-device sync and analytics.

- Step-by-step guided tours
- Dismissible dialogs and banners
- Admin dashboard for monitoring
- Completion rate tracking

[Learn more →](components/onboarding/README.md)

## Project Structure

```
typeform-app-1/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Protected app routes
│   │   ├── home/                 # Dashboard
│   │   ├── practice/             # Practice sessions
│   │   ├── learn/                # Learning activities
│   │   ├── activity/             # Activity pages
│   │   └── settings/             # User settings
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── sign-up/
│   │   └── forgot-password/
│   ├── admin/                    # Admin routes
│   └── api/                      # API endpoints
│       ├── score/                # Scoring endpoints
│       └── webhooks/             # Webhook handlers
├── components/                   # React components
│   ├── practice/                 # Practice-related components
│   ├── elevenlabs/               # ElevenLabs integration
│   ├── onboarding/               # Onboarding system
│   └── ui/                       # Reusable UI components
├── lib/                          # Utilities and configuration
│   ├── actions/                  # Server actions
│   ├── context/                  # React context providers
│   ├── schemas/                  # Zod schemas
│   ├── supabase/                 # Supabase clients
│   └── utils/                    # Helper functions
├── hooks/                        # Custom React hooks
├── workflows/                    # Vercel Workflows
│   └── score/                    # AI scoring workflow
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   └── config.toml               # Local dev config
├── export/                       # Database export package
│   ├── schema.sql                # Complete database schema
│   ├── data.sql                  # Data export
│   └── README.md                 # Import instructions
├── docs/                         # Documentation
│   ├── SETUP.md                  # Development setup
│   ├── ARCHITECTURE.md           # System architecture
│   ├── DEPLOYMENT.md             # Deployment guide
│   ├── API.md                    # API reference
│   ├── FEATURES.md               # Feature documentation
│   └── TROUBLESHOOTING.md        # Common issues
└── public/                       # Static assets
```

## Documentation

### Getting Started
- **[Setup Guide](docs/SETUP.md)** - Local development setup instructions
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and tech stack
- **[API Reference](docs/API.md)** - API endpoints and usage

### Features & Implementation
- **[Features Documentation](docs/FEATURES.md)** - Comprehensive feature guide
- **[Scorecard System](SCORECARD_IMPLEMENTATION.md)** - AI scoring implementation
- **[Scoring UX](SCORING_UX_IMPLEMENTATION_COMPLETE.md)** - Post-conversation flow
- **[Onboarding System](components/onboarding/README.md)** - Onboarding implementation

### Deployment & Operations
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Database Export](export/README.md)** - Database import/export guide
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Current Status

**⚠️ Development Only**: This application is currently configured for local development only. There is no active production deployment.

### What's Ready
- ✅ Full application codebase
- ✅ Complete database schema and migrations
- ✅ Local development environment
- ✅ Database export package for easy setup
- ✅ Comprehensive documentation

### What's Needed for Production
- ⚠️ Production Supabase project setup
- ⚠️ Vercel deployment configuration
- ⚠️ Environment variables for production
- ⚠️ ElevenLabs webhook configuration
- ⚠️ API key rotation (current keys are for development)

See the **[Deployment Guide](docs/DEPLOYMENT.md)** for detailed instructions.

## Getting Help

### Common Issues
Check the **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** for solutions to common problems.

### Documentation
All documentation is in the `docs/` folder and linked throughout this README.

### Key Technologies
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vercel Workflows Documentation](https://vercel.com/docs/workflow)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Supabase commands
supabase start          # Start local Supabase
supabase stop           # Stop local Supabase
supabase migration up   # Run migrations
supabase db reset       # Reset database
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
```

See **[Setup Guide](docs/SETUP.md)** for detailed instructions on obtaining these values.

---

**Ready to get started?** Head to the **[Setup Guide](docs/SETUP.md)** to set up your development environment.
