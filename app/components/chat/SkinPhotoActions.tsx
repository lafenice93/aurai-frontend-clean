"use client";

import { useEffect, useRef, useState } from "react";
import type { SkinPhotoContext, SkinPhotoSubmission } from "@/app/lib/skinPhoto";
import { uploadSkinPhoto } from "@/app/lib/storage";
import { ko } from "@/app/lib/locale/ko";
import ActionChips from "./ActionChips";
import CameraCard from "./CameraCard";

export default function SkinPhotoActions({ context, onConfirmed }: {
  context: SkinPhotoContext;
  onConfirmed: (submission: SkinPhotoSubmission) => void;
}) {
  const submission = useRef<SkinPhotoSubmission | null>(null);
  const saving = useRef(false);
  const mounted = useRef(true);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function upload() {
    if (saving.current || !submission.current) return;
    saving.current = true;
    const confirmed = submission.current;
    setStatus("uploading");
    try {
      const storagePath = await uploadSkinPhoto(confirmed.photo.blob, confirmed.context);
      if (!mounted.current) return;
      submission.current = { ...confirmed, storagePath };
      onConfirmed(submission.current);
      setStatus("done");
    } catch {
      if (mounted.current) setStatus("error");
    } finally { saving.current = false; }
  }

  return (
    <div data-testid="skin-photo-actions">
      <CameraCard purpose="skin" onUsePhoto={(photo) => {
        if (submission.current) return;
        submission.current = { photo, context, storagePath: null };
        onConfirmed(submission.current);
        void upload();
      }} />
      {status !== "idle" ? <p role="status" className="mt-3 break-keep text-[12px] leading-relaxed text-[#F7EEE6]/90">
        {status === "uploading" ? ko.SKIN_PHOTO_UPLOADING : status === "done" ? ko.SKIN_PHOTO_UPLOADED : ko.SKIN_PHOTO_UPLOAD_FAILED}
      </p> : null}
      {status === "error" ? <ActionChips actions={[{ id: "skin-photo-retry", label: ko.RETRY }]}
        onSelect={() => void upload()} /> : null}
    </div>
  );
}
