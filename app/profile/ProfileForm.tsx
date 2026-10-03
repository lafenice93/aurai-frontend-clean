"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import Stage, { glass, glassGlow, Hit } from "@/app/components/onboarding/Stage";
import { ko } from "@/app/lib/locale/ko";
import { supabaseBrowser } from "@/app/lib/supabase";
import { profileGivenName } from "@/app/lib/profile";

type Gender = "female" | "male";
type AgeBand = "10" | "20" | "30" | "40" | "50+";

const AGE_BANDS: AgeBand[] = ["10", "20", "30", "40", "50+"];

function ageBandFromBirthDate(value: string): AgeBand | null {
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;

  if (age < 20) return "10";
  if (age < 30) return "20";
  if (age < 40) return "30";
  if (age < 50) return "40";
  return "50+";
}

const fieldClass =
  "h-full w-full rounded-[18px] px-5 text-[15px] outline-none placeholder:text-[#F5F1E1]/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6]";

export default function ProfileForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [ageTouched, setAgeTouched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 로그인 없이는 들어올 수 없다. 이미 저장한 값이 있으면 채워 넣는다.
  useEffect(() => {
    supabaseBrowser()
      .auth.getUser()
      .then(({ data }) => {
        const user = data.user;
        if (!user) {
          router.replace("/login");
          return;
        }
        const meta = user.user_metadata ?? {};
        setGivenName(profileGivenName(meta) ?? "");
        if (typeof meta.familyName === "string") setFamilyName(meta.familyName);
        if (meta.gender === "female" || meta.gender === "male") setGender(meta.gender);
        if (typeof meta.birth_date === "string") setBirthDate(meta.birth_date);
        if (typeof meta.birth_time === "string") setBirthTime(meta.birth_time);
        if (AGE_BANDS.includes(meta.age_band)) {
          setAgeBand(meta.age_band);
          setAgeTouched(true);
        }
        setReady(true);
      });
  }, [router]);

  function handleBirthDate(value: string) {
    setBirthDate(value);
    if (!ageTouched) setAgeBand(ageBandFromBirthDate(value));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = givenName.trim();

    if (!trimmed) {
      setNotice(ko.PROFILE_NEED_NAME);
      return;
    }

    setNotice(null);
    setBusy(true);

    try {
      const { error } = await supabaseBrowser().auth.updateUser({
        data: {
          givenName: trimmed,
          familyName: familyName.trim(),
          name: null,
          gender,
          birth_date: birthDate || null,
          birth_time: birthTime || null,
          age_band: ageBand,
        },
      });

      if (error) {
        setNotice(ko.PROFILE_SAVE_FAILED);
        return;
      }

      router.push("/chat");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stage>
      <Image
        src="/onboarding/05-profile.png"
        alt=""
        fill
        priority
        sizes="430px"
        quality={85}
        className="object-cover"
      />

      <form
        onSubmit={handleSubmit}
        className={`absolute inset-0 transition-opacity ${ready ? "" : "pointer-events-none opacity-0"}`}
      >
        <Hit top={26} left={10.6} width={78.7} height={5.5}>
          <div className="flex h-full gap-2">
            <input
              type="text"
              autoComplete="family-name"
              maxLength={50}
              value={familyName}
              onChange={(event) => setFamilyName(event.target.value)}
              placeholder={ko.PROFILE_FAMILY_NAME}
              aria-label={ko.PROFILE_FAMILY_NAME}
              style={glass}
              className={`${fieldClass} max-w-[30%]`}
            />
            <input
              type="text"
              autoComplete="given-name"
              maxLength={50}
              value={givenName}
              onChange={(event) => setGivenName(event.target.value)}
              placeholder={ko.PROFILE_NAME_PLACEHOLDER}
              aria-label={ko.PROFILE_NAME}
              style={glass}
              className={fieldClass}
            />
          </div>
        </Hit>

        <Hit top={37.7} left={10.6} width={78.7} height={5.5}>
          <div
            role="radiogroup"
            aria-label={ko.PROFILE_GENDER}
            className="flex h-full w-full overflow-hidden rounded-[18px]"
            style={glass}
          >
            {(
              [
                ["female", ko.PROFILE_FEMALE],
                ["male", ko.PROFILE_MALE],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={gender === value}
                onClick={() => setGender(value)}
                style={gender === value ? glassGlow : undefined}
                className="h-full flex-1 cursor-pointer rounded-[18px] text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#F7EEE6]"
              >
                {label}
              </button>
            ))}
          </div>
        </Hit>

        <Hit top={49.9} left={10.6} width={78.7} height={5.5}>
          <input
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => handleBirthDate(event.target.value)}
            aria-label={ko.PROFILE_BIRTH_DATE}
            style={{ ...glass, color: birthDate ? "var(--ui-ivory)" : "transparent" }}
            className={fieldClass}
          />
          {birthDate ? null : (
            <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-[15px] text-[#F5F1E1]/55">
              {ko.PROFILE_BIRTH_DATE_PLACEHOLDER}
            </span>
          )}
        </Hit>

        <Hit top={62.2} left={10.6} width={78.7} height={5.5}>
          <input
            type="time"
            value={birthTime}
            onChange={(event) => setBirthTime(event.target.value)}
            aria-label={ko.PROFILE_BIRTH_TIME}
            style={{ ...glass, color: birthTime ? "var(--ui-ivory)" : "transparent" }}
            className={fieldClass}
          />
          {birthTime ? null : (
            <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-[15px] text-[#F5F1E1]/55">
              {ko.PROFILE_BIRTH_TIME_PLACEHOLDER}
            </span>
          )}
        </Hit>

        <div role="radiogroup" aria-label={ko.PROFILE_AGE_BAND}>
          {AGE_BANDS.map((band, index) => (
            <Hit key={band} top={75.9} left={10.6 + index * 15.95} width={15.2} height={5}>
              <button
                type="button"
                role="radio"
                aria-checked={ageBand === band}
                onClick={() => {
                  setAgeBand(band);
                  setAgeTouched(true);
                }}
                style={ageBand === band ? glassGlow : glass}
                className="h-full w-full cursor-pointer rounded-[18px] text-[15px] transition-transform duration-150 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7EEE6]"
              >
                {band}대
              </button>
            </Hit>
          ))}
        </div>

        <Hit top={84.6} left={10.6} width={78.7} height={6.4}>
          <button
            type="submit"
            disabled={busy}
            style={glassGlow}
            className="h-full w-full cursor-pointer rounded-[22px] text-[18px] transition-transform duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {ko.PROFILE_NEXT}
          </button>
        </Hit>
      </form>

      {notice ? (
        <p
          role="status"
          className="absolute right-[10.6%] left-[10.6%] top-[92%] rounded-[12px] px-4 py-2 text-center text-[12px]"
          style={glass}
        >
          {notice}
        </p>
      ) : null}
    </Stage>
  );
}
