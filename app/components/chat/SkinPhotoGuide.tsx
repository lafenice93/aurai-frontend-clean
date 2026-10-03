import { fill, ko } from "@/app/lib/locale/ko";
import Orb from "./Orb";

export default function SkinPhotoGuide({ name }: { name?: string }) {
  const named = Boolean(name?.trim());
  return (
    <section data-testid="skin-photo-guide" className="skin-glass-card space-y-4 px-5 py-4">
      <h2 className="break-keep text-[15px] leading-[1.5] [overflow-wrap:anywhere]">
        {named ? fill([ko.SKIN_PHOTO_GUIDE_TITLE], { user: name })[0] : ko.SKIN_PHOTO_GUIDE_TITLE_FALLBACK}
      </h2>
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1 space-y-2 break-keep text-[12px] leading-[1.6] [overflow-wrap:anywhere]">
          <p>{ko.SKIN_PHOTO_GUIDE_HINT}</p>
          <p className="opacity-85">
            {named ? fill([ko.SKIN_PHOTO_GUIDE_DIRECTION], { user: name })[0] : ko.SKIN_PHOTO_GUIDE_DIRECTION_FALLBACK}
          </p>
        </div>
        <Orb size={62} />
      </div>
    </section>
  );
}
