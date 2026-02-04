"use client";

import React, { useState } from "react";

const NBGSidebarDemo = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  // Mock client data for demo
  const clientData = {
    name: "Sarah M.",
    remainingMinutes: 0,
  };

  // Mock AI-generated gameplan based on "reading" the session
  const aiGameplan = {
    mainTheme: "Rebuilding trust after disclosure",
    keyInsights: [
      "Client expressed fear of vulnerability",
      "Partner responded positively to boundaries discussion",
      "Ready to practice 'I feel' statements",
    ],
    suggestedNextSteps: "Weekly check-ins using new framework",
  };

  const slides = [
    // Slide 1: Pre-Session Reminder
    {
      type: "pre-session",
      icon: "💙",
      title: "Before You Start",
      subtitle: "Pre-Session",
      content: (
        <div className="h-full flex flex-col gap-4">
          {/* Content Cards */}
          <div className="flex-grow flex flex-col gap-3">
            <div className="flex-1 flex items-start gap-4 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg">
                📋
              </div>
              <div className="flex-grow">
                <p className="font-bold text-slate-800 text-base mb-1">
                  NBG Reminder
                </p>
                <p className="text-slate-600 text-sm">
                  NBG should be completed with{" "}
                  <strong>every client, every session</strong>. It's how we
                  ensure continuity and commitment.
                </p>
              </div>
            </div>

            <div className="flex-1 flex items-start gap-4 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg">
                🔄
              </div>
              <div className="flex-grow">
                <p className="font-bold text-slate-800 text-base mb-1">
                  The NBG Flow
                </p>
                <p className="text-slate-600 text-sm">
                  Future Work → Booking → Purchase
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Always in this order. Booking before Purchase.
                </p>
              </div>
            </div>

            <div className="flex-1 flex items-start gap-4 bg-white rounded-xl p-4 border-2 border-amber-300 shadow-sm bg-amber-50/30">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white text-lg">
                ⚠️
              </div>
              <div className="flex-grow">
                <p className="font-bold text-slate-800 text-base mb-1">
                  Heads Up for This Session
                </p>
                <p className="text-slate-700 text-sm">
                  <strong>{clientData.name}</strong> has{" "}
                  <strong className="text-red-600">no remaining time</strong>{" "}
                  after this session. Make NBG a priority.
                </p>
              </div>
            </div>
          </div>

          {/* Tip Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
            <p className="text-amber-800 text-sm font-medium flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span>
                Plan to start NBG at the <strong>15-minute mark</strong>.
              </span>
            </p>
          </div>
        </div>
      ),
    },

    // Slide 2: Live Guidance (Future Work)
    {
      type: "live-guidance",
      icon: "🔴",
      title: "Live Guidance",
      subtitle: "NBG Step 1: Future Work",
      content: (
        <div className="h-full flex flex-col gap-4">
          {/* Timer Alert */}
          <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-xl p-4 flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">15</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
            <p className="text-white font-bold text-lg">
              Minutes Left — Time to start NBG!
            </p>
          </div>

          {/* Content Cards - Future Work Steps */}
          <div className="flex-grow flex flex-col gap-3">
            <div className="flex-1 flex flex-col bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  1
                </div>
                <p className="font-bold text-slate-800 text-lg">OPENING</p>
              </div>
              <div className="flex gap-4 flex-grow">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-3">
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Summarize the takeaways and provide your analysis.
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Reflect how they feel and why.
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Name their goal and transition to plan.
                    </p>
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 flex flex-col justify-center gap-1">
                  <p className="text-white text-lg font-bold">
                    "Here's what I'm seeing..."
                  </p>
                  <p className="text-white text-lg font-bold">
                    "You've been feeling like..."
                  </p>
                  <p className="text-white text-lg font-bold">"You want..."</p>
                  <p className="text-white text-lg font-bold">
                    "Here's what our work together will look like..."
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  2
                </div>
                <p className="font-bold text-slate-800 text-lg">GAME PLAN</p>
                <span className="text-purple-500 text-xs">✨ AI</span>
              </div>
              <div className="flex gap-4 flex-grow">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-3">
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Give 3 clear points of action.
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Organize sequentially (Immediate → Next → Deeper).
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Use emotionally compelling, client-specific language.
                    </p>
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 flex flex-col justify-center gap-2">
                  <p className="text-white text-2xl font-bold">
                    "First, we'll..."
                  </p>
                  <p className="text-white text-2xl font-bold">
                    "Then we'll..."
                  </p>
                  <p className="text-white text-2xl font-bold">
                    "Finally, we'll..."
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  3
                </div>
                <p className="font-bold text-slate-800 text-lg">
                  CAMARADERIE CLOSE
                </p>
              </div>
              <div className="flex gap-4 flex-grow">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-3">
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Show them you understand how important their goal is.
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Offer partnership statement (we're together).
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Pause for buy-in before booking.
                    </p>
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-white text-base font-bold leading-relaxed">
                    "I'm here to support you every step of the way, and I'm
                    confident we can get there together. How does that sound?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 3: Booking NBG
    {
      type: "booking",
      icon: "📅",
      title: "Booking",
      subtitle: "NBG Step 2: Booking",
      content: (
        <div className="h-full flex flex-col gap-4">
          {/* Content Cards */}
          <div className="flex-grow flex flex-col gap-3">
            <div className="flex-1 flex flex-col bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  1
                </div>
                <p className="font-bold text-slate-800 text-lg">
                  TRANSITION SMOOTHLY
                </p>
              </div>
              <div className="flex gap-4 flex-grow">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-slate-600 text-base leading-snug font-semibold">
                    Once the client agrees to the plan, immediately move into
                    scheduling.
                  </p>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-white text-lg font-bold">
                    "Let's go ahead and get our next session in the books."
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  2
                </div>
                <p className="font-bold text-slate-800 text-lg">
                  MAKE A RECOMMENDATION
                </p>
              </div>
              <div className="flex gap-4 flex-grow">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-slate-600 text-base leading-snug font-semibold">
                    Suggest a timeframe with a rationale tied to their goals.
                    Narrow down to a day, then share all your available slots on
                    that day.
                  </p>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-white text-lg font-bold">
                    "My recommendation is we meet at/on ___ because/so we can
                    ___."
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  3
                </div>
                <p className="font-bold text-slate-800 text-lg">
                  CONFIRM & BOOK IT LIVE
                </p>
              </div>
              <div className="flex gap-4 flex-grow">
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-slate-600 text-base leading-snug font-semibold">
                    Confirm the time and actually book the appointment in the
                    interface right then and there.
                  </p>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-white text-lg font-bold">
                    "Excellent, we're all set for ___."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // Slide 4: Purchase NBG
    {
      type: "purchase",
      icon: "💳",
      title: "Purchase",
      subtitle: "NBG Step 3: Purchase",
      content: (
        <div className="h-full flex flex-col gap-4">
          {/* Content Cards */}
          <div className="flex-grow flex flex-col gap-3">
            <div className="flex-1 flex flex-col bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  1
                </div>
                <p className="font-bold text-slate-800 text-lg">
                  RECOMMEND (1 Plan)
                </p>
              </div>
              <div className="flex gap-4 flex-grow">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-2">
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Explain your recommendation clearly.
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Recommend ONE plan.
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Don't share other options yet.
                    </p>
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-white text-base font-bold">
                    "My recommendation is the [X] Session Plan. This gives us
                    the opportunity to work toward [GOAL] with the dedicated
                    time that something this important deserves."
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  2
                </div>
                <p className="font-bold text-slate-800 text-lg">
                  VALUE (Hourly Rate)
                </p>
              </div>
              <div className="flex gap-4 flex-grow">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-2">
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Share hourly rate (not total).
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Compare to single-session rate.
                    </p>
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-white text-base font-bold">
                    "Also, this Plan brings the session cost down to $175/hr
                    compared to going session-by-session at the full price of
                    $250. You're saving $75 every session."
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  3
                </div>
                <p className="font-bold text-slate-800 text-lg">
                  CONFIDENT CLOSE
                </p>
              </div>
              <div className="flex gap-4 flex-grow">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-2">
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Don't ask permission.
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Process immediately.
                    </p>
                    <p className="text-slate-600 text-base leading-snug font-semibold">
                      • Confirm success.
                    </p>
                  </div>
                </div>
                <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-white text-base font-bold">
                    "Perfect, I'll go ahead and add your Coaching Plan to your
                    account now..."
                  </p>
                  <p className="text-white text-sm font-semibold mt-2">
                    [Process Payment]
                  </p>
                  <p className="text-white text-base font-bold mt-2">
                    "Great, we're all set! I'm looking forward to continuing our
                    work together, [Name]!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentSlideData = slides[currentSlide];

  return (
    <div
      className="h-screen w-full bg-white flex flex-col"
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <span className="text-xl">🔴</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg">Live Guidance</p>
              <p className="text-blue-200 text-sm">
                {currentSlideData.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentSlide
                    ? "bg-white w-6"
                    : "bg-white/40 hover:bg-white/60 w-2.5"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto p-5 bg-gradient-to-b from-slate-50 to-white">
        {currentSlideData.content}
      </div>

      {/* Navigation Footer */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={prevSlide}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors text-base font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Prev
          </button>

          <span className="text-slate-400 text-sm font-medium">
            {currentSlide + 1} / {totalSlides}
          </span>

          <button
            onClick={nextSlide}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-base font-medium"
          >
            Next
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NBGSidebarDemo;
