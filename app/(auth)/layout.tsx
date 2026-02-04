import { AuthPageContainer } from "@/components/tw-blocks/page-container";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthPageContainer>{children}</AuthPageContainer>;
}
