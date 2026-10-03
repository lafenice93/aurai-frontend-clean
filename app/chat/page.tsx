import ChatScreen from "./ChatScreen";
import { Suspense } from "react";

export default function ChatPage() {
  return (
    <Suspense fallback={<main className="mx-auto h-dvh w-full max-w-[430px]" style={{ background: "var(--bg)" }} />}>
      <ChatScreen />
    </Suspense>
  );
}
