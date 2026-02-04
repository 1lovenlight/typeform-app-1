"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageHeaderWithActions } from "@/components/layout/text-headers";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function TestPage() {
  return (
    <div className="p-12 flex flex-col gap-12">
      <PageHeaderWithActions
        title="Test"
        actions={
          <Button variant="secondary" onClick={() => toast.success("Hello")}>
            View History
          </Button>
        }
        centerAction={
          <Select>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select a character" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Option 1</SelectItem>
              <SelectItem value="2">Option 2</SelectItem>
              <SelectItem value="3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {/* Gradient Glow Button - Modern Technique */}
      <div className="relative group w-fit">
        {/* Glow effect - blurred gradient behind button */}
        <div
          className="absolute -inset-[1px] rounded-[9px] blur-[1px] group-hover:blur-md transition-blur duration-300
          "
          style={{
            backgroundImage:
              "linear-gradient(90deg,#22c55e .66%,#1a86ff 25.49%,#9782f7 50.33%,#d388e0 75.16%,#fca603)",
          }}
        />
        {/* Gradient border wrapper */}
        <div
          className="relative p-px rounded-[9px] hover:opacity-100 transition-opacity duration-300"
          style={{
            backgroundImage:
              "linear-gradient(90deg,#22c55e .66%,#1a86ff 25.49%,#9782f7 50.33%,#d388e0 75.16%,#fca603)",
          }}
        >
          <Button
            variant="secondary"
            className=" text-base hover:bg-background relative z-10"
          >
            Test
          </Button>
        </div>
      </div>
      <div className="corner-squircle rounded-[4rem] bg-gradient-to-b from-blue-900/50 to-blue-900/20 w-200 h-48"></div>
      <div className="rounded-[4rem] bg-gradient-to-b from-card to-card/50 w-200 h-48"></div>
    </div>
  );
}
