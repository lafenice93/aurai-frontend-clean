import { ko } from "@/app/lib/locale/ko";
import Orb from "./Orb";
import { Twinkle } from "./Sparkle";
import StarLight from "./StarLight";

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
        <Twinkle
          className="relative inline-block h-[15px] w-[15px] shrink-0"
        >
          <StarLight className="absolute" style={{ left: "50%", top: "50%", width: 60, height: 41.25, transform: "translate(-50%, -50%)" }} />
        </Twinkle>
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
