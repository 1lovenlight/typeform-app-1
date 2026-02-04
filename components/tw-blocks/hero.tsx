import { createClient } from "@/lib/supabase/server";
import { Button } from "../ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

async function AuthButtons() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;

  if (isLoggedIn) {
    return (
      <Button asChild variant="brand">
        <Link href="/home">Home</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-row gap-4 w-full">
      <Button asChild variant="brand" size="xl">
        <Link href="/sign-up">Sign Up</Link>
      </Button>
      <Button asChild variant="secondary" size="xl">
        <Link href="/login">Login</Link>
      </Button>
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
      <div className="flex flex-col items-start gap-8 max-w-sm mx-auto p-8 border border-transparent rounded-4xl corner-squircle">
        <h1 className="max-w-md text-4xl tracking-tighter text-balance text-left font-normal">
          Practice NBG to Grow Your Business
        </h1>

        <Suspense fallback={<Skeleton className="h-11 w-24 rounded" />}>
          <AuthButtons />
        </Suspense>
      </div>
    </div>
  );
}
