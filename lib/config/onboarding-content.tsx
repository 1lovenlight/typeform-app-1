/**
 * Centralized Onboarding Content Configuration
 *
 * Define all your onboarding steps and their content here for easy management
 */

import { OnboardingStep } from "@/lib/context/onboarding-context";
import { OnboardingItem } from "@/components/onboarding/onboarding-dialog";
import {
  SparklesIcon,
  ZapIcon,
  BookOpenIcon,
  MoonIcon,
  SunIcon,
  MessageSquareIcon,
  TrophyIcon,
  SettingsIcon,
  HistoryIcon,
  BarChartIcon,
  ClockIcon,
} from "lucide-react";

export interface OnboardingStepConfig {
  step: OnboardingStep;
  title: string;
  description: string;
  items: OnboardingItem[];
  imageSrc?: string;
  aspectRatio?: number;
  continueText?: string;
  // Video-specific options
  videoPoster?: string; // Thumbnail/preview image before video plays
  videoAutoplay?: boolean; // Default: true
  videoControls?: boolean; // Default: false (for autoplay experience)
  videoMuted?: boolean; // Default: false
  videoLoop?: boolean; // Default: true
}

export const ONBOARDING_CONTENT: Partial<
  Record<OnboardingStep, OnboardingStepConfig>
> = {
  learn_first_visit: {
    step: "learn_first_visit",
    title: "Welcome to Your Learning Journey",
    description:
      "Discover the features that will help you master a new language",
    imageSrc:
      "https://cjwhhjhwheckbbbnryxh.supabase.co/storage/v1/object/public/onboarding-vids/monica-00.mp4",
    videoPoster: "/monica-profile-new.png", // Optional thumbnail
    videoAutoplay: true, // Default: true
    videoControls: true, // Default: false
    videoMuted: false, // Default: false
    videoLoop: true,
    continueText: "Get Started",
    aspectRatio: 1 / 1,
    items: [
      {
        icon: SparklesIcon,
        text: "Learn languages through interactive conversations with AI characters",
      },
      {
        icon: ZapIcon,
        text: "Practice real-world scenarios and build confidence speaking",
      },
      {
        icon: BookOpenIcon,
        text: "Track your progress and see your improvement over time",
      },
    ],
  },

  home_features: {
    step: "home_features",
    title: "Key Features",
    description: "Here's what makes learning with us special",
    imageSrc: "/waves-02.png",
    continueText: "Continue",
    items: [
      {
        icon: MessageSquareIcon,
        text: "Engage in realistic conversations with AI-powered characters",
      },
      {
        icon: TrophyIcon,
        text: "Earn achievements and track your learning milestones",
      },
      {
        icon: SettingsIcon,
        text: "Customize your learning experience to match your goals",
      },
    ],
  },

  // learn_first_visit: {
  //   step: "learn_first_visit",
  //   title: "Welcome to Learn",
  //   description: "Browse courses and start your learning journey",
  //   imageSrc: "/waves-02.png",
  //   continueText: "Start Learning",
  //   items: [
  //     {
  //       icon: BookOpenIcon,
  //       text: "Choose from a variety of courses tailored to your level",
  //     },
  //     {
  //       icon: SparklesIcon,
  //       text: "Each course contains structured lessons and activities",
  //     },
  //   ],
  // },

  practice_first_visit: {
    step: "practice_first_visit",
    title: "Practice Mode",
    description: "Improve your skills through interactive exercises",
    imageSrc: "/waves-02.png",
    continueText: "Start Practicing",
    items: [
      {
        icon: ZapIcon,
        text: "Practice conversations in a safe, judgment-free environment",
      },
      {
        icon: TrophyIcon,
        text: "Get instant feedback and improve your fluency",
      },
    ],
  },

  practice_history_intro: {
    step: "practice_history_intro",
    title: "Practice History",
    description: "Review your past practice sessions and track improvement",
    imageSrc: "/waves-02.png",
    continueText: "View History",
    items: [
      {
        icon: HistoryIcon,
        text: "See all your previous practice sessions in one place",
      },
      {
        icon: BarChartIcon,
        text: "Track your progress with detailed session analytics",
      },
      {
        icon: ClockIcon,
        text: "Review conversation duration and performance metrics",
      },
    ],
  },

  activity_roleplay_intro: {
    step: "activity_roleplay_intro",
    title: "Roleplay Activities",
    description: "Engage in realistic conversations",
    imageSrc: "/waves-02.png",
    continueText: "Start Roleplay",
    items: [
      {
        icon: MessageSquareIcon,
        text: "Practice real-world scenarios with AI characters",
      },
      {
        icon: SparklesIcon,
        text: "Receive hints and guidance when you need help",
      },
    ],
  },

  activity_typeform_intro: {
    step: "activity_typeform_intro",
    title: "Interactive Quizzes",
    description: "Test your knowledge and reinforce learning",
    imageSrc: "/waves-02.png",
    continueText: "Start Quiz",
    items: [
      {
        icon: BookOpenIcon,
        text: "Answer questions to test your understanding",
      },
      {
        icon: TrophyIcon,
        text: "Track your scores and see your progress",
      },
    ],
  },

  settings_theme: {
    step: "settings_theme",
    title: "Customize Your Theme",
    description: "Choose the appearance that works best for you",
    imageSrc: "/waves-02.png",
    continueText: "Got it",
    items: [
      {
        icon: MoonIcon,
        text: "Dark mode for comfortable viewing at night",
      },
      {
        icon: SunIcon,
        text: "Light mode for bright environments",
      },
    ],
  },

  settings_profile: {
    step: "settings_profile",
    title: "Your Profile",
    description: "Manage your account and preferences",
    imageSrc: "/waves-02.png",
    continueText: "Done",
    items: [
      {
        icon: SettingsIcon,
        text: "Update your learning preferences and goals",
      },
      {
        icon: TrophyIcon,
        text: "View your achievements and progress statistics",
      },
    ],
  },
};

/**
 * Helper function to get onboarding content for a specific step
 */
export function getOnboardingContent(
  step: OnboardingStep
): OnboardingStepConfig | undefined {
  return ONBOARDING_CONTENT[step];
}
