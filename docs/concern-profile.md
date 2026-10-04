# 피부 고민 상세 안내

전용 구현: `app/components/chat/ConcernProfile/`. 기존 채팅 배경·말풍선 CSS는 변경하지 않는다.

`content.ts`는 설문 context의 피부 타입, 상위 고민, 마지막 선택 부위를 연결한다. 실제 선택값 요약은 그대로 두고 설명용 제목만 조합한다. 예시 사진은 기존 `concernAreas.ts`의 부위별 자산이며 사용자 사진이나 분석 결과가 아니다. 직접 입력한 부위는 상위 고민의 예시 사진임을 alt에 명시한다.

## 성분 콘텐츠 연결 대기

2026-10-04 코드 조사에서 검토 완료된 고민별 성분 카탈로그를 찾지 못했다. 제품 인식 후 모델이 추정하는 `product-fit` 출력은 이 안내의 검토 자료로 사용하지 않는다. 목업의 성분을 모든 고민에 복제하지 않는다. 따라서 성분 블록은 피부 타입과 고민 제목, 안내 준비 문구를 표시하며 목록은 비워 둔다.

다음 7개 고민의 각 부위와 6개 피부 타입에 적용 가능한 승인 목록이 필요하다. 우선 검토 대상은 **건성 / 잡티·피부 톤 / 볼의 기미·잡티**, **지성 / 유분·모공 / 코 모공**이다.

| 상위 고민 | 필요한 범위 |
| --- | --- |
| 건조·각질 | 볼, 눈가, 입 주변, 코 주변, 이마, 턱 |
| 유분·모공 | 이마, 미간, 볼, 코, 코 주변, 턱 |
| 여드름·트러블 | 이마·헤어라인, 볼, 코 주변, 턱·턱선, 가슴, 등 |
| 붉어짐·민감함 | 볼, 코 주변, 입 주변, 눈가, 이마, 턱 |
| 잡티·피부 톤 | 볼, 이마, 코, 입 주변, 눈밑, 손 |
| 주름·탄력 | 눈가, 이마·미간, 팔자, 입 주변, 턱선, 목 |
| 패임·흉터 | 이마, 볼, 턱, 등 |

각 성분에는 고유 id, 한글·영문명, 검토한 역할에 맞는 icon id, 적용 가능한 concern/areaIds/skinTypes, 근거 URL과 검토일을 기록한다. `reviewedIngredients`에 등록하면 조건에 맞는 항목만 출력한다. 동일 성분 id는 같은 일러스트를 사용한다. `GlassRing.tsx`의 심볼은 역할 표현이며 분자 구조가 아니다. 직접 입력 부위는 검토된 부위 매핑이 없으므로 자동 성분 추천에서 제외한다.

## 촬영·확정

`SkinPhotoFlow`는 안내 카드만 먼저 출력한다. 사진 업로드는 사용자 클릭에 동기적으로 파일 선택기를 열고, 미리보기까지 카메라를 요청하지 않는다. 카메라 촬영 버튼을 누를 때만 `CameraCard`를 마운트해 권한을 요청한다. 기존 실제 업로드·분석 연결은 확정 시 한 번만 유지한다. 테스트는 가상 카메라와 모의 분석 응답을 사용하므로 유료 분석이나 실제 사용자 사진 전송은 발생하지 않는다.

## 유리구슬 자산

내장 imagegen 사용. 현재 적용 파일: `public/images/concern-guide-orb-warm-v2.png`. 이전 `concern-guide-orb-warm.png`는 보존한다.

최초 생성 프롬프트:
> Use case: stylized-concept. Asset type: transparent PNG decorative orb for AURAI skincare guide card. Create one exquisite CGI clear glass sphere, delicate bronze and champagne reflections, soft ivory highlights upper left and near bottom, realistic transparent refracting glass, gentle peach caustic and soft oval contact glow directly underneath. Harmonize with bronze UI background #A27251 through #6A432B. Center sphere with generous transparent margins, three-quarter studio product lighting, no pedestal, no opaque ground, no rectangle backdrop. Keep sphere luminous but understated, color not yellow gold, no text, no icons, no watermark. True transparent background including around soft contact glow, square composition. Intended displayed size 140px.

