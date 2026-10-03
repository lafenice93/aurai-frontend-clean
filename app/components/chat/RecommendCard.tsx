import { ko } from "@/app/lib/locale/ko";
import Orb from "./Orb";

export default function RecommendCard({ lines }: { lines: string[] }) {
  return (
    <section
      className="rounded-[18px] px-5 py-4"
      style={{
        background: "var(--bubble-fill)",
        border: "1.3px solid var(--bubble-stroke)",
      }}
    >
      <p className="flex items-center gap-2 text-[15px]">
        <span
          aria-hidden="true"
          className="text-[15px] leading-none"
          style={{ textShadow: "var(--sparkle-glow)" }}
        >
          ✦
        </span>
        {ko.RECOMMEND_TITLE}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {lines.map((line) => (
            <p
              key={line}
              className="text-[12px] leading-[1.45] text-[#F7EEE6]/80"
              style={{ wordBreak: "keep-all" }}
            >
              {line}
            </p>
          ))}
        </div>

        <Orb />
      </div>
    </section>
  );
}
