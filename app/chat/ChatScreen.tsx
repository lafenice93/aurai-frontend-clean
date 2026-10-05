"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatHeader from "@/app/components/chat/chatHeader";
import ChatInput from "@/app/components/chat/chatInput";
import ChatMessages, {
  type Attachment,
  type Message,
} from "@/app/components/chat/chatMessages";
import QuickPrompts from "@/app/components/quick-prompts/QuickPrompts";
import SkinTypeMediaCard from "@/app/components/chat/SkinTypeMediaCard";
import SkinTypeSelector from "@/app/components/chat/SkinTypeSelector";
import ConcernSelector from "@/app/components/chat/ConcernSelector";
import ConcernAreaSelector, {
  SelectedConcernBubble,
} from "@/app/components/chat/ConcernAreaSelector";
import RecommendCard from "@/app/components/chat/RecommendCard";
import CameraCard from "@/app/components/chat/CameraCard";
import SkinPhotoFlow from "@/app/components/chat/SkinPhotoFlow";
import type { SkinPhotoSubmission } from "@/app/lib/skinPhoto";
import ProductResultCard, { type ProductImage } from "@/app/components/chat/ProductResultCard";
import { useSearchParams } from "next/navigation";
import AnalysisScreen from "@/app/analysis/AnalysisScreen";
import ActionChips from "@/app/components/chat/ActionChips";
import TypingIndicator from "@/app/components/chat/TypingIndicator";
import { sendChatMessage } from "@/app/lib/api/chat";
import { recognizeProducts } from "@/app/lib/api/products";
import { blobToDataUrl } from "@/app/lib/camera/capture";
import type { CapturedPhoto } from "@/app/lib/camera/types";
import { saveAnalysisHandoff } from "@/app/lib/products/handoff";
import type { RecognizedProduct } from "@/app/lib/schemas/productRecognition";
import { findConcern, type Concern, type ConcernId } from "@/app/lib/concerns";
import {
  getConcernAreaFlow,
  type ConcernAreaFlowId,
  type ConcernAreaId,
} from "@/app/lib/concernAreas";
import { newId } from "@/app/lib/id";
import { traceFail, traceStep } from "@/app/lib/products/diagnostics";
import { guidanceIssues, recognitionOutcome } from "@/app/lib/products/recognition";
import { BUBBLE_GAP_MS, revealEnd } from "@/app/lib/reveal";
import { useUserProfile } from "@/app/lib/useUserProfile";
import { authHeaders } from "@/app/lib/api/authHeaders";
import {
  concernSelected,
  fill,
  ko,
  quickPromptSelected,
  skinTypeAck,
  skinTypeSelected,
  welcomeLines,
} from "@/app/lib/locale/ko";
import {
  findSkinType,
  type SkinType,
  type SkinTypeId,
} from "@/app/lib/skinTypes";
import type { ChatRequest, ChatResponse } from "@/app/lib/types";

type Entry = Omit<Message, "id" | "timestamp">;

// 사진 인식 진행 상태. 버튼 잠금과 재시도 판단에 쓴다.
type RecognitionState =
  | "idle"
  | "captured"
  | "analyzing"
  | "success"
  | "needs_review"
  | "error";

