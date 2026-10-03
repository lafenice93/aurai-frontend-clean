// [Backend 공통] OpenAI 클라이언트. 키는 서버 환경변수(OPENAI_API_KEY)에서만 읽는다.
import OpenAI from "openai";

export const CHAT_MODEL = "gpt-5.1";

let client: OpenAI | null = null;

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAI() {
  if (!client) {
    client = new OpenAI();
  }
  return client;
}
