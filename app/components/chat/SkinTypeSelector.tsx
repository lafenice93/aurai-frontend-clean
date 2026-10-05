"use client";

import { skinTypes, type SkinType, type SkinTypeId } from "@/app/lib/skinTypes";
import ChoiceCards from "./ChoiceCards";
import { CARD_GAP_MS } from "@/app/lib/reveal";

type SkinTypeSelectorProps = {
  selected: SkinTypeId | null;
  onSelect: (type: SkinType) => void;
  onUnsure: () => void;
};

export default function SkinTypeSelector({
  selected,
  onSelect,
  onUnsure,
}: SkinTypeSelectorProps) {
  return (
    <ChoiceCards
      testId="skin-type-button"
      cardGapMs={CARD_GAP_MS / 2}
      imageVariant="skin-type"
      gradientRightExtension={40}
      imageRightExtension={59}
      contentRightShift={24}
      textPositionOffset={5}
      itemLabel={(label) => `피부타입 선택: ${label}`}
      selected={selected}
      onUnsure={onUnsure}
      onSelect={(id) => {
        const type = skinTypes.find((item) => item.id === id);
        if (type) {
          onSelect(type);
        }
      }}
      items={skinTypes.map((type) => ({
        id: type.id,
        label: type.label,
        lines: [...type.cardLines],
        photo: type.photo,
        icon: type.icon,
      }))}
    />
  );
}
