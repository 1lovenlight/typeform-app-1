# Onboarding System

A comprehensive onboarding system with database backing for debugging, analytics, and cross-device sync.

## Features

- ✅ **Database-backed**: All onboarding state stored in Supabase
- ✅ **Local storage cache**: Fast UI updates with localStorage
- ✅ **Admin dashboard**: Debug and monitor user progress
- ✅ **Analytics**: Track completion and dismissal rates
- ✅ **Cross-device sync**: Users see onboarding on all devices
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Flexible**: Dialogs, banners, and conditional rendering

## Quick Start

### 1. Run the Migration

First, apply the database migration:

```bash
# Run the migration in your Supabase project
psql $DATABASE_URL < supabase-migrations/user_onboarding.sql
```

### 2. Use in Your Components

```tsx
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { useOnboarding } from "@/lib/context/onboarding-context";
import { SparklesIcon } from "lucide-react";

export default function MyPage() {
  const { shouldShowStep, markCompleted, markDismissed } = useOnboarding();

  const items = [
    {
      icon: SparklesIcon,
      text: "Welcome to this feature!",
    },
  ];

  return (
    <div>
      <OnboardingDialog
        open={shouldShowStep("my_page_intro")}
        onClose={(open) => !open && markDismissed("my_page_intro")}
        title="Welcome!"
        description="Let's show you around"
        items={items}
        continueText="Get Started"
        onContinue={() => markCompleted("my_page_intro")}
      />
      
      {/* Your page content */}
    </div>
  );
}
```

## Available Onboarding Steps

Define your steps in `lib/context/onboarding-context.tsx`:

```typescript
export type OnboardingStep =
  | "home_welcome"
  | "home_features"
  | "learn_first_visit"
  | "practice_first_visit"
  | "activity_roleplay_intro"
  | "activity_typeform_intro"
  | "settings_theme"
  | "settings_profile";
```

Add new steps as needed - they'll automatically be tracked in the database.

## API Reference

### `useOnboarding()`

Hook to access onboarding state and methods.

```typescript
const {
  state,              // Current onboarding state
  loading,            // Loading state
  isStepCompleted,    // Check if step is completed
  isStepDismissed,    // Check if step is dismissed
  shouldShowStep,     // Check if step should be shown
  markCompleted,      // Mark step as completed
  markDismissed,      // Mark step as dismissed
  resetOnboarding,    // Reset all onboarding
  refreshState,       // Refresh from database
} = useOnboarding();
```

### `OnboardingDialog` Component

Props:

- `open?: boolean` - Control dialog visibility
- `onClose?: (open: boolean) => void` - Close handler
- `trigger?: ReactNode` - Custom trigger button
- `imageSrc?: string` - Header image path
- `imageAlt?: string` - Image alt text
- `aspectRatio?: number` - Image aspect ratio (default: 2/1)
- `title?: string` - Dialog title
- `description?: string` - Dialog description
- `items?: OnboardingItem[]` - List of items to display
- `continueText?: string` - Continue button text
- `onContinue?: () => void` - Continue button handler

## Admin Dashboard

Access the admin dashboard at `/admin/onboarding` to:

- View completion rates for all steps
- Search specific users by ID
- Reset user onboarding state
- Monitor problematic steps

## Database Schema

### `user_onboarding` Table

```sql
- id: uuid (primary key)
- user_id: uuid (foreign key to auth.users)
- step: text (onboarding step name)
- completed: boolean
- dismissed: boolean
- completed_at: timestamptz
- dismissed_at: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

### `onboarding_analytics` View

Aggregated analytics for all steps:
- total_users
- completed_count
- dismissed_count
- completion_rate
- dismissal_rate

## Examples

See `components/onboarding/example-usage.tsx` for:
- Simple dialog usage
- Inline banner
- Conditional rendering
- Multi-step flows

## Testing

Test the onboarding system at `/!dev/test` which includes:
- Live onboarding dialog
- Reset button
- State viewer

## Best Practices

1. **Use descriptive step names**: `home_welcome` not `step1`
2. **Don't overdo it**: Only onboard critical features
3. **Allow dismissal**: Users should be able to skip
4. **Track analytics**: Monitor completion rates to improve
5. **Test thoroughly**: Use the test page and admin dashboard

## Troubleshooting

### User stuck in onboarding?
Use the admin dashboard to search for the user and reset their state.

### Step not showing?
Check that:
1. The step name matches exactly
2. The step hasn't been completed or dismissed
3. The OnboardingProvider is in the layout

### Database errors?
Ensure the migration has been run and RLS policies are correct.

## Support

For issues or questions, check:
1. Admin dashboard for user-specific issues
2. Analytics view for system-wide patterns
3. Browser console for client-side errors
4. Supabase logs for database errors

















