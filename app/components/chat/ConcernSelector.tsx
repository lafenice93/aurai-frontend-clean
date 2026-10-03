"use client";

import { concerns, type Concern, type ConcernId } from "@/app/lib/concerns";
import { ConcernChoiceCards } from "./ChoiceCards";

type ConcernSelectorProps = {
  selected: ConcernId | null;
  onSelect: (concern: Concern) => void;
  onUnsure: () => void;
};

export default function ConcernSelector({
  selected,
  onSelect,
  onUnsure,
}: ConcernSelectorProps) {
  return (
    <ConcernChoiceCards
      testId="concern-button"
      itemLabel={(label) => `피부 고민 선택: ${label}`}
      selected={selected}
      allowReselect
      onUnsure={onUnsure}
      onSelect={(id) => {
        const concern = concerns.find((item) => item.id === id);
        if (concern) {
          onSelect(concern);
        }
      }}
      items={concerns.map((concern) => ({
        id: concern.id,
        label: concern.label,
        lines: [concern.cardText],
        photo: concern.photo,
        focus: concern.focus,
      }))}
    />
  );
}