최종 색상 조정 프롬프트:
> Edit target: the existing CGI glass sphere. Keep single round sphere, generous transparent margins, soft oval light directly below, transparent background. Change only material and lighting: warm transparent caramel-bronze glass, the center transmits warm brown/peach tones matching #A27251 and #6A432B with gentle amber internal refraction; clear glass not a metallic mirror. Eliminate silver/grey cloudy center and metallic chrome rims. Subtle soft ivory highlight upper center and a luminous peach-white glow near base. Low contrast delicate champagne edges, realistic soft bronze studio reflections. This should look like a translucent warm bronze glass marble resting in a champagne skincare UI, elegant smooth CGI. No text, no frame, no opaque background, no pedestal.

### 참고 구슬의 조명과 그림자를 적용한 v2

`skin-guide-orb.png`를 형태·조명·그림자 참고로, 기존 `concern-guide-orb-warm.png`를 색상 참고로 사용했다. 카드 배치·크기·텍스트는 변경하지 않고 이미지 경로만 교체했다. 내장 imagegen 편집의 최종 프롬프트:

> Use case: style-transfer. Create a refined transparent CGI orb asset for the AURAI recommendation card. Image 1 (skin-guide-orb.png) is the LIGHTING, SHAPE, SHADOW and overall glass STYLE reference. Image 2 (concern-guide-orb-warm.png) is ONLY the required COLOR reference/current asset. Regenerate a single sphere with image 1's smooth round glass, soft almost-white circular highlight at the upper center, bright luminous lower-center reflection, delicate glass refraction and bright thin rim, and especially its broad flat dark bronze oval contact shadow, rim-lit peach caustic spreading sideways with small gentle rays. Preserve image 2's warm caramel BRONZE hue and nuanced peach/champagne color, do not shift toward saturated yellow/gold or metallic silver. Eliminate image 2's obvious rectangular studio reflections and chrome-like thickness. The orb should feel like the first reference but tinted with the second reference color. True transparent background including around the glow, no opaque floor rectangle or black backdrop. Square composition, sphere about 62 percent of image width, centrally placed, entire oval shadow and gentle lateral glow visible within margins; no clipping. No text, logo, pedestal, additional objects, or interface. High-quality soft realistic CGI lighting.

## 변경 파일 및 확인 결과

- `app/components/chat/ConcernProfile/{ConcernProfile.tsx,ConcernProfile.module.css,GlassRing.tsx,content.ts}`: 다섯 블록, 전용 유리 재질, 링·일러스트, 실제 선택값 매핑.
- `app/components/chat/SkinPhotoFlow.tsx`, `SkinPhotoActions.tsx`: 업로드와 촬영 진입 분리, 미리보기 및 확정 연결.
- `app/components/chat/CameraCard.tsx`: 외부 파일 미리보기, 앨범 재선택, 촬영 안내 위치, 좁은 화면의 오류 영역.
- `app/components/chat/SkinProfileCard.tsx`: 기존 정보 수정 컴포넌트를 촬영 전에도 재사용하도록 export.
- `scripts/check-skin-photo.cjs`: 새 선택 흐름과 두 예시의 모바일 캡처 검증.

HTTPS 터널에서 Chromium 393px/320px, 가상 카메라, 모의 로그인·업로드·분석 응답으로 검증했다. 두 지정 예시의 제목·부위별 사진·특징·아이콘·추천·요청 문구, 촬영 전 정보 수정, 마지막 선택 부위 반영, 카드 중복 방지, 카메라 권한 요청 시점, 업로드만 선택 시 카메라 미호출, 미리보기, 재선택, 전후면 전환, 단일 카메라 비활성화, 권한 거부·재시도, 화면 이탈 스트림 정리, 확정 시 업로드/분석 요청 각 1회, 수정 시 확정 사진 유지가 통과했다. 실제 휴대폰 센서와 실 API 분석은 이번 검증에 사용하지 않았다.

전체 ESLint: 오류 0, 기존 `.agent/skills` 경고 376. 변경 파일 ESLint, TypeScript, `git diff --check`: 통과.

캡처: 실행 시 `AURAI_TEST_ARTIFACTS` 또는 OS 임시 폴더에 `aurai-cheek-pigmentation-393.png`, `aurai-nose-pores-393.png` 및 393×1000 viewport 이미지를 저장한다. 전체 카드 캡처는 너비 393px를 유지하고 높이만 늘려 다섯 블록을 담았다. 목업과 비교해 좌측 예시 사진, 3열 링, 분리된 다섯 유리 블록, 우측 브론즈 구슬, 같은 너비의 사진 버튼을 확인했다.
