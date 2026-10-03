// 브라우저용 UUID v4.
// crypto.randomUUID는 보안 컨텍스트(https·localhost)에서만 존재한다. 같은 Wi-Fi의 폰이
// http://192.168.x.x로 열면 없어서 첫 탭에 바로 죽는다. getRandomValues는 어디서나 있다.
export function newId(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
