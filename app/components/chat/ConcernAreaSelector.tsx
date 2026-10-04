"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ConcernAreaFlow, ConcernAreaId } from "@/app/lib/concernAreas";
import { ko } from "@/app/lib/locale/ko";
import ChatBubble from "./ChatBubble";
import { ConcernChoiceCards } from "./ChoiceCards";

type ConcernAreaSelectorProps = {
  flow: ConcernAreaFlow;
  selected: readonly ConcernAreaId[];
  customArea: string;
  onToggle: (id: ConcernAreaId) => void;
  onSelectAll: () => void;
  onCustomAreaChange: (value: string) => void;
  onConfirm: () => void;
  canConfirm: boolean;
  completed?: boolean;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6]";

export function SelectedConcernBubble({
  summary,
}: {
  summary: string;
}) {
  return <ChatBubble role="user" lines={[summary]} />;
}

export default function ConcernAreaSelector({
  flow,
  selected,
  customArea,
  onToggle,
  onSelectAll,
  onCustomAreaChange,
  onConfirm,
  canConfirm,
  completed = false,
}: ConcernAreaSelectorProps) {
  const [customOpen, setCustomOpen] = useState(Boolean(customArea.trim()));
  const inputId = useId();
  const customInput = useRef<HTMLInputElement>(null);
  const allSelected = flow.areas.every((area) => selected.includes(area.id));
  const items = useMemo(
    () => flow.areas.map((area) => ({
      id: area.id,
      label: area.label,
      lines: [area.description],
      photo: area.photo,
      focus: area.focus,
    })),
    [flow.areas],
  );

  useEffect(() => {
    if (customOpen && !completed) customInput.current?.focus();
  }, [customOpen, completed]);

  useEffect(() => {
    if (completed || !canConfirm || (!selected.length && !customArea.trim())) return;
    // Selecting a card advances the existing flow without a separate completion button.
    const timer = window.setTimeout(onConfirm, customOpen ? 800 : 300);
    return () => window.clearTimeout(timer);
  }, [selected, customArea, completed, canConfirm, customOpen, onConfirm]);

  function toggleCustomInput() {
    if (customOpen) onCustomAreaChange("");
    setCustomOpen(!customOpen);
  }

  return (
    <div
      data-testid="concern-area-selector"
      data-concern={flow.id}
      className="reveal-scroll space-y-3"
    >
      <p className="break-keep text-[12px] leading-[1.4] text-[#F7EEE6]/90">
        {ko.CONCERN_AREA_HINT}
      </p>

      <ConcernChoiceCards
        items={items}
        selected={selected}
        disabled={completed}
        useSkinTypeImageValues
        // 넓어진 사진 끝 다음에 글자가 시작하도록 기존 위치에서 20px 이동한다.
        textPositionOffset={flow.id === "redness-sensitivity" ? 21 : 0}
        reserveTextOffset={flow.id === "redness-sensitivity"}
        testId="concern-area-button"
        itemDataAttribute="data-area"
        itemLabel={(label) => `피부 고민 부위 선택: ${label}`}
        onSelect={(id) => {
          const area = flow.areas.find((item) => item.id === id);
          if (area) onToggle(area.id);
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[10px] leading-[1.5] text-[#F7EEE6]/75">
        <span className="break-keep">{ko.CONCERN_AREA_REFERENCE}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="concern-area-all"
            aria-pressed={allSelected}
            disabled={completed}
            onClick={onSelectAll}
            className={`cursor-pointer rounded-[8px] underline underline-offset-3 disabled:cursor-default ${focusRing}`}
          >
            {flow.selectAllLabel ?? ko.CONCERN_AREA_ALL}
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            data-testid="concern-area-other"
            aria-expanded={customOpen}
            aria-controls={inputId}
            disabled={completed}
            onClick={toggleCustomInput}
            className={`cursor-pointer rounded-[8px] underline underline-offset-3 disabled:cursor-default ${focusRing}`}
          >
            {ko.CONCERN_AREA_OTHER}
          </button>
        </div>
      </div>

      {customOpen ? (
        <div className="space-y-1.5">
          <label
            htmlFor={inputId}
            className="block break-keep text-[11px] leading-[1.4] text-[#F7EEE6]/85"
          >
            {flow.otherLabel}
          </label>
          <input
            id={inputId}
            ref={customInput}
            type="text"
            data-testid="concern-area-custom-input"
            value={customArea}
            onChange={(event) => onCustomAreaChange(event.target.value)}
            disabled={completed}
            maxLength={100}
            placeholder={ko.CONCERN_AREA_OTHER_PLACEHOLDER}
            className={`w-full rounded-[8px] border bg-transparent px-3 py-2.5 text-[12px] text-[#F7EEE6] placeholder:text-[#F7EEE6]/45 ${focusRing}`}
            style={{ borderColor: "var(--bubble-stroke)" }}
          />
        </div>
      ) : null}

    </div>
  );
}
