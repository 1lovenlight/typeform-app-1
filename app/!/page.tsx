import { Button } from "@/components/ui/button";

import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Login() {
  return (
    <>
      <div className="flex min-h-full">
        <div className="flex flex-col items-start mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          {/* <Image src="/rhThumb.png" alt="RH Study" width={44} height={44} /> */}

          <h2 className="mt-4 max-w-md text-4xl tracking-tighter text-balance sm:text-5xl text-left">
            Practice NBG to grow your business.
          </h2>
          <div className="mt-10 flex items-center gap-x-6">
            <Button
              variant="brand"
              size="xl"
              className="w-fit text-base rounded"
            >
              Home
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
