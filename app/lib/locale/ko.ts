export const ko = {
  WELCOME_GREETING: "안녕하세요",
  WELCOME_INTRO: "피부 고민을 함께 풀어갈 AI 파트너, AURAI입니다.",
  WELCOME_PROMISE: "피부에 맞는 제품과 일상 속 케어를 함께 찾아드릴게요.",
  INPUT_PLACEHOLDER: "AURAI에게 이야기해 주세요",
  QUICK_PROMPTS: ["피부 타입"],
  SKIN_TYPE_ACK: "좋아요, {name}님.",
  SKIN_TYPE_ACK_FALLBACK: "좋아요.",
  SKIN_TYPE_INTRO: [
    "먼저 평소 피부가 어떤 타입에 가장 가까운지 알려주세요.",
    "정확히 모르셔도 괜찮아요.",
    "지금 느끼는 피부 상태와 가장 비슷한 것을 선택해 주세요.",
  ],
  SKIN_TYPE_UNSURE: "잘 모르겠어요 · AURAI가 도와드릴게요.",
  SKIN_TYPE_SELECTED: "{label}피부를 선택해 주셨어요.",
  SKIN_TYPE_DIRECTION: [
    "{user}의 피부는 {label} 타입에",
    "가깝게 보고 케어 방향을 맞춰볼게요.",
  ],
  RECOMMEND_TITLE: "AURAI 추천",
  // 첫 줄은 사용자가 고른 피부타입과 고민을 모두 담는다. 고민이 없을 때만 NO_CONCERN 문구로 대체.
  RECOMMEND_BODY: [
    "{label}피부의 {concern} 고민을 위한 케어를 함께 살펴볼까요?",
    "{user}의 사용 중인 제품을 알려주세요.",
    "AURAI가 {user}만의 케어 방향을 정교하게 설계합니다.",
  ],
  RECOMMEND_LEAD_NO_CONCERN: "{label}피부를 위한 케어를 함께 살펴볼까요?",
  PRODUCT_REQUEST: [
    "{user}이 사용하는 제품을 보여주세요.",
    "한 장에 여러 제품을 담아도 괜찮아요.",
  ],
  CAMERA_HINT: "제품 앞면과 이름이 보이게 맞춰주세요.",
  CAMERA_TAG: "제품명과 라벨이 보이면 더 정확해요.",
  SKIN_PHOTO_REQUEST: "고민되는 피부 부위를 사진으로 보여주세요.",
  SKIN_PHOTO_GUIDE_TITLE: "{user}의 피부 상태를 함께 살펴볼까요?",
  SKIN_PHOTO_GUIDE_TITLE_FALLBACK: "피부 상태를 함께 살펴볼까요?",
  SKIN_PHOTO_GUIDE_HINT: "고민되는 부위를 촬영해 주세요.",
  SKIN_PHOTO_GUIDE_DIRECTION: "AURAI가 {user}만의 케어 방향을 설계합니다.",
  SKIN_PHOTO_GUIDE_DIRECTION_FALLBACK: "AURAI가 피부에 맞는 케어 방향을 설계합니다.",
  SKIN_CAMERA_HINT: "고민되는 부위가 잘 보이도록 맞춰주세요.",
  SKIN_CAMERA_LIGHT_HINT: "밝은 곳에서 촬영해 주세요.",
  SKIN_PHOTO_RESELECT: "다시 선택하기",
  SKIN_PHOTO_USE: "이 사진 사용하기",
  SKIN_PHOTO_CONFIRMED: "이 사진으로 확정했어요.",
  SURVEY_CONFIRM: "설문 완료 · 촬영으로 이어가기",
  SURVEY_CONFIRMED: "설문 완료",
  SKIN_PHOTO_TAKE: "사진 찍기",
  SKIN_PHOTO_UPLOAD: "사진 올리기",
  SKIN_PHOTO_UPLOADING: "피부 사진을 올리는 중이에요.",
  SKIN_PHOTO_UPLOADED: "피부 사진을 올렸어요.",
  SKIN_PHOTO_UPLOAD_FAILED: "피부 사진을 올리지 못했어요. 다시 시도해 주세요.",
  SKIN_PHOTO_PREVIEW_ALT: "고민되는 피부 부위 사진",
  CAMERA_STARTING: "카메라를 켜는 중이에요",
  CAMERA_DENIED: "카메라 권한이 필요해요.\n브라우저 설정에서 허용해 주세요.",
  CAMERA_NOT_FOUND: "사용할 수 있는 카메라를 찾지 못했어요.",
  CAMERA_INSECURE: "카메라는 HTTPS 연결에서만 쓸 수 있어요.\n주소가 https로 시작하는지 확인해 주세요.",
  CAMERA_FAILED: "카메라를 열지 못했어요. 잠시 후 다시 시도해 주세요.",
  CAMERA_UNSUPPORTED: "이 브라우저는 카메라를 지원하지 않아요.",
  CAMERA_SWITCH_FAILED: "카메라를 바꾸지 못해 이전 카메라로 돌아왔어요.",
  CAMERA_CAPTURE_FAILED: "사진을 찍지 못했어요. 다시 시도해 주세요.",
  CAMERA_FALLBACK_HINT: "앨범에서 사진을 선택할 수도 있어요.",
  CAMERA_FILE_FAILED: "사진을 불러오지 못했어요. 다른 사진을 골라주세요.",
  CAMERA_SHUTTER_LABEL: "사진 촬영",
  CAMERA_GALLERY_LABEL: "앨범에서 선택",
  CAMERA_FLIP_LABEL: "카메라 전환",
  CAMERA_SELECT_LABEL: "카메라 선택",
  CAMERA_RETAKE: "다시 촬영",
  CAMERA_USE_PHOTO: "이 사진 사용",
  CAMERA_PREVIEW_ALT: "촬영한 제품 사진",
  PHOTO_READY: "사진을 확인했어요.",
  ANALYZING: "제품의 형태와 성분을 확인하고 있어요",
  ANALYZE_DONE: "사진에서 이런 제품을 찾았어요.",
  ANALYZE_EMPTY: "사진에서 제품을 알아보지 못했어요.\n라벨이 잘 보이게 다시 찍어주세요.",
  ANALYZE_FAILED: "제품을 분석하지 못했어요. 잠시 후 다시 시도해 주세요.",

  // 제품 인식 (성분 분석 전 단계)
  RECOGNIZING: "사진 속 제품을 확인하고 있어요",
  RECOGNIZED_REVIEW: "제품 후보를 찾았어요. 확인이 필요한 항목이 있어요.",
  RECOGNIZED_NONE: "사진에서 제품명을 충분히 확인하지 못했어요.",
  RECOGNITION_FAILED: "제품을 확인하는 중 문제가 발생했어요.",
  RETRY: "다시 시도",
  PRODUCTS_TITLE: "보유 제품 인식 결과",
  PRODUCTS_PHOTO_LABEL: "촬영한 사진",
  PRODUCTS_UNNAMED: "제품명을 읽지 못했어요",
  PRODUCTS_UNKNOWN_TITLE: "제품명 확인 필요",
  PRODUCTS_VISIBLE_TEXT: "읽힌 글자",
  PRODUCT_ANALYZE: "분석 보기",

  // 제품 분석 결과 페이지 (성분·피부 궁합)
  ANALYSIS_TITLE: "제품 분석 결과",
  ANALYSIS_SUBTITLE: "업로드한 제품 사진을 바탕으로 성분과 피부 궁합을 분석했어요.",
  ANALYSIS_LOADING: "성분과 피부 궁합을 확인하고 있어요",
  ANALYSIS_TAG: "사진 인식 완료",
  ANALYSIS_FIT: "피부 궁합",
  ANALYSIS_POINT: "점",
  ANALYSIS_BASIS_SUFFIX: "기준",
  ANALYSIS_UNKNOWN_SCORE: "이 제품의 성분 정보를 확실히 알지 못해 점수를 매기지 않았어요.",
  ANALYSIS_INGREDIENTS: "핵심 성분",
  ANALYSIS_POSITIVES: "이런 점이 잘 맞아요",
  ANALYSIS_CAUTIONS: "주의 포인트",
  ANALYSIS_USAGE: "사용 요약",
  ANALYSIS_ADD_ROUTINE: "내 루틴에 추가하기",
  ANALYSIS_ADDED: "루틴에 추가됨",
  ANALYSIS_FAILED: "분석을 불러오지 못했어요.",
  ANALYSIS_MISSING: "분석할 제품 정보를 찾지 못했어요. 채팅으로 돌아가 제품을 다시 선택해 주세요.",
  ANALYSIS_BACK: "채팅으로 돌아가기",
  ANALYSIS_DISCLAIMER: "AI가 알려진 제품 정보를 바탕으로 추정한 결과예요. 실제 성분표와 다를 수 있어요.",
  PRODUCT_REVIEW_NOTE: "라벨을 다시 확인해 주세요.",
  PRODUCT_INSUFFICIENT_NOTE: "정보가 부족해요. 직접 입력해 주세요.",
  PRODUCT_STATUS: {
    recognized: "인식 완료",
    review: "확인 필요",
    insufficient: "제품 정보 부족",
  },
  PRODUCT_CONFIRM: "맞아요",
  PRODUCT_CONFIRMED: "확인됨",
  PRODUCT_EDIT: "수정",
  PRODUCT_SAVE: "저장",
  PRODUCT_DELETE: "삭제",
  PRODUCT_BRAND_PLACEHOLDER: "브랜드",
  PRODUCT_NAME_PLACEHOLDER: "제품명",
  IMAGE_ISSUE: {
    labels_too_small: "제품 라벨이 보이도록 조금 더 가까이 촬영해주세요.",
    blur: "사진이 조금 흔들렸어요. 다시 촬영해주세요.",
    too_dark: "조금 더 밝은 곳에서 촬영해주세요.",
    overexposed: "빛 반사가 심해요. 조명을 피해 촬영해주세요.",
    products_occluded: "제품이 서로 겹치지 않도록 놓고 촬영해주세요.",
    no_cosmetic_products: "사진에서 화장품을 찾지 못했어요.",
  },

  CONCERN_INTRO: [
    "현재 가장 느끼는 피부 고민이나,",
    "현재 가장 먼저 개선하고 싶은 고민 하나를 선택해 주세요",
  ],
  CONCERN_SELECTED: "{label}{particle} 선택해 주셨어요.",
  DRYNESS_CONCERN_SUMMARY: "건조·각질이 고민이에요",
  SEBUM_CONCERN_SUMMARY: "유분·모공이 고민이에요",
  SEBUM_AREA_QUESTION: ["유분이나 모공이", "어느 부위에서 신경 쓰이나요?"],
  SEBUM_AREA_OTHER_LABEL: "유분이나 모공이 신경 쓰이는 다른 부위",
  SEBUM_AREA_SELECTION: "유분·모공 | {areas}",
  ACNE_CONCERN_SUMMARY: "여드름·트러블이 고민이에요",
  ACNE_AREA_QUESTION: ["여드름이나 트러블이", "어느 부위에 생기나요?"],
  ACNE_AREA_OTHER_LABEL: "여드름이나 트러블이 생기는 다른 부위",
  ACNE_AREA_SELECTION: "여드름·트러블 | {areas}",
  REDNESS_CONCERN_SUMMARY: "붉어짐·민감함이 고민이에요",
  REDNESS_AREA_QUESTION: ["붉어짐이나 민감함이", "어느 부위에서 느껴지나요?"],
  REDNESS_AREA_OTHER_LABEL: "붉어짐이나 민감함이 느껴지는 다른 부위",
  REDNESS_AREA_SELECTION: "붉어짐·민감함 | {areas}",
  PIGMENTATION_CONCERN_SUMMARY: "잡티·피부 톤이 고민이에요",
  PIGMENTATION_AREA_QUESTION: ["잡티나 피부 톤이", "어느 부위에서 신경 쓰이나요?"],
  PIGMENTATION_AREA_OTHER_LABEL: "잡티나 피부 톤이 신경 쓰이는 다른 부위",
  PIGMENTATION_AREA_SELECTION: "잡티·피부 톤 | {areas}",
  WRINKLES_CONCERN_SUMMARY: "주름·탄력이 고민이에요",
  WRINKLES_AREA_QUESTION: ["주름이나 탄력 저하가", "어느 부위에서 신경 쓰이나요?"],
  WRINKLES_AREA_OTHER_LABEL: "주름이나 탄력 저하가 신경 쓰이는 다른 부위",
  WRINKLES_AREA_SELECTION: "주름·탄력 | {areas}",
  SCARS_CONCERN_SUMMARY: "패임·흉터가 고민이에요",
  SCARS_AREA_QUESTION: ["패임이나 흉터가", "어느 부위에서 신경 쓰이나요?"],
  SCARS_AREA_OTHER_LABEL: "패임이나 흉터가 신경 쓰이는 다른 부위",
  SCARS_AREA_SELECTION: "패임·흉터 | {areas}",
  CONCERN_AREA_QUESTION: ["건조함이나 각질이", "어느 부위에서 느껴지나요?"],
  CONCERN_AREA_HINT: "해당하는 부위를 모두 골라 주세요.",
  CONCERN_AREA_REFERENCE: "피부 참고 이미지",
  CONCERN_AREA_ALL: "얼굴 전체",
  CONCERN_AREA_ALL_REGIONS: "전체 부위",
  CONCERN_AREA_OTHER: "다른 부위 직접 입력",
  CONCERN_AREA_OTHER_LABEL: "건조함이나 각질이 느껴지는 다른 부위",
  CONCERN_AREA_OTHER_PLACEHOLDER: "예: 목, 귀 주변",
  CONCERN_AREA_SELECTION: "건조·각질 | {areas}",
  CONCERN_AREAS: {
    cheek: { label: "볼", description: "광대 아래부터 볼 전체" },
    eyes: { label: "눈가", description: "눈 주변 피부" },
    mouth: { label: "입가", description: "입술 주변 피부" },
    nose: { label: "코", description: "콧등과 코끝" },
    "nose-sides": { label: "코 주변", description: "콧방울과 코 옆" },
    forehead: { label: "이마", description: "이마 전체와 헤어라인 주변" },
    "between-brows": { label: "미간", description: "양 눈썹 사이" },
    chin: { label: "턱", description: "아랫입술 아래와 턱" },
  },
  SEBUM_CONCERN_AREAS: {
    forehead: { label: "이마", description: "이마 전체와 헤어라인 주변" },
    nose: { label: "코", description: "콧등과 코끝" },
    "nose-sides": { label: "코 주변", description: "콧방울과 코 옆" },
    cheek: { label: "볼", description: "코 옆부터 볼 전체" },
    "between-brows": { label: "미간", description: "양 눈썹 사이" },
    chin: { label: "턱", description: "아랫입술 아래와 턱" },
  },
  ACNE_CONCERN_AREAS: {
    "forehead-hairline": { label: "이마·헤어라인", description: "이마 전체와 머리카락 경계" },
    cheek: { label: "볼", description: "양쪽 볼과 광대 주변" },
    "nose-sides": { label: "코 주변", description: "콧방울과 코 옆" },
    "chin-jawline": { label: "턱·턱선", description: "턱과 턱선을 따라" },
    chest: { label: "가슴", description: "가슴과 쇄골 아래" },
    "upper-back": { label: "등 위쪽", description: "어깨와 등 위쪽" },
  },
  PIGMENTATION_CONCERN_AREAS: {
    cheek: { label: "볼", description: "양쪽 볼과 광대 주변" },
    forehead: { label: "이마", description: "이마 전체와 헤어라인 주변" },
    nose: { label: "코", description: "콧등과 코끝" },
    mouth: { label: "입가", description: "입술 주변 피부" },
    "under-eye": { label: "눈밑", description: "눈 아래와 눈가 주변" },
    hand: { label: "손등", description: "손등 전체" },
  },
  WRINKLES_CONCERN_AREAS: {
    eyes: { label: "눈가", description: "눈가와 눈꼬리 주변" },
    "forehead-glabella": { label: "이마·미간", description: "이마 주름과 양 눈썹 사이" },
    nasolabial: { label: "팔자 주변", description: "콧방울 옆에서 입가로 이어지는 부위" },
    mouth: { label: "입가", description: "입 주변과 입술 아래" },
    jawline: { label: "턱선", description: "턱선과 페이스라인" },
    neck: { label: "목", description: "목 앞쪽과 목주름" },
  },
  SCARS_CONCERN_AREAS: {
    forehead: { label: "이마", description: "이마의 패임과 흉터" },
    cheek: { label: "볼", description: "볼과 광대 주변의 패임" },
    chin: { label: "턱", description: "턱과 턱선 주변의 흉터" },
    "upper-back": { label: "몸의 흉터·패임", description: "몸에 남은 흉터와 패임" },
  },
  SAVE_FAILED: "선택을 저장하지 못했어요. 네트워크 연결을 확인해 주세요.",
  REPLY_FAILED: "답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
  REPLY_NETWORK: "연결이 불안정해요. 네트워크를 확인하고 다시 보내주세요.",
  REPLY_TIMEOUT: "응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.",
  REPLY_EMPTY: "답변을 만들지 못했어요. 다시 한 번 말씀해 주세요.",
  AI_THINKING: "AURAI가 생각하는 중",

  START_SKIN_SCAN: "START SKIN SCAN",

  // 온보딩. 배경 사진 위에 올리는 모든 글자는 여기서만 온다.
  ONBOARDING_BG_ALT: "AURAI — 피부를 읽고 맞는 케어를 설계하는 AI",
  ONBOARDING_LOGO: "AURAI",
  ONBOARDING_LOGO_TAGLINE: "AI WELLNESS",
  // 마지막 줄의 "AI." 는 참고 시안처럼 굵게 강조한다.
  ONBOARDING_HEADLINE: ["당신의 피부를 읽고,", "당신에게 맞는 케어를", "설계하는 "],
  ONBOARDING_HEADLINE_EMPHASIS: "AI.",
  ONBOARDING_FEATURES: [
    { title: "AI Skin Analysis", desc: "정확한 피부 진단" },
    { title: "Personalized Care", desc: "맞춤 케어 설계" },
    { title: "Visible Results", desc: "눈에 보이는 개선" },
  ],
  ONBOARDING_NEXT: "다음 내용 보기",

  AUTH_EMAIL_PLACEHOLDER: "이메일을 입력하세요",
  AUTH_PASSWORD_PLACEHOLDER: "비밀번호를 입력하세요",
  AUTH_LOGIN: "로그인",
  AUTH_SIGNUP: "회원가입",
  AUTH_HAVE_ACCOUNT: "이미 계정이 있어요",
  AUTH_FORGOT: "비밀번호 찾기",
  AUTH_SHOW_PASSWORD: "비밀번호 표시",
  AUTH_HIDE_PASSWORD: "비밀번호 숨김",
  AUTH_BAD_CREDENTIALS: "이메일 또는 비밀번호가 맞지 않아요.",
  AUTH_UNCONFIRMED: "가입 확인 메일의 링크를 먼저 눌러주세요.",
  AUTH_ALREADY_REGISTERED: "이미 가입된 이메일이에요. 로그인해 주세요.",
  AUTH_WEAK_PASSWORD: "비밀번호는 6자 이상이어야 해요.",
  AUTH_FAILED: "잠시 후 다시 시도해 주세요.",
  AUTH_CHECK_EMAIL: "확인 메일을 보냈어요.\n메일의 링크를 누른 뒤 로그인해 주세요.",
  AUTH_NEED_EMAIL: "먼저 이메일을 입력해 주세요.",
  AUTH_RESET_SENT: "비밀번호 재설정 메일을 보냈어요.",
  AUTH_SOCIAL_NOT_READY: "간편 로그인은 준비 중이에요. 이메일로 로그인해 주세요.",

  PROFILE_NAME: "이름",
  PROFILE_NAME_PLACEHOLDER: "이름·닉네임 (성 제외)",
  PROFILE_FAMILY_NAME: "성 (선택)",
  PROFILE_GENDER: "성별",
  PROFILE_FEMALE: "여성",
  PROFILE_MALE: "남성",
  PROFILE_BIRTH_DATE: "생년월일",
  PROFILE_BIRTH_DATE_PLACEHOLDER: "생년월일을 선택해주세요",
  PROFILE_BIRTH_TIME: "태어난 시간 (선택)",
  PROFILE_BIRTH_TIME_PLACEHOLDER: "모르면 건너뛰어도 괜찮아요",
  PROFILE_AGE_BAND: "연령대",
  PROFILE_NEXT: "다음",
  PROFILE_NEED_NAME: "이름을 입력해 주세요.",
  PROFILE_SAVE_FAILED: "저장하지 못했어요. 잠시 후 다시 시도해 주세요.",

  MENU_LABEL: "메뉴 열기",
  MIC_LABEL: "음성으로 입력",
  ATTACH_LABEL: "첨부하기",
  SEND_LABEL: "보내기",
} as const;

