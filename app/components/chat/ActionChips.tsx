"use client";

// [Web 전용] 결과 말풍선 아래에 붙는 행동 버튼(다시 촬영·다시 시도). 퀵프롬프트 칩 모양을 빌린다.
export type ChatAction = { id: string; label: string; primary?: boolean };

export default function ActionChips({
  actions,
  disabled,
  onSelect,
}: {
  actions: ChatAction[];
  disabled?: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <ul
      className="flex flex-wrap gap-2"
      style={{
        marginTop: "12px",
        paddingLeft: "calc(var(--avatar-size) + var(--avatar-bubble-gap))",
      }}
    >
      {actions.map((action) => (
        <li key={action.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(action.id)}
            data-testid={`action-${action.id}`}
            className="cursor-pointer rounded-[12px] px-4 py-2.5 text-sm transition-transform duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6] disabled:cursor-default disabled:opacity-50"
            style={
              action.primary
                ? {
                    background: "linear-gradient(180deg, #F6E3CF 0%, var(--accent) 100%)",
                    border: "1px solid var(--gold-line)",
                    color: "#3B2418",
                  }
                : {
                    background: "var(--bubble-fill)",
                    border: "1px solid var(--bubble-stroke)",
                    color: "var(--text-primary)",
                  }
            }
          >
            {action.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
