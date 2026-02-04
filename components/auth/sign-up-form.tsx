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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          data: {
            name: username,
            username: username,
          },
        },
      });
      if (error) throw error;
      router.push("/home");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-8 max-w-sm mx-auto p-8 border rounded-4xl corner-squircle">
      <h1 className="max-w-md text-4xl tracking-tighter text-balance text-left font-normal">
        Sign up
      </h1>

      <form onSubmit={handleSignUp} className="w-full">
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

          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="repeat-password">Repeat Password</FieldLabel>
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
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
            {isLoading ? "Creating an account..." : "Sign up"}
          </Button>
        </FieldGroup>
      </form>

      <div className="flex items-center text-text-secondary gap-1">
        Already have an account?
        <Link
          href="/login"
          className="hover:text-text-primary text-muted-foreground"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
