// 말풍선 텍스트가 드러나는 리듬.
export const LINE_MS = 1000; // 한 말풍선 안에서 문장(줄)이 시작되는 간격
export const WORD_MS = 40; // 한 문장 안에서 단어가 이어지는 간격
export const WORD_ANIM_MS = 260; // 단어 하나의 스머징 길이 (.smudge-word와 맞출 것)
export const BUBBLE_GAP_MS = 1000; // 말풍선 글자가 다 나타난 뒤 다음 말풍선·카드까지의 간격
export const CARD_GAP_MS = 1000; // 카드 목록에서 카드가 한 장씩 이어지는 간격 (말풍선과 별도로 조절)

// "나를 눌러" 금빛 신호 — 퀵프롬프트 칩과 선택 카드가 같은 리듬을 쓴다.
export const NUDGE_MS = 3000; // 항목 하나가 신호를 보내는 시간 (.chip-nudge / .card-nudge 길이와 맞출 것)
export const NUDGE_SETTLE_MS = 600; // 마지막 항목의 등장 스머징이 끝나기를 기다리는 여유
export const NUDGE_START_DELAY_MS = 1100; // 항목이 다 나타난 뒤 첫 신호까지 기다리는 시간
export const NUDGE_REPEAT_GAP_MS = 7000; // 신호가 한 바퀴 돈 뒤 다음 바퀴까지 쉬는 시간

/** 항목이 gap 간격으로 count개 나타난 뒤, 첫 신호가 시작되기까지의 시간. */
export function nudgeStartAfter(count: number, gap: number) {
  return (count - 1) * gap + NUDGE_SETTLE_MS + NUDGE_START_DELAY_MS;
}

type Timed = { revealAt?: number; lines: string[] };

// 마지막 문장의 마지막 단어까지 다 나타나는 시각. 예약이 없으면 지금 끝난 것으로 본다.
export function revealEnd(message: Timed, now: number) {
  if (message.revealAt === undefined) {
    return now;
  }

  const count = message.lines.length;
  if (count === 0) {
    return message.revealAt;
  }

  const lastWords = message.lines[count - 1].split(" ").length;
  return (
    message.revealAt + (count - 1) * LINE_MS + (lastWords - 1) * WORD_MS + WORD_ANIM_MS
  );
}

// 첨부물(카드·칩)이 나타나는 시각. 글이 있으면 글이 끝나고 한 박자 뒤, 없으면 예약 시각 그대로.
export function attachmentAt(message: Timed, now: number) {
  if (message.lines.length === 0) {
    return message.revealAt ?? now;
  }

  return revealEnd(message, now) + BUBBLE_GAP_MS;
}
