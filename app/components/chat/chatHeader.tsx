"use client";

import { ko } from "@/app/lib/locale/ko";

export default function ChatHeader() {
  return (
    <header
      className="shrink-0 px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
    >
      <button
        type="button"
        aria-label={ko.MENU_LABEL}
        className="flex w-5 cursor-pointer flex-col gap-[5px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F8EDE4]"
      >
        <span
          className="block h-px w-full"
          style={{ background: "var(--icon-color)" }}
        />
        <span
          className="block h-px w-full"
          style={{ background: "var(--icon-color)" }}
        />
        <span
          className="block h-px w-full"
          style={{ background: "var(--icon-color)" }}
        />
      </button>
    </header>
  );
}
