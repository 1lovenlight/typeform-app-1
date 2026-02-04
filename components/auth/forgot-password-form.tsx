"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-8 max-w-sm mx-auto p-8 border rounded-4xl corner-squircle">
      {success ? (
        <div className="space-y-4">
          <h1 className="max-w-md text-4xl tracking-tighter text-balance text-left font-normal">
            Check Your Email
          </h1>
        </div>
      ) : (
        <>
          <h1 className="max-w-md text-4xl tracking-tighter text-balance text-left font-normal">
            Forgot?
          </h1>

          <form onSubmit={handleForgotPassword} className="w-full">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              {error && <FieldError>{error}</FieldError>}

              <Button
                type="submit"
                size="xl"
                className="w-full"
                disabled={isLoading}
                variant="brand"
              >
                {isLoading ? "Sending..." : "Email password reset link"}
              </Button>
            </FieldGroup>
          </form>

          <div className="flex items-center text-text-secondary gap-1">
            Already have an account?{" "}
            <Link
              href="/login"
              className="hover:text-text-primary text-muted-foreground"
            >
              Login
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
