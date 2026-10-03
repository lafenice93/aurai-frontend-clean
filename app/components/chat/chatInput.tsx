"use client";

import { SubmitEvent, useState } from "react";
import { ko } from "@/app/lib/locale/ko";
import { Star } from "./Sparkle";

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      style={{ filter: "drop-shadow(0 0 2px rgb(255 240 225 / 0.5))" }}
      aria-hidden="true"
    >
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}

function PaperPlaneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      style={{ transform: "translateX(-1px)" }}
      aria-hidden="true"
    >
      <path
        d="M21.3 2.7 3.1 10.3c-.8.3-.8 1.4.05 1.6l7.2 1.9 1.9 7.2c.2.85 1.3.85 1.6.05L21.3 2.7Z"
        fill="currentColor"
      />
      <path
        d="M21.3 2.7 10.35 13.8"
        stroke="rgb(0 0 0 / 0.18)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = value.trim();

    if (!text) {
      return;
    }

    onSend(text);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed left-1/2 z-10 flex h-12 w-[calc(100%-32px)] max-w-[336px] -translate-x-1/2 items-center gap-1 rounded-full px-1.5"
      style={{
        bottom: "env(safe-area-inset-bottom)",
        background:
          "linear-gradient(180deg, rgba(var(--warm), 0.24), rgba(var(--warm), 0.20))",
        border: "1px solid rgba(var(--warm), 0.18)",
        boxShadow: "inset 0 0 8px rgba(var(--warm), 0.12)",
      }}
    >
      <button
        type="button"
        aria-label={ko.ATTACH_LABEL}
        className="flex h-[31px] w-[31px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5F1E1]"
        style={{
          border: "1px solid rgba(var(--warm), 0.35)",
          boxShadow: "inset 0 0 10px rgba(var(--warm), 0.30)",
          color: "var(--ui-ivory)",
        }}
      >
        <PlusIcon />
      </button>

      <div className="relative h-9 min-w-0 flex-1">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={ko.INPUT_PLACEHOLDER}
          aria-label={ko.INPUT_PLACEHOLDER}
          className="h-9 w-full rounded-full bg-transparent pl-[22px] pr-10 text-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5F1E1]"
          style={{
            background: "rgba(var(--field-tint), 0.12)",
            border: "1px solid rgb(255 225 195 / 0.15)",
            boxShadow:
              "0 0 6px rgb(60 35 20 / 0.18), inset 0 1px 3px rgb(255 235 215 / 0.10)",
            color: "var(--ui-ivory)",
            letterSpacing: "-0.02em",
          }}
        />

        <button
          type="button"
          aria-label={ko.MIC_LABEL}
          className="absolute top-1/2 right-[10px] flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5F1E1]"
          style={{ color: "var(--ui-ivory)", opacity: 0.85 }}
        >
          <MicIcon />
        </button>
      </div>

      <button
        type="submit"
        disabled={disabled}
        aria-label={ko.SEND_LABEL}
        className="aurora-ring relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ease-out active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5F1E1] disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, #8D6244 0%, #A26C4A 45%, #BB7D52 70%, #D09065 85%, #E1AB87 95%)",
          boxShadow:
            "0 0 2px rgb(251 224 189 / 0.35), inset 0 0 6px rgb(225 171 135 / 0.55)",
          color: "var(--ui-ivory)",
        }}
      >
        <PaperPlaneIcon />
        <Star size={3} style={{ left: "78%", top: "14%" }} />
        <Star size={3} style={{ left: "22%", top: "86%" }} />
      </button>
    </form>
  );
}