export function userName(name?: string | null) {
  return name?.trim() ? `${name.trim()}님` : "회원님";
}

export function skinPhotoRequest(name?: string | null) {
  return [
    `${name?.trim() ? `${name.trim()}님, ` : ""}${ko.SKIN_PHOTO_REQUEST}`,
  ];
}

export function fill(
  lines: readonly string[],
  vars: { user?: string | null; label?: string; concern?: string },
) {
  return lines.map((line) =>
    line
      .replaceAll("{user}", userName(vars.user))
      .replaceAll("{label}", vars.label ?? "")
      .replaceAll("{concern}", vars.concern ?? ""),
  );
}

// 받침이 있으면 "을", 없으면 "를".
function objectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1);

  if (code < 0xac00 || code > 0xd7a3) {
    return "를";
  }

  return (code - 0xac00) % 28 === 0 ? "를" : "을";
}

function selectedNotice(label: string) {
  return ko.CONCERN_SELECTED.replace("{label}", label).replace(
    "{particle}",
    objectParticle(label),
  );
}

export function concernSelected(label: string) {
  return selectedNotice(label);
}

export function quickPromptSelected(label: string) {
  return selectedNotice(label.replace(/\s+/g, ""));
}

export function skinTypeAck(name?: string | null) {
  return name
    ? ko.SKIN_TYPE_ACK.replace("{name}", name.trim())
    : ko.SKIN_TYPE_ACK_FALLBACK;
}

export function skinTypeSelected(label: string) {
  return ko.SKIN_TYPE_SELECTED.replace("{label}", label);
}

export function welcomeLines() {
  return [
    ko.WELCOME_GREETING,
    ko.WELCOME_INTRO,
    ko.WELCOME_PROMISE,
  ];
}
