# Typeform App Database Export

This package contains a complete export of the **typeform-app-1** Supabase project database, configuration, and setup instructions.

## 📦 Package Contents

| File/Directory | Description |
|----------------|-------------|
| `schema.sql` | Complete database schema including tables, views, functions, triggers, and storage policies |
| `data.sql` | All data records from public schema tables (uses PostgreSQL COPY statements) |
| `roles.sql` | Custom database roles and permissions |
| `storage-info.txt` | Documentation of storage buckets and their contents |
| `supabase/config.toml` | Local development configuration |
| `supabase/migrations/` | Migration history for version tracking |
| `.env.example` | Template for required environment variables |

## ⚠️ Important Notes

- **Auth users are NOT included** - You'll need to create user accounts manually in your new project
- **Storage files are NOT included** - Only bucket structure and file listings are documented
- **Sensitive data excluded** - No API keys, passwords, or tokens are in this export
- **Third-party integrations** - You'll need to configure OpenAI and ElevenLabs with your own keys

## 🔧 Prerequisites

Before importing this database, ensure you have:

1. **Supabase CLI** installed
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # npm
   npm install -g supabase
   ```

2. **PostgreSQL client** (psql) - Usually included with Supabase CLI

3. **Node.js** - Version 18 or higher (for the Next.js application)

4. **A new Supabase project** - Create one at https://supabase.com/dashboard

## 📥 Import Instructions

### Step 1: Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Set a project name and database password (save this!)
5. Select a region close to your users
6. Wait for the project to be provisioned

### Step 2: Link Your Local Project

Navigate to your project directory and link to your new Supabase project:

```bash
cd /path/to/your/project
supabase link --project-ref YOUR_PROJECT_REF
```

You'll be prompted for your database password.

### Step 3: Import Custom Roles (Optional)

If there are custom roles defined, import them first:

```bash
# Get your database connection string from Supabase dashboard
# Settings > Database > Connection string (Direct connection)

psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f roles.sql
```

### Step 4: Import Database Schema

Import all table definitions, functions, and storage policies:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f schema.sql
```

This will create:
- All tables with constraints and indexes
- Database functions and triggers
- Custom types and enums
- Storage bucket configurations and policies

### Step 5: Import Data Records

Import all data using the COPY statements:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f data.sql
```

This may take a few minutes depending on the amount of data.

### Step 6: Configure Environment Variables

1. Copy `.env.example` to your project root as `.env.local`
2. Update with your new project's credentials:

```bash
# Get these from Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Configure your own API keys
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
```

### Step 7: Set Up Storage Buckets

Storage bucket **structures** are already created from the schema import, but you'll need to:

1. Review `storage-info.txt` to see what buckets and files existed
2. Upload any necessary files manually through:
   - Supabase Dashboard > Storage
   - Or using the Supabase CLI: `supabase storage cp`

### Step 8: Create Auth Users

Since auth users were not included in the export, you'll need to:

1. Create test users through Supabase Dashboard > Authentication > Users
2. Or use the Auth API to create users programmatically
3. Or enable sign-up in your application and register users normally

## 🚀 Post-Import Setup

### Verify the Import

1. **Check tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. **Check data was imported:**
   ```sql
   -- Replace 'your_table' with an actual table name
   SELECT COUNT(*) FROM your_table;
   ```

3. **Check storage buckets:**
   ```sql
   SELECT * FROM storage.buckets;
   ```

### Configure Third-Party Integrations

1. **OpenAI** - Add your API key to `.env.local`
2. **ElevenLabs** - Add your agent ID to `.env.local`
3. Test these integrations work in your new environment

### Test Database Connections

Run your application locally to verify everything works:

```bash
npm install
npm run dev
```

Visit http://localhost:3000 and test:
- Database queries work
- Auth flow works (with new users)
- Storage uploads work (if applicable)

## 🗂️ Project Structure

```
export/
├── schema.sql              # Database schema (tables, functions, types)
├── data.sql                # All data records (COPY format)
├── roles.sql               # Custom database roles
├── storage-info.txt        # Storage bucket documentation
├── .env.example            # Environment variable template
├── README.md               # This file
└── supabase/
    ├── config.toml         # Local development config
    └── migrations/         # Migration history
        └── 20260102000000_add_scorecard_system.sql
```

## 🔍 Troubleshooting

### Import Errors

**"relation already exists"**
- Your database may not be empty. Consider creating a fresh project or manually dropping conflicting tables.

**"permission denied"**
- Make sure you're using the postgres user and have the correct password.
- Check your connection string is correct.

**"COPY failed"**
- Some data may reference missing foreign keys. Import schema before data.
- Check the error message for specific table/column issues.

### Connection Issues

**"connection refused"**
- Verify your project is running (not paused)
- Check your connection string and password
- Ensure you're using the direct connection (not pooler) for imports

**"SSL required"**
- Add `?sslmode=require` to your connection string

### Missing Data

**Tables are empty after import**
- Verify `data.sql` was imported successfully
- Check for error messages during the import
- Ensure foreign key constraints didn't block inserts

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Support

If you encounter issues:

1. Check the Supabase Dashboard > Logs for errors
2. Review the PostgreSQL logs in your project
3. Consult the Supabase Discord community
4. Contact the person who shared this export with you

---

**Export Date:** February 3, 2026  
**Source Project:** typeform-app-1 (cjwhhjhwheckbbbnryxh)  
**Database Version:** PostgreSQL 17
