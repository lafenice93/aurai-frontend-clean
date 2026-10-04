# 모바일 카메라 테스트

데스크톱과 휴대폰은 같은 `CameraCard` / `useCamera`를 사용합니다. 실시간 영상은 필터 없이 카드 안에서 재생합니다. 피부용 기본 전면 카메라, 앨범 선택, 셔터, 전후면 전환, 사진 확정 후 업로드/분석 흐름을 공유합니다.

HTTP의 LAN 주소에서는 브라우저가 카메라 API를 차단합니다. 이 제한은 자바스크립트로 해제할 수 없습니다. 유효하고 신뢰하는 HTTPS 연결이 필요합니다.

## 같은 Wi-Fi에서 테스트

1. `npm run dev`와 `npm run dev:https`를 실행합니다. HTTPS 스크립트가 표시한 Network 주소를 사용합니다. HTTP 주소의 개발용 카메라 안내에는 `HTTPS로 다시 열기` 버튼이 있습니다.
2. 휴대폰에 개발용 **공개** CA 인증서를 설치하고 신뢰하도록 설정합니다. 다운로드 경로는 개발 서버의 `/api/dev/camera-certificate`입니다. `dev-root-ca.cer`만 제공하며 개인 키를 제공하지 않습니다. 이 경로는 프로덕션에서 404입니다.
3. iPhone: Safari에서 인증서를 내려받고 설정 → 일반 → VPN 및 기기 관리에서 설치합니다. 설정 → 일반 → 정보 → 인증서 신뢰 설정에서 해당 mkcert 개발 인증서의 전체 신뢰를 켭니다.
4. Android: 인증서를 내려받고 설정의 인증서 설치 → CA 인증서에서 설치합니다. 제조사별 메뉴명이 다를 수 있습니다.
5. HTTPS Network 주소를 Safari 또는 Chrome에서 직접 엽니다. 다른 출처이므로 로그인은 다시 필요할 수 있습니다. 인증서 경고가 남아 있으면 신뢰 설정과 현재 IP가 인증서 SAN에 있는지 확인합니다.

테스트가 끝나면 휴대폰에 설치한 개발용 CA를 제거할 수 있습니다. 테스트 기기에서만 사용합니다.

## 인증서 설치 없는 임시 HTTPS 주소

Cloudflare 외부 터널의 실행 승인이 있는 경우에만 사용합니다. 앱 요청은 Cloudflare를 통과하므로 로컬 Wi-Fi 연결과 다른 외부 연결입니다.

`cloudflared` 공식 실행 파일을 준비한 뒤:

```sh
AURAI_MOBILE_HTTPS=true npm run dev
# 다른 터미널
CLOUDFLARED_BIN=/실제/설치경로/cloudflared npm run dev:mobile
```

터미널에 임시 HTTPS 주소와 테스트용 이름/암호가 표시됩니다. 접속 암호와 세션 쿠키를 통과한 요청만 개발 서버로 전달합니다. 앱의 Bearer 인증은 유지하며 터널용 Basic 인증은 앱 서버로 전달하지 않습니다. 도구가 종료되면 주소도 종료됩니다. 테스트 주소 정보는 Git 제외 대상인 `.data/mobile-dev.json`에 기록됩니다. 2026-10-04 사용자가 Cloudflare 경유를 명시적으로 승인한 뒤 실행했습니다.

터널 실행 전 로컬 게이트가 무인증·잘못된 암호·무인증 API 요청을 401로 차단하고, 올바른 암호·세션으로만 앱을 여는지 자동 검증합니다. 검증에 실패하면 외부 연결을 열지 않습니다. 외부 HTTPS 주소에서도 화면·정적 이미지·API의 암호 차단을 확인했습니다. 응답은 `private, no-store`, 세션 쿠키는 `HttpOnly; Secure; SameSite=Lax`로 제공합니다.

임시 주소의 카메라 자동 테스트는 다음처럼 실행합니다. 이 모드에서는 인증서 오류를 무시하지 않으며, 테스트용 암호는 해당 터널 출처에만 사용합니다. 로그인·사진 업로드·분석 API와 카메라 영상은 모의 처리합니다.

```sh
AURAI_MOBILE_TUNNEL_TEST=true node scripts/check-skin-photo.cjs
```

## 휴대폰에서 확인할 순서

1. 피부 타입 → 피부 고민 → 세부 부위 선택 후 프로필 요약과 카메라 카드가 나타나는지 확인합니다.
2. 카메라 권한을 허용하고 전면 영상이 전체 화면으로 튀지 않고 카드 안에서 재생되는지 확인합니다.
3. 전후면 전환, 촬영, 미리보기, 다시 선택하기를 확인합니다.
4. 앨범에서 사진을 선택하고 사진 확정을 확인합니다. 확정 시 기존 업로드/분석 요청이 실제 실행됩니다.
5. 정보 수정 후 사진이 유지되는지 확인합니다. 화면 이탈/카드 닫기 후 카메라 사용 표시가 꺼지는지 확인합니다.
6. 권한을 거부해도 앨범 선택이 가능한지 확인합니다.

자동 검증은 Chromium의 모의 영상과 API 응답을 사용합니다. 실제 iPhone/Android의 카메라 하드웨어·권한 창은 별도로 확인해야 합니다.

참고: [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [Apple 인증서 신뢰](https://support.apple.com/102390), [Android 인증서 설치](https://support.google.com/pixelphone/answer/2844832), [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).
