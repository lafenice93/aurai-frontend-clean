import type { SkinTypeIcon } from "@/app/lib/skinTypes";

type IconProps = { className?: string; size?: number };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function SpeakerIcon({ className, size = 20 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...base}
      aria-hidden="true"
    >
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4a.8.8 0 0 1-.8-.8v-3.4a.8.8 0 0 1 .8-.8Z" />
      <path d="M15.8 9.2a4 4 0 0 1 0 5.6M18.4 6.6a7.6 7.6 0 0 1 0 10.8" />
    </svg>
  );
}

const dropletPath = "M12 3.5c0 0-5.6 6.4-5.6 10.1a5.6 5.6 0 0 0 11.2 0C17.6 9.9 12 3.5 12 3.5Z";

const skinIcons: Record<SkinTypeIcon, (props: IconProps) => React.ReactElement> = {
  droplet: ({ className, size = 22 }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...base}
      aria-hidden="true"
    >
      <path d={dropletPath} />
    </svg>
  ),
  "droplet-pair": ({ className, size = 22 }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...base}
      aria-hidden="true"
    >
      <path d="M8 4.5s-3.6 4.2-3.6 6.6a3.6 3.6 0 0 0 7.2 0C11.6 8.7 8 4.5 8 4.5Z" />
      <path d="M16.4 11s-3.4 4-3.4 6.3a3.4 3.4 0 0 0 6.8 0c0-2.3-3.4-6.3-3.4-6.3Z" />
    </svg>
  ),
  leaf: ({ className, size = 22 }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...base}
      aria-hidden="true"
    >
      <path d="M20 4c0 8.8-4.6 13.4-11.4 13.4A4.6 4.6 0 0 1 4 12.8C4 7 9.6 4 20 4Z" />
      <path d="M4.6 20C7 15 11.4 11.4 16.6 9.4" />
    </svg>
  ),
  "droplet-dotted": ({ className, size = 22 }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...base}
      aria-hidden="true"
    >
      <path d={dropletPath} />
      <circle cx="10" cy="13" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13.6" cy="11.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13.2" cy="15.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  sparkles: ({ className, size = 22 }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...base}
      aria-hidden="true"
    >
      <path d="M9 3.5c.4 3.4 2.6 5.6 6 6-3.4.4-5.6 2.6-6 6-.4-3.4-2.6-5.6-6-6 3.4-.4 5.6-2.6 6-6Z" />
      <path d="M18 13.5c.2 1.9 1.4 3.1 3.3 3.3-1.9.2-3.1 1.4-3.3 3.3-.2-1.9-1.4-3.1-3.3-3.3 1.9-.2 3.1-1.4 3.3-3.3Z" />
    </svg>
  ),
};

export function SkinIcon({
  name,
  className,
  size,
}: IconProps & { name: SkinTypeIcon }) {
  const Icon = skinIcons[name];
  return <Icon className={className} size={size} />;
}
