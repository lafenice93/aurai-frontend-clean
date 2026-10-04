import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버에 같은 Wi-Fi의 폰(192.168.x.x)이 접속해도 HMR·핫리로드가 막히지 않게 한다.
  // 기본값은 localhost만 허용이라, 폰에서는 페이지는 열려도 편집 내용이 실시간 반영되지 않는다.
  allowedDevOrigins: ["192.168.*.*", ...(process.env.AURAI_MOBILE_HTTPS === "true" ? ["*.trycloudflare.com"] : [])],
  logging: {
    // 폰 브라우저의 console(log/info 포함)을 개발 터미널로 넘긴다.
    // 폰에서 재현하면 [product-analysis] 단계 로그를 /tmp/dev3001.log 에서 그대로 볼 수 있다. 개발 모드에서만 동작.
    browserToTerminal: true,
  },
};

export default nextConfig;
