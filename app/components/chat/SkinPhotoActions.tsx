"use client";
import { useRef } from "react";
import type { SkinPhotoContext, SkinPhotoSubmission } from "@/app/lib/skinPhoto";
import type { CapturedPhoto } from "@/app/lib/camera/types";
import CameraCard from "./CameraCard";

/** UI-only confirmation. No upload or external analysis request in this phase. */
export default function SkinPhotoActions({ context, onConfirmed, initialPhoto }: {
  context: SkinPhotoContext; onConfirmed: (submission: SkinPhotoSubmission) => void;
  initialPhoto?: CapturedPhoto;
}) {
  const confirmed = useRef(false);
  return <div data-testid="skin-photo-actions"><CameraCard purpose="skin" initialPhoto={initialPhoto} autoStart={!initialPhoto} onUsePhoto={(photo) => {
    if (confirmed.current) return;
    confirmed.current = true;
    onConfirmed({ photo, context, storagePath: null });
  }} /></div>;
}
