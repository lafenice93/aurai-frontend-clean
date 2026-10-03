"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import Stage, { glass, glassGlow, Hit } from "@/app/components/onboarding/Stage";
import { ko } from "@/app/lib/locale/ko";
import { supabaseBrowser } from "@/app/lib/supabase";

type Mode = "login" | "signup";

// 소셜 로그인은 대시보드에 제공자가 설정되기 전까지 안내만 한다.
const SOCIAL = [
  { id: "apple", label: "Apple", left: 8.9 },
  { id: "kakao", label: "카카오", left: 29.9 },
  { id: "google", label: "Google", left: 51 },
  { id: "naver", label: "네이버", left: 72 },
] as const;

function describeAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return ko.AUTH_BAD_CREDENTIALS;
  if (/email not confirmed/i.test(message)) return ko.AUTH_UNCONFIRMED;
  if (/already registered/i.test(message)) return ko.AUTH_ALREADY_REGISTERED;
  if (/password should be at least/i.test(message)) return ko.AUTH_WEAK_PASSWORD;
  return ko.AUTH_FAILED;
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 이미 로그인돼 있으면 프로필로.
  useEffect(() => {
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) router.replace("/profile");
      });
  }, [router]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setBusy(true);

    try {
      const auth = supabaseBrowser().auth;

      if (mode === "signup") {
        const { data, error } = await auth.signUp({ email, password });
        if (error) {
          setNotice(describeAuthError(error.message));
          return;
        }
        // 이메일 확인이 켜져 있으면 세션 없이 돌아온다.
        if (data.session) {
          router.push("/profile");
        } else {
          setNotice(ko.AUTH_CHECK_EMAIL);
          setMode("login");
        }
        return;
      }

      const { error } = await auth.signInWithPassword({ email, password });
      if (error) {
        setNotice(describeAuthError(error.message));
        return;
      }
      router.push("/profile");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setNotice(ko.AUTH_NEED_EMAIL);
      return;
    }
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email);
    setNotice(error ? ko.AUTH_FAILED : ko.AUTH_RESET_SENT);
  }

  const fieldClass =
    "h-full w-full rounded-full px-5 text-[14px] outline-none placeholder:text-[#F5F1E1]/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6]";

  return (
    <Stage>
      <Image
        src="/onboarding/04-signup.jpeg"
        alt=""
        fill
        priority
        sizes="430px"
        quality={85}
        className="object-cover"
      />

      <form onSubmit={handleSubmit} className="absolute inset-0">
        <Hit top={41.3} left={8.4} width={83.2} height={5.2}>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={ko.AUTH_EMAIL_PLACEHOLDER}
            aria-label={ko.AUTH_EMAIL_PLACEHOLDER}
            style={glass}
            className={fieldClass}
          />
        </Hit>

        <Hit top={48.3} left={8.4} width={83.2} height={5.2}>
          <input
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={ko.AUTH_PASSWORD_PLACEHOLDER}
            aria-label={ko.AUTH_PASSWORD_PLACEHOLDER}
            style={glass}
            className={`${fieldClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? ko.AUTH_HIDE_PASSWORD : ko.AUTH_SHOW_PASSWORD}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[12px] text-[#F5F1E1]/75"
          >
            {showPassword ? "숨김" : "표시"}
          </button>
        </Hit>

        <Hit top={54.6} left={60} width={31} height={2.8}>
          <button
            type="button"
            onClick={() => void handleReset()}
            className="flex h-full w-full cursor-pointer items-center justify-end text-[12px] text-[#F5F1E1]/85"
            style={{ background: "rgb(120 80 52 / 0.7)", borderRadius: 8 }}
          >
            {ko.AUTH_FORGOT} ›
          </button>
        </Hit>

        <Hit top={59} left={9} width={82} height={6.3}>
          <button
            type="submit"
            disabled={busy}
            style={glassGlow}
            className="h-full w-full cursor-pointer rounded-full text-[16px] tracking-[0.2em] transition-transform duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === "signup" ? ko.AUTH_SIGNUP : ko.AUTH_LOGIN}
          </button>
        </Hit>

        <Hit top={67.4} left={25} width={50} height={3}>
          <button
            type="button"
            onClick={() => {
              setMode((value) => (value === "login" ? "signup" : "login"));
              setNotice(null);
            }}
            className="flex h-full w-full cursor-pointer items-center justify-center text-[14px] text-[#F5F1E1]"
            style={{ background: "rgb(120 80 52 / 0.7)", borderRadius: 8 }}
          >
            {mode === "signup" ? ko.AUTH_HAVE_ACCOUNT : ko.AUTH_SIGNUP} ›
          </button>
        </Hit>

        {SOCIAL.map((provider) => (
          <Hit key={provider.id} top={78.3} left={provider.left} width={18.1} height={10.4}>
            <button
              type="button"
              onClick={() => setNotice(ko.AUTH_SOCIAL_NOT_READY)}
              aria-label={`${provider.label} 로그인 (준비 중)`}
              className="h-full w-full cursor-pointer rounded-[22px] opacity-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-[#F7EEE6]"
            />
          </Hit>
        ))}
      </form>

      {notice ? (
        <p
          role="status"
          className="absolute right-[9%] left-[9%] top-[71.5%] rounded-[12px] px-4 py-2 text-center text-[12px] leading-relaxed whitespace-pre-line"
          style={glass}
        >
          {notice}
        </p>
      ) : null}
    </Stage>
  );
}
