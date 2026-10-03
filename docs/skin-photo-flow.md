# 설문 완료 → 피부 사진 촬영

첫 인사의 세 문장이 끝나면 **피부 타입** 퀵프롬프트 버튼 하나가 나타납니다. 누르면 기존 사용자 선택 말풍선 → 좋아요 안내 → 피부타입 선택 안내 → 세 문장의 피부 타입 안내 → 피부 타입 카드 순서로 표시됩니다. 타입 선택 후 피부 고민 카드가 이어집니다. 피부 타입과 고민의 세부 부위를 선택하고 **설문 완료 · 촬영으로 이어가기**를 누르면 같은 채팅에 안내 카드, AI 말풍선, 카메라가 차례대로 나타납니다. 안내 카드와 말풍선 사이 400ms, 카메라까지 1초이며 기존 등장 효과와 모션 감소 설정을 사용합니다. 확인 전에는 카메라 권한을 요청하지 않습니다.

가입 시 저장하는 `givenName`을 `useUserProfile`로 조회하고 `fill`/`userName` 호칭 함수를 재사용합니다. 조회 중에는 안내를 만들지 않으며, 이름이 없으면 요청에 지정된 이름 없는 문구를 사용합니다. 기존 `Orb`, 배경, 폰트, 감광 패널 토큰을 재사용합니다.

## 파일 역할

- `app/chat/ChatScreen.tsx`: 두 설문 및 최종 확인 조건, 동기 중복 클릭 잠금, 단일 첨부 블록, 사진 확정 결과 보관.
- `app/chat/page.tsx`: 채팅의 `useSearchParams`에 필요한 Suspense 경계. 프로덕션 사전 렌더링 오류 해결.
- `app/components/chat/ConcernAreaSelector.tsx`: 최종 확인 버튼. 피부 타입/부위 미선택 시 비활성화, 확인 후 선택 잠금.
- `app/components/chat/SkinPhotoFlow.tsx`: 안내 카드 → 별도 AI 말풍선 → 카메라 순차 표시.
- `app/components/chat/SkinPhotoGuide.tsx`: 호칭 및 이름 없는 안내와 기존 유리구슬.
- `app/components/chat/SkinPhotoActions.tsx`: 카메라 자동 표시, 확정 이후에만 업로드, 실패 시 동일 사진 재시도.
- `app/components/chat/CameraCard.tsx`: 영상, 앨범, 셔터, 전환, 오류 재시도, 사진 미리보기 및 확정 UI. 피부용 기본 전면, 기존 제품용 기본 후면.
- `app/components/chat/useCamera.ts`: 요청 세대와 중복 연결 잠금, 전환 전 스트림 종료, 전환 실패 복구, 화면 숨김/이탈/언마운트 정리.
- `app/components/chat/chatMessages.tsx`: 설문 스냅샷을 가진 피부 사진 첨부 타입.
- `app/components/chat/ChatBubble.tsx`: 좁은 화면에서 한국어 본문과 긴 어절의 넘침 방지.
- `app/components/chat/chatInput.tsx`: 기존 고정 입력창을 320px에서도 화면 안에 배치.
- `app/lib/camera/capture.ts`: 필터 없는 캔버스 프레임/앨범 변환, JPEG File 생성. 기존 긴 변 1568px/품질 0.85 유지.
- `app/lib/skinPhoto.ts`: `SkinPhotoContext`, `SkinPhotoSubmission` 계약.
- `app/lib/storage.ts`: 기존 비공개 사진 업로드에 설문 메타데이터 전달.
- `app/lib/locale/ko.ts`, `app/globals.css`: 문구와 기존 토큰을 사용하는 카드 스타일.
- `scripts/check-skin-photo.cjs`: 브라우저 회귀 검사.

## 업로드 및 분석 연결

`SkinPhotoSubmission`은 사진, 피부 타입, 고민, 부위 ID/표시명, 직접 입력 부위와 업로드 경로를 묶습니다. 사진 확정 직후 `onConfirmed`로 전달하고, 업로드 성공 후 `storagePath`를 포함해 다시 전달합니다. 채팅의 `skinPhotoSubmission` ref가 보관합니다. 같은 설문 스냅샷을 `skin-photos` 객체의 메타데이터에도 저장합니다. 상태는 현재 채팅 세션에서 유지됩니다.

**피부 분석 API는 아직 없습니다.** 분석을 연결할 때 이 계약/콜백에서 사진 또는 비공개 저장 경로와 설문 정보를 전달하면 됩니다. 기존 화장품 인식 API에는 피부 사진을 보내지 않습니다.

업로드는 기존 로그인과 비공개 `skin-photos` 버킷/RLS 정책을 사용합니다. 데이터베이스/버킷/정책 변경은 하지 않았습니다. 자동 검사는 인증과 Storage 응답을 모의 처리하므로 실제 계정의 업로드 성공을 검증한 것은 아닙니다.

## 검증

2026-10-03 기준:

- 변경 파일 ESLint 및 TypeScript 검사 통과.
- `npm run build -- --webpack` 통과. 기본 Turbopack 빌드는 이 실행 환경의 하위 프로세스 포트 생성 제한(`Operation not permitted`)으로 실패.
- `https://localhost:3443/chat`에서 Chromium 테스트 영상으로 실제 MediaStream 재생과 JPEG 프레임 캡처 확인.
- 일곱 가지 피부 고민 설문 모두 최종 확인 후 하나의 카메라로 이어지는 흐름 통과.
- 393px/320px 모바일 뷰포트 확인. 실제 사용자 호칭 경로, 조회 중 이름 미노출, 이름 없는 대체 문구, 최종 확인 전 카메라 미노출, 표시 순서, 확인/사진 확정 연타 중복 방지 확인.
- 앨범 입력 `accept="image/*"`, `capture` 속성 없음, 미리보기 전 업로드 없음, 확정 후 업로드 요청 및 설문 메타데이터 확인.
- 권한 거부/재시도/앨범 사용, 업로드 실패 재시도 확인.
- 단일 카메라 전환 비활성, 전면↔후면 전환과 이전 스트림 종료, 전환 실패 시 이전 카메라 복구 확인. 장치 전환은 모의 장치 ID와 실제 테스트 MediaStream을 사용.
- 페이지 이탈/복귀 이벤트 및 카드 제거, 늦게 도착하는 카메라 요청의 스트림 종료 확인.

실행 중인 HTTPS 개발 서버 및 Playwright 설치가 필요합니다:

```sh
node scripts/check-skin-photo.cjs
```

별도 설치된 Playwright를 사용할 때 `AURAI_PLAYWRIGHT_MODULE`에 해당 모듈 경로를 지정합니다. `AURAI_TEST_URL`로 HTTPS 테스트 주소, `AURAI_TEST_ARTIFACTS`로 캡처/결과 JSON 저장 폴더를 지정할 수 있습니다. 기본 주소는 `https://localhost:3443`, 결과 폴더는 운영체제 임시 폴더입니다. 인증과 업로드는 모의 처리하며 실제 사용자 사진을 저장하지 않습니다.

**HTTPS 배포 주소에서 실제 휴대폰 테스트는 미실시입니다.** 배포 주소와 실제 휴대폰이 제공되지 않았습니다. HTTPS 로컬 모바일 뷰포트 검증은 실제 iOS Safari/Android Chrome의 권한 창과 전후면 하드웨어 검증을 대체하지 않습니다.
