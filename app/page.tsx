"use client";

import { useState } from "react";

const onboardingImages = [
  "/onboarding/01-main.png",
  "/onboarding/02-main.png",
  "/onboarding/03-main.png",
  "/onboarding/04-signup.jpeg",
  "/onboarding/05-profile.png",
  "/onboarding/06-chat-start.png",
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastPage = currentIndex === onboardingImages.length - 1;

  function goNext() {
    if (!isLastPage) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function goPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#674631]">
      <img
        src={onboardingImages[currentIndex]}
        alt={`AURAI 온보딩 화면 ${currentIndex + 1}`}
        className="h-screen w-full object-cover"
      />

      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-3 px-6">
        {currentIndex > 0 && (
          <button
            onClick={goPrevious}
            className="rounded-full bg-black/30 px-5 py-3 text-sm text-white backdrop-blur-md"
          >
            이전
          </button>
        )}

        <button
          onClick={goNext}
          className="rounded-full bg-[#D9A66A] px-8 py-3 font-medium text-[#3B2418] shadow-lg"
        >
          {isLastPage ? "AURAI 시작하기" : "다음"}
        </button>
      </div>

      <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70">
        {currentIndex + 1} / {onboardingImages.length}
      </div>
    </main>
  );
}