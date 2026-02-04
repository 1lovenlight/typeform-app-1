import { ResponsiveWrapper } from "@/components/layout/responsive-warning";

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return <ResponsiveWrapper minWidth={1080} minHeight={700}>{children}</ResponsiveWrapper>;
}
