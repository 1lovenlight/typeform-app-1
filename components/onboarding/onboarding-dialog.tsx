"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import Image from "next/image";
import { LucideIcon } from "lucide-react";
import { ReactNode, useRef, useEffect } from "react";

export interface OnboardingItem {
  icon: LucideIcon;
  text: string;
}

/**
 * Helper function to determine if a source is a video file
 */
function isVideoFile(src?: string): boolean {
  if (!src) return false;
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  return videoExtensions.some((ext) => src.toLowerCase().endsWith(ext));
}

interface OnboardingDialogProps {
  open?: boolean;
  onClose?: (open: boolean) => void;
  trigger?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  aspectRatio?: number;
  title?: string;
  description?: string;
  items?: OnboardingItem[];
  skipText?: string;
  continueText?: string;
  onSkip?: () => void;
  onContinue?: () => void;
  // Video-specific options
  videoPoster?: string;
  videoAutoplay?: boolean;
  videoControls?: boolean;
  videoMuted?: boolean;
  videoLoop?: boolean;
}

export function OnboardingDialog({
  open,
  onClose,
  trigger,
  imageSrc = "/waves-01.png",
  imageAlt = "",
  aspectRatio = 2 / 1,
  title = "Title",
  description = "Description",
  items = [],
  continueText = "Continue",
  onContinue,
  videoPoster,
  videoAutoplay = true,
  videoControls = false,
  videoMuted = false,
  videoLoop = true,
}: OnboardingDialogProps) {
  const isVideo = isVideoFile(imageSrc);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play video when dialog opens if autoplay is enabled
  useEffect(() => {
    if (open && isVideo && videoRef.current && videoAutoplay) {
      videoRef.current.play().catch((error) => {
        // If autoplay fails, the video will still be available for manual play
        console.log("Video autoplay prevented:", error);
      });
    }
  }, [open, isVideo, videoAutoplay]);

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="p-0 gap-0 border-none overflow-hidden rounded-2xl">
        <AspectRatio ratio={aspectRatio}>
          {/* Top-left logo overlay */}
          <div className="absolute top-4 left-4 z-10 w-12 h-12">
            <Image
              src="/rhThumb.png"
              alt="Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          {isVideo ? (
            <video
              ref={videoRef}
              src={imageSrc}
              poster={videoPoster}
              autoPlay={videoAutoplay}
              loop={videoLoop}
              muted={videoMuted}
              controls={videoControls}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image src={imageSrc} alt={imageAlt} fill={true} priority />
          )}
        </AspectRatio>
        <div className="p-6 flex flex-col gap-6">
          <AlertDialogHeader className="text-left gap-0">
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-pretty">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {items.length > 0 && (
            <ItemGroup className="space-y-6">
              {items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Item key={index} size="sm" variant="default" className="p-0">
                    <ItemMedia variant="default">
                      <Icon className="size-5" />
                    </ItemMedia>
                    <ItemContent className="gap-0">
                      <ItemTitle className="text-sm font-bold tracking-tight">
                        Title
                      </ItemTitle>
                      <ItemDescription className="text-sm text-pretty line-clamp-none">
                        {item.text}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                );
              })}
            </ItemGroup>
          )}
          <AlertDialogFooter className="flex flex-row justify-between mt-2">
            <AlertDialogAction
              className="flex-1 bg-brand text-white hover:bg-brand/90 cursor-pointer"
              onClick={onContinue}
            >
              {continueText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
