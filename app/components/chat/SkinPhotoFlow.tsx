"use client";

import type { SkinPhotoContext, SkinPhotoSubmission } from "@/app/lib/skinPhoto";
import { ko } from "@/app/lib/locale/ko";
import Appear from "./Appear";
import ChatBubble from "./ChatBubble";
import SkinPhotoGuide from "./SkinPhotoGuide";
import SkinPhotoActions from "./SkinPhotoActions";

export default function SkinPhotoFlow({ name, context, onConfirmed }: {
  name?: string;
  context: SkinPhotoContext;
  onConfirmed: (submission: SkinPhotoSubmission) => void;
}) {
  return (
    <div data-testid="skin-photo-flow" className="space-y-3">
      <Appear after={0}><SkinPhotoGuide name={name} /></Appear>
      <Appear after={400}>
        <div data-testid="skin-photo-request">
          <ChatBubble role="assistant" lines={[ko.SKIN_PHOTO_REQUEST]} />
        </div>
      </Appear>
      <Appear after={1000}>
        <SkinPhotoActions context={context} onConfirmed={onConfirmed} />
      </Appear>
    </div>
  );
}
