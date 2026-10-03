import type { Metadata, Viewport } from "next";
import ReactDOM from "react-dom";
import "./globals.css";

export const metadata: Metadata = {
  title: "AURAI",
  description: "초개인화된 AI 뷰티 & 웰니스 파트너",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // 폰트는 CSS를 파싱한 뒤에야 발견되므로 그대로 두면 본문이 시스템 폰트로 먼저 그려졌다가
  // 바뀐다. 문서 head에 preload를 직접 넣어 CSS와 병렬로 내려받게 해 교체 구간을 줄인다.
  ReactDOM.preload("/fonts/PretendardVariable.subset.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    // 카카오톡 등 인앱 브라우저가 React 로드 전에 html/body에 속성을 끼워 넣어
    // 하이드레이션 경고를 내므로, 이 두 요소의 속성 차이만 무시한다(자식에는 영향 없음).
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
