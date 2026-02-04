"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function HomeBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <div className="pointer-events-auto flex items-center justify-between gap-x-6 bg-gray-900 px-6 py-2.5 sm:rounded-xl sm:py-3 sm:pr-3.5 sm:pl-4">
      <p className="text-sm/6 text-white">
        <strong className="font-semibold">GeneriCon 2023</strong>
        <svg
          viewBox="0 0 2 2"
          aria-hidden="true"
          className="mx-2 inline size-0.5 fill-current"
        >
          <circle r={1} cx={1} cy={1} />
        </svg>
        Join us in Denver from June 7 – 9 to see what&apos;s coming next&nbsp;
      </p>
      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        className="-m-3 flex-none p-3 focus-visible:-outline-offset-4"
      >
        <span className="sr-only">Dismiss</span>
        <XMarkIcon aria-hidden="true" className="size-5 text-white" />
      </button>
    </div>
  );
}
