# Onboarding Usage Guide

## Where to Configure Step Content

You have **two approaches** for configuring onboarding content:

---

## ✅ Recommended: Centralized Config (Option 2)

**Best for:** Consistency, easy maintenance, reusability

### 1. Edit the config file

All content is defined in one place:

```
lib/config/onboarding-content.tsx
```

### 2. Add or modify your step content

```tsx
export const ONBOARDING_CONTENT: Record<OnboardingStep, OnboardingStepConfig> = {
  home_welcome: {
    step: "home_welcome",
    title: "Welcome to Your Learning Journey",
    description: "Discover the features that will help you master a new language",
    imageSrc: "/waves-01.png",
    continueText: "Get Started",
    items: [
      {
        icon: SparklesIcon,
        text: "Learn languages through interactive conversations",
      },
      // Add more items...
    ],
  },
  // Add more steps...
};
```

### 3. Use in your page (super simple!)

```tsx
import { OnboardingStepDialog } from "@/components/onboarding/onboarding-step";

export default function HomePage() {
  return (
    <div>
      <OnboardingStepDialog step="home_welcome" />
      {/* Your page content */}
    </div>
  );
}
```

That's it! One line of code per page. ✨

---

## Alternative: Inline Config (Option 1)

**Best for:** Unique, page-specific content that won't be reused

### Use directly in your page

```tsx
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { useOnboarding } from "@/lib/context/onboarding-context";
import { SparklesIcon, ZapIcon } from "lucide-react";

export default function MyPage() {
  const { shouldShowStep, markCompleted, markDismissed } = useOnboarding();

  const items = [
    {
      icon: SparklesIcon,
      text: "Your custom content here",
    },
    {
      icon: ZapIcon,
      text: "More custom content",
    },
  ];

  return (
    <div>
      <OnboardingDialog
        open={shouldShowStep("my_page_intro")}
        onClose={(open) => !open && markDismissed("my_page_intro")}
        title="Custom Title"
        description="Custom description"
        items={items}
        imageSrc="/your-image.png"
        continueText="Let's Go"
        onContinue={() => markCompleted("my_page_intro")}
      />
      {/* Your page content */}
    </div>
  );
}
```

---

## Adding a New Onboarding Step

### Step 1: Define the step type

Edit `lib/context/onboarding-context.tsx`:

```tsx
export type OnboardingStep =
  | "home_welcome"
  | "home_features"
  | "my_new_step"  // ← Add your new step
  // ... other steps
```

### Step 2: Add content to config

Edit `lib/config/onboarding-content.tsx`:

```tsx
export const ONBOARDING_CONTENT: Record<OnboardingStep, OnboardingStepConfig> = {
  // ... existing steps
  
  my_new_step: {
    step: "my_new_step",
    title: "My New Feature",
    description: "Learn about this awesome feature",
    imageSrc: "/my-image.png",
    continueText: "Got it",
    items: [
      {
        icon: SparklesIcon,
        text: "First cool thing about this feature",
      },
      {
        icon: ZapIcon,
        text: "Second cool thing about this feature",
      },
    ],
  },
};
```

### Step 3: Use in your page

```tsx
<OnboardingStepDialog step="my_new_step" />
```

Done! 🎉

---

## Available Images

You can use any of these images from your `/public` folder:

- `/waves-01.png`
- `/waves-02.png`
- `/astronaut_alien_landscape.png`
- `/astronaut_on_pink_rocks.png`
- `/motorcycle_adventure_in_mountains.png`
- `/pop_art_winter_style.png`
- `/retro_rocket_in_sky.png`

Or add your own images to `/public` and reference them.

---

## Available Icons

Import from `lucide-react`:

```tsx
import {
  SparklesIcon,
  ZapIcon,
  BookOpenIcon,
  MoonIcon,
  SunIcon,
  MessageSquareIcon,
  TrophyIcon,
  SettingsIcon,
  // ... and many more!
} from "lucide-react";
```

Browse all icons at: https://lucide.dev/icons/

---

## Quick Examples

### Example 1: Home page welcome

```tsx
// app/(app)/home/page.tsx
import { OnboardingStepDialog } from "@/components/onboarding/onboarding-step";

export default function HomePage() {
  return (
    <div>
      <OnboardingStepDialog step="home_welcome" />
      {/* Your content */}
    </div>
  );
}
```

### Example 2: Multiple steps on one page

```tsx
export default function MyPage() {
  return (
    <div>
      <OnboardingStepDialog step="home_welcome" />
      <OnboardingStepDialog step="home_features" />
      {/* They'll show in sequence automatically */}
    </div>
  );
}
```

### Example 3: Custom inline content

```tsx
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { useOnboarding } from "@/lib/context/onboarding-context";

export default function CustomPage() {
  const { shouldShowStep, markCompleted, markDismissed } = useOnboarding();

  return (
    <div>
      <OnboardingDialog
        open={shouldShowStep("custom_step")}
        onClose={(open) => !open && markDismissed("custom_step")}
        title="Totally Custom"
        description="This content is defined right here"
        items={[/* your items */]}
        onContinue={() => markCompleted("custom_step")}
      />
    </div>
  );
}
```

---

## Tips

1. **Keep it short**: 2-4 items per dialog is ideal
2. **Be specific**: Tell users exactly what they'll get
3. **Use good images**: Visual appeal matters
4. **Test it**: Use `/!dev/test` to preview changes
5. **Monitor analytics**: Check `/admin/onboarding` to see completion rates

---

## Need Help?

- See full examples: `components/onboarding/example-usage.tsx`
- Read the docs: `components/onboarding/README.md`
- Test your changes: `/!dev/test`
- Monitor users: `/admin/onboarding`

















