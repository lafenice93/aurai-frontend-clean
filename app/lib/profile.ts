/** 호칭은 명시적으로 저장한 개인 이름만 사용한다. 성이나 기존 전체 이름을 추정하지 않는다. */
export function profileGivenName(metadata?: Record<string, unknown> | null): string | null {
  return typeof metadata?.givenName === "string" && metadata.givenName.trim()
    ? metadata.givenName.trim().slice(0, 50)
    : null;
}

/** Reuse the saved name; append the honorific once without inventing a fallback. */
export function profileAddress(name?: string | null): string | undefined {
  const value = name?.trim();
  return value ? (value.endsWith("님") ? value : `${value}님`) : undefined;
}
