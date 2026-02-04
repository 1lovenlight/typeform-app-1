import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cjwhhjhwheckbbbnryxh.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withWorkflow(nextConfig);