export default function ChatScreen() {
  const { givenName, loading: profileLoading } = useUserProfile();
  const name = givenName ?? undefined;
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setMessages((current) => current.some((message) => message.id === "greeting")
        ? current
        : [{ id: "greeting", role: "assistant", lines: welcomeLines(), timestamp: null,
            decorated: true, revealAt: Date.now(), attachment: { kind: "quick-prompts", prompts: ko.QUICK_PROMPTS } }, ...current]);
    });
    return () => { active = false; };
  }, []);
  const skinTypeStartedRef = useRef(false);
  const [skinTypeStarted, setSkinTypeStarted] = useState(false);
  const selectedRef = useRef<SkinTypeId | null>(null);
  // 확정 사진과 설문 스냅샷: 향후 피부 분석 API로 넘기는 연결 지점.
  const skinPhotoSubmission = useRef<SkinPhotoSubmission | null>(null);
  const [selected, setSelected] = useState<SkinTypeId | null>(null);
  const [concern, setConcern] = useState<ConcernId | null>(null);
  const concernRef = useRef<ConcernId | null>(null);
  const concernRevision = useRef(0);
  const concernSaveQueue = useRef<Promise<boolean>>(Promise.resolve(true));
  const [selectedAreas, setSelectedAreas] = useState<ConcernAreaId[]>([]);
  const [customArea, setCustomArea] = useState("");
  const [areasConfirmed, setAreasConfirmed] = useState(false);
  const areasConfirmedRef = useRef(false);
  // 입력창 상태: idle → sending → responding → idle / error
  const [chatStatus, setChatStatus] = useState<"idle" | "sending" | "responding" | "error">("idle");
  const isSending = chatStatus === "sending" || chatStatus === "responding";
  const conversationId = useRef<string>("");
  const mounted = useRef(true);
  // 촬영 후 "이 사진 사용"으로 확정된 사진. 다시 시도 때 그대로 재전송한다.
  const pendingPhoto = useRef<CapturedPhoto | null>(null);
  const [recognition, setRecognition] = useState<RecognitionState>("idle");
  // ?analysis=<tempId> 가 있으면 채팅 대신 분석 화면을 그린다. 대화 상태는 그대로 유지된다.
  const analysisId = useSearchParams().get("analysis");

  useEffect(() => {
    // StrictMode(dev)는 effect를 한 번 정리했다 다시 실행하므로, 여기서 true로 되돌려야 한다.
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // 피부 타입 퀵프롬프트의 안내가 끝난 뒤 선택 카드를 보여준다.
  function askSkinType(): Entry[] {
    return [
      {
        role: "assistant",
        lines: [...ko.SKIN_TYPE_INTRO],
        attachment: { kind: "skin-types" },
        group: "skin-types",
      },
    ];
  }

  function askConcern(): Entry[] {
    return [
      {
        role: "assistant",
        lines: [...ko.CONCERN_INTRO],
        attachment: { kind: "concerns" },
        group: "concerns",
      },
    ];
  }

  function askConcernAreas(concernId: ConcernAreaFlowId): Entry[] {
    const flow = getConcernAreaFlow(concernId);
    if (!flow) return [];
    return [
      {
        role: "user",
        lines: [],
        attachment: { kind: "concern-summary", concernId },
        group: "concern-areas",
      },
      {
        role: "assistant",
        lines: [...flow.question],
        attachment: { kind: "concern-areas", concernId },
        group: "concern-areas",
      },
    ];
  }

  function selectedAreaLabels() {
    const areas = getConcernAreaFlow(concern)?.areas ?? [];
    return [
      ...areas.filter((area) => selectedAreas.includes(area.id)).map((area) => area.label),
      ...(customArea.trim() ? [customArea.trim()] : []),
    ].join(", ");
  }

  function selectedAreaMessage(labels = selectedAreaLabels(), selectedConcern = concern) {
    if (selectedConcern === "pigmentation-tone") {
      const locations: Record<string, string> = {
        볼: "볼 부분",
        이마: "이마부분",
        코: "코 주변",
        입가: "입가 주변",
        눈밑: "눈 밑",
        손등: "손등",
      };
      const location = labels.split(", ").map(label => locations[label] ?? label).join(", ");
      return `${location} 잡티가 고민이야`;
    }
    const concernNoun: Partial<Record<ConcernAreaFlowId, string>> = {
      "wrinkles-elasticity": "주름",
      "sebum-pores": "모공",
      "pigmentation-tone": "잡티",
      "acne-trouble": "트러블",
      "redness-sensitivity": "붉어짐",
      "scars": "흉터",
      "dryness-flaking": "건조함",
    };
    const noun = selectedConcern ? concernNoun[selectedConcern] : undefined;
    return noun ? `${labels}${noun}이 고민이야` : `${labels}이 고민이야`;
  }

  function recommendationConcern() {
    const label = findConcern(concern ?? undefined)?.label;
    return getConcernAreaFlow(concern) && areasConfirmed
      ? `${label} (${selectedAreaLabels()})`
      : label;
  }

  // 추천 카드 첫 줄은 고른 피부타입과 고민을 모두 담는다.
  function recommendSteps(type: SkinType, concernLabel?: string): Entry[] {
    const lines = fill(ko.RECOMMEND_BODY, {
      user: name,
      label: type.label,
      concern: concernLabel,
    });

    if (!concernLabel) {
      lines[0] = fill([ko.RECOMMEND_LEAD_NO_CONCERN], { label: type.label })[0];
    }

    return [
      {
        role: "assistant",
        lines: [],
        attachment: { kind: "recommend", lines },
        group: "concern-results",
      },
      { role: "assistant", lines: fill(ko.PRODUCT_REQUEST, { user: name }), group: "concern-results" },
      { role: "assistant", lines: [], attachment: { kind: "camera" }, group: "concern-results" },
    ];
  }

  // 새 메시지의 텍스트는 앞 말풍선이 다 드러난 뒤에 시작하도록 시작 시각을 연쇄로 배정한다.
  const withReveal = useCallback((current: Message[], rawEntries: Entry[]): Message[] => {
    // "좋아요, OO님."은 대화에 이미 있으면 다시 붙이지 않는다.
    const hasAck = current.some((message) => message.ack);
    const entries = hasAck ? rawEntries.filter((entry) => !entry.ack) : rawEntries;

    const now = Date.now();
    const last = current[current.length - 1];
    // 앞 말풍선 글자가 다 나타난 뒤 한 박자(2초) 쉬고 시작한다.
    let cursor = last ? revealEnd(last, now) + BUBBLE_GAP_MS : now;

    const next = entries.map((entry) => {
      const message: Message = {
        ...entry,
        id: newId(),
        timestamp: new Date(),
        revealAt: Math.max(now, cursor),
      };
      // "생각 중" 표시는 사용자 말풍선 직후에 바로 붙는다(2초 쉼 없이).
      const gap = entry.attachment?.kind === "typing" ? 150 : BUBBLE_GAP_MS;
      cursor = revealEnd(message, now) + gap;
      return message;
    });

    return [...current, ...next];
  }, []);

  // 최종 확인과 두 설문이 모두 끝난 뒤 하나의 안정된 첨부 블록만 추가한다.
  useEffect(() => {
    if (profileLoading || !selected || !areasConfirmed || !concern) return;
    const revision = concernRevision.current;
    const context = {
      skinType: selected,
      concern,
      areaIds: [...selectedAreas],
      areaLabels: (getConcernAreaFlow(concern)?.areas ?? [])
        .filter((area) => selectedAreas.includes(area.id)).map((area) => area.label),
      customArea: customArea.trim(),
    };
    let active = true;
    queueMicrotask(() => {
      if (!active || revision !== concernRevision.current || !areasConfirmedRef.current) return;
      if (skinPhotoSubmission.current) skinPhotoSubmission.current = { ...skinPhotoSubmission.current, context };
      setMessages((current) => current.some((message) => message.attachment?.kind === "skin-photo")
        ? current.map(message => message.attachment?.kind === "skin-photo"
          ? { ...message, attachment: { ...message.attachment, context } } : message)
        : withReveal(current, [{ role: "assistant", lines: [],
            group: "concern-results", attachment: { kind: "skin-photo", context } }]));
    });
    return () => { active = false; };
  }, [profileLoading, selected, areasConfirmed, concern, selectedAreas, customArea, withReveal]);

  function append(entries: Entry[]) {
    setMessages((current) => withReveal(current, entries));
  }

  function ensureConversationId() {
    if (!conversationId.current) {
      conversationId.current = newId();
    }
    return conversationId.current;
  }

  // 카드 선택 저장용. silent라 서버는 저장만 하고 모델을 부르지 않는다.
  async function postChat(
    payload: Omit<ChatRequest, "conversationId" | "userName" | "silent">,
  ) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...await authHeaders() },
      body: JSON.stringify({
        ...payload,
        userName: name,
        conversationId: ensureConversationId(),
        silent: true,
      } satisfies ChatRequest),
    });

    if (!response.ok) {
      throw new Error(`요청 실패: ${response.status}`);
    }

    return (await response.json()) as ChatResponse;
  }

  // 변경 순서대로 저장해 늦은 이전 응답이 최신 고민을 덮어쓰지 않게 한다.
  function saveConcernChoice(
    payload: Omit<ChatRequest, "conversationId" | "userName" | "silent">,
    revision: number,
  ) {
    const saved = concernSaveQueue.current.then(() => {
      if (revision !== concernRevision.current) return true;
      return postChat(payload).then(() => true).catch(() => false);
    });
    concernSaveQueue.current = saved;
    return saved;
  }

  function handleQuickPrompt(prompt: string) {
    if (prompt !== ko.QUICK_PROMPTS[0] || profileLoading || skinTypeStartedRef.current) return;
    skinTypeStartedRef.current = true;
    setSkinTypeStarted(true);
    append([
      { role: "user", lines: [prompt], group: "skin-types" },
      { role: "assistant", lines: [skinTypeAck(name)], group: "skin-types", ack: true },
      { role: "assistant", lines: [quickPromptSelected(prompt)], group: "skin-types" },
      ...askSkinType(),
    ]);
  }

  // 선택 → 확인 멘트 두 개 → 선택한 타입 카드 → 다음 단계. 간격은 withReveal의 연쇄 배정이 정한다.
  // 저장은 UI 흐름과 나란히 진행하고, 실패했을 때만 마지막에 알린다.
  async function handleSelect(type: SkinType) {
    if (selectedRef.current !== null) return;
    selectedRef.current = type.id;
    const pendingAreaFlow = !areasConfirmed ? getConcernAreaFlow(concern) : null;
    setSelected(type.id);
    const saved = postChat({ message: type.label, selectedSkinType: type.id })
      .then(() => true)
      .catch(() => false);

    const entries: Entry[] = [
      { role: "user", lines: [type.label], icon: type.icon },
      { role: "assistant", lines: [skinTypeAck(name)], ack: true },
      { role: "assistant", lines: [skinTypeSelected(type.label)] },
      {
        role: "assistant",
        lines: [],
        attachment: { kind: "media", skinTypeId: type.id },
      },
      {
        role: "assistant",
        lines: fill(ko.SKIN_TYPE_DIRECTION, { user: name, label: type.label }),
      },
      // 부위 선택이 필요한 고민은 부위를 확정해야 추천으로 이어진다.
      ...(areasConfirmed && getConcernAreaFlow(concern) ? [] : pendingAreaFlow
        ? askConcernAreas(pendingAreaFlow.id)
        : concern ? recommendSteps(type, recommendationConcern()) : askConcern()),
    ];

    setMessages((current) => withReveal(
      pendingAreaFlow
        ? current.filter((message) => message.group !== "concern-areas")
        : current,
      entries,
    ));

    if (!(await saved) && mounted.current) {
      append([{ role: "assistant", lines: [ko.SAVE_FAILED] }]);
    }
  }

  function appendFailure(message: string | null) {
    append([
      {
        role: "assistant",
        lines: [message ?? ko.RECOGNITION_FAILED],
        attachment: {
          kind: "actions",
          actions: [
            { id: "retry", label: ko.RETRY, primary: true },
            { id: "retake", label: ko.CAMERA_RETAKE },
          ],
        },
      },
    ]);
  }

  // 사진 → 서버 인식 → 결과 카드. 성분·적합성은 아직 다루지 않는다.
  // try → 성공 / catch → 실패 말풍선 / finally → 어떤 경우에도 "analyzing"에 남지 않는다.
  async function recognize(photo: CapturedPhoto) {
    traceStep("analyze-start", { bytes: photo.blob.size, type: photo.blob.type });
    setRecognition("analyzing");
    append([{ role: "assistant", lines: [ko.RECOGNIZING] }]);
    let settled = false;

    try {
      const outcome = await recognizeProducts(photo);
      if (!mounted.current) {
        traceFail("unmounted-before-result");
        return;
      }

      if (!outcome.ok) {
        setRecognition("error");
        settled = true;
        appendFailure(outcome.message);
        return;
      }

      const { result } = outcome;
      const verdict = recognitionOutcome(result);
      const guidance = guidanceIssues(result).map((issue) => ko.IMAGE_ISSUE[issue]);

      if (verdict === "empty") {
        setRecognition("needs_review");
        settled = true;
        append([
          {
            role: "assistant",
            lines: [ko.RECOGNIZED_NONE, ...guidance],
            attachment: {
              kind: "actions",
              actions: [{ id: "retake", label: ko.CAMERA_RETAKE, primary: true }],
            },
          },
        ]);
        traceStep("ui-updated", { outcome: verdict, issues: result.imageQuality.issues });
        return;
      }

      setRecognition(verdict === "success" ? "success" : "needs_review");
      settled = true;

      append([
        {
          role: "assistant",
          lines: [
            verdict === "success" ? ko.ANALYZE_DONE : ko.RECOGNIZED_REVIEW,
            ...guidance,
          ],
          // 카드가 원본에서 제품별 썸네일을 잘라내므로 Blob을 그대로 넘긴다.
          attachment: { kind: "products", result, photo: photo.blob },
        },
      ]);
      traceStep("ui-updated", { outcome: verdict, count: result.products.length });
    } catch (error) {
      // 응답 이후(판정·URL·상태 갱신)에서 터진 예외도 여기로 온다. 로딩에 남기지 않는다.
      traceFail("client-after-response", error instanceof Error ? `${error.name}: ${error.message}` : String(error));
      if (mounted.current) {
        setRecognition("error");
        settled = true;
        appendFailure(null);
      }
    } finally {
      if (!settled && mounted.current) {
        setRecognition("error");
      }
    }
  }

  // "이 사진 사용" — CameraCard는 Blob만 넘기고, 호출은 여기서 한다.
  function handleUsePhoto(photo: CapturedPhoto) {
    const blob = photo?.blob;
    const detail = {
      hasBlob: blob instanceof Blob,
      bytes: blob?.size ?? 0,
      type: blob?.type ?? "",
      width: photo?.width,
      height: photo?.height,
      source: photo?.source,
    };
    traceStep("capture-ready", detail);

    const validType = ["image/jpeg", "image/png", "image/webp"].includes(blob?.type ?? "");
    if (!(blob instanceof Blob) || blob.size === 0 || !validType) {
      traceFail("capture-ready", detail);
      setRecognition("error");
      appendFailure(ko.CAMERA_CAPTURE_FAILED);
      return;
    }

    pendingPhoto.current = photo;
    setRecognition("captured");
    void recognize(photo);
  }

  // "분석 보기" — 제품·썸네일·피부 정보를 sessionStorage로 넘기고 분석 페이지로 이동. 분석 호출은 그 페이지가 한다.
  async function handleAnalyze(product: RecognizedProduct, image: ProductImage) {
    // 공식 이미지는 서버 경로라 그대로 저장, 촬영 crop(blob:)은 새 페이지에서 못 읽으니 data URL로 바꿔 둔다.
    let thumb: string | null = null;
    if (image?.kind === "official") {
      thumb = image.url;
    } else if (image) {
      try {
        thumb = await blobToDataUrl(await (await fetch(image.url)).blob());
      } catch {
        thumb = null;
      }
    }
    saveAnalysisHandoff(product.tempId, {
      product,
      thumb,
      skinType: selected,
      concern,
      userName: name ?? "",
    });
    // 같은 /chat 라우트 안에서 쿼리만 바꾼다(shallow) — 대화 상태를 잃지 않고 뒤로가기로 돌아온다.
    // /analysis?id= 로 직접 열어도 같은 화면이 뜬다(새로고침·공유용).
    window.history.pushState(null, "", `/chat?analysis=${encodeURIComponent(product.tempId)}`);
  }

  function handleAction(id: string) {
    if (id === "retry" && pendingPhoto.current && recognition !== "analyzing") {
      void recognize(pendingPhoto.current);
      return;
    }
    if (id === "retake") {
      // 이전 카메라 카드는 사용 완료 상태로 남고, 새 카드가 카메라를 다시 켠다.
      setRecognition("idle");
      append([{ role: "assistant", lines: [], attachment: { kind: "camera" } }]);
    }
  }

  async function handleConcern(picked: Concern) {
    if (concernRef.current === picked.id) return;
    const isReselect = concernRef.current !== null;
    concernRef.current = picked.id;
    const revision = ++concernRevision.current;
    const type = findSkinType(selected ?? undefined);
    const areaFlow = getConcernAreaFlow(picked.id);

    skinPhotoSubmission.current = null;
    setConcern(picked.id);
    setSelectedAreas([]);
    setCustomArea("");
    setAreasConfirmed(false);
    areasConfirmedRef.current = false;
    const saved = saveConcernChoice({ message: picked.label, selectedConcern: picked.id }, revision);

    setMessages((current) => {
      // 최초 안내와 선택 목록은 그대로 두고 이전 고민의 결과만 교체한다.
      const retained = current.filter((message) =>
        message.group !== "concern-areas" && message.group !== "concern-results");
      const needsSkinType = !type && !retained.some((message) => message.attachment?.kind === "skin-types");
      const entries: Entry[] = areaFlow ? [
        ...(needsSkinType ? askSkinType() : []),
        ...askConcernAreas(areaFlow.id),
      ] : [
        { role: "user", lines: [picked.label], group: "concern-results" },
        ...(!isReselect ? [
          { role: "assistant" as const, lines: [skinTypeAck(name)], ack: true, group: "concern-results" as const },
          { role: "assistant" as const, lines: [concernSelected(picked.label)], group: "concern-results" as const },
        ] : []),
        ...(type ? recommendSteps(type, picked.label) : needsSkinType ? askSkinType() : []),
      ];
      return withReveal(retained, entries);
    });

    if (!(await saved) && mounted.current && revision === concernRevision.current) {
      append([{ role: "assistant", lines: [ko.SAVE_FAILED], group: "concern-results" }]);
    }
  }

  function handleToggleArea(id: ConcernAreaId) {
    const flow = getConcernAreaFlow(concern);
    if (concernRef.current !== concern || !flow?.areas.some((area) => area.id === id)) return;
    if (areasConfirmedRef.current) {
      if (selectedAreas.length === 1 && selectedAreas[0] === id && !customArea.trim()) return;
      ++concernRevision.current;
      areasConfirmedRef.current = false;
      setAreasConfirmed(false);
      setSelectedAreas([id]);
      setCustomArea("");
      return;
    }
    setSelectedAreas((current) => current.includes(id)
      ? current.filter((area) => area !== id)
      : [...current, id]);
  }

  function handleSelectAllAreas() {
    const flow = getConcernAreaFlow(concern);
    if (areasConfirmedRef.current || concernRef.current !== concern || !flow) return;
    setSelectedAreas((current) => current.length === flow.areas.length
      ? []
      : flow.areas.map((area) => area.id));
  }

  async function confirmSelectedAreas() {
    const flow = getConcernAreaFlow(concern);
    if (!flow || !selectedRef.current || areasConfirmedRef.current || concernRef.current !== flow.id) return;
    const revision = concernRevision.current;
    const labels = selectedAreaLabels();
    if (!labels) {
      areasConfirmedRef.current = false;
      setAreasConfirmed(false);
      setMessages((current) => current.filter((item) =>
        item.attachment?.kind !== "skin-photo" &&
        !(item.group === "concern-areas" && item.role === "user" && !item.attachment)));
      return;
    }

    areasConfirmedRef.current = true;
    setAreasConfirmed(true);
    const message = selectedAreaMessage(labels);
    const saved = saveConcernChoice({ message, selectedConcern: flow.id }, revision);
    setMessages((current) => current.some((item) => item.group === "concern-areas" && item.role === "user" && !item.attachment)
      ? current.map((item) => item.group === "concern-areas" && item.role === "user" && !item.attachment
        ? { ...item, lines: [message] } : item)
      : withReveal(current, [{ role: "user", lines: [message], group: "concern-areas" }]));

    if (!(await saved) && mounted.current && revision === concernRevision.current) {
      append([{ role: "assistant", lines: [ko.SAVE_FAILED], group: "concern-results" }]);
    }
  }

  // 자유 대화: 사용자 말풍선 → 생각 중 표시 → 서버(/api/chat → OpenAI) → AI 말풍선.
  // idle → sending → responding → idle(완료) / error. 진행 중에는 중복 전송을 막는다.
  async function handleSend(text: string) {
    const message = text.trim();
    if (!message || chatStatus === "sending" || chatStatus === "responding") {
      return;
    }

    setChatStatus("sending");
    append([
      { role: "user", lines: [message] },
      { role: "assistant", lines: [], attachment: { kind: "typing" } },
    ]);

    const result = await sendChatMessage({
      message,
      selectedSkinType: selected ?? undefined,
      selectedConcern: concern ?? undefined,
      userName: name,
      conversationId: ensureConversationId(),
    });
    if (!mounted.current) {
      return;
    }
    setChatStatus("responding");
    // 생각 중 표시를 걷어내고 답변(또는 오류)을 그 자리에 잇는다.
    setMessages((current) => current.filter((item) => item.attachment?.kind !== "typing"));

    if (!result.ok) {
      const fallback =
        result.kind === "network" ? ko.REPLY_NETWORK
        : result.kind === "timeout" ? ko.REPLY_TIMEOUT
        : result.kind === "empty" ? ko.REPLY_EMPTY
        : ko.REPLY_FAILED;
      console.error("[chat] send failed", { kind: result.kind, status: result.status });
      append([{ role: "assistant", lines: [result.message ?? fallback] }]);
      setChatStatus("error");
      return;
    }

    // 문단(빈 줄) 단위로만 나눈다 — 줄마다 2초씩 드러나는 리듬이라, 목록의 줄까지 쪼개면 긴 답이 수십 초 걸린다.
    // 문단 안의 줄바꿈은 말풍선이 pre-line으로 그대로 보여준다.
    const lines = result.reply.message
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    append([{ role: "assistant", lines: lines.length > 0 ? lines : [ko.REPLY_EMPTY] }]);
    setChatStatus("idle");
  }

  function renderAttachment(attachment: Attachment) {
    if (attachment.kind === "quick-prompts") {
      return <QuickPrompts prompts={attachment.prompts} onSelect={handleQuickPrompt}
        disabled={profileLoading || skinTypeStarted} />;
    }

    if (attachment.kind === "skin-types") {
      return (
        <div className="mt-3">
          <SkinTypeSelector
            selected={selected}
            onSelect={handleSelect}
            onUnsure={() => void handleSend(ko.SKIN_TYPE_UNSURE)}
          />
        </div>
      );
    }

    if (attachment.kind === "concerns") {
      return (
        <div className="mt-3">
          <ConcernSelector
            selected={concern}
            onSelect={handleConcern}
            onUnsure={() => void handleSend(ko.SKIN_TYPE_UNSURE)}
          />
        </div>
      );
    }

    if (attachment.kind === "concern-summary") {
      const flow = getConcernAreaFlow(attachment.concernId);
      return flow ? (
        <SelectedConcernBubble
          summary={flow.summary}
        />
      ) : null;
    }

    if (attachment.kind === "concern-areas") {
      const flow = getConcernAreaFlow(attachment.concernId);
      return flow ? (
        <div className="mt-3">
          <ConcernAreaSelector
            key={flow.id}
            flow={flow}
            selected={selectedAreas}
            customArea={customArea}
            onToggle={handleToggleArea}
            onSelectAll={handleSelectAllAreas}
            onCustomAreaChange={setCustomArea}
            onConfirm={() => void confirmSelectedAreas()}
            canConfirm={selected !== null}
            completed={concern !== flow.id || areasConfirmed}
            inactive={concern !== flow.id}
          />
        </div>
      ) : null;
    }

    if (attachment.kind === "recommend") {
      return (
        <div className="mt-3">
          <RecommendCard lines={attachment.lines} />
        </div>
      );
    }

    if (attachment.kind === "camera") {
      return (
        <div className="mt-3">
          <CameraCard onUsePhoto={handleUsePhoto} />
        </div>
      );
    }

    if (attachment.kind === "skin-photo") {
      return <SkinPhotoFlow
        name={name}
        context={attachment.context}
        onConfirmed={(submission) => { skinPhotoSubmission.current = submission; }}
        onContextChange={(updated) => {
          selectedRef.current = updated.skinType;
          concernRef.current = updated.concern;
          setSelected(updated.skinType);
          setConcern(updated.concern);
          setSelectedAreas(updated.areaIds);
          setCustomArea(updated.customArea);
          setMessages(current => current.map(item => item.attachment?.kind === "skin-photo"
            ? { ...item, attachment: { kind: "skin-photo", context: updated } }
            : item.group === "concern-areas" && item.role === "user" && !item.attachment
              ? { ...item, lines: [selectedAreaMessage([...updated.areaLabels, updated.customArea].filter(Boolean).join(", "), updated.concern)] }
              : item));
        }}
      />;
    }

    if (attachment.kind === "products") {
      return (
        <div className="mt-3">
          <ProductResultCard
            result={attachment.result}
            photo={attachment.photo}
            onAnalyze={(product, image) => void handleAnalyze(product, image)}
          />
        </div>
      );
    }

    if (attachment.kind === "actions") {
      return (
        <ActionChips
          actions={attachment.actions}
          disabled={recognition === "analyzing"}
          onSelect={handleAction}
        />
      );
    }

    if (attachment.kind === "typing") {
      return <TypingIndicator />;
    }

    const type = findSkinType(attachment.skinTypeId);
    return type ? (
      <div className="mt-3">
        <SkinTypeMediaCard type={type} />
      </div>
    ) : null;
  }

  if (analysisId) {
    return <AnalysisScreen id={analysisId} />;
  }

  return (
    <main
      className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text-primary)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--bg-glow)" }}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <ChatHeader />
        <ChatMessages messages={messages} renderAttachment={renderAttachment} />
      </div>

      <ChatInput onSend={handleSend} disabled={isSending || profileLoading} />
    </main>
  );
}
