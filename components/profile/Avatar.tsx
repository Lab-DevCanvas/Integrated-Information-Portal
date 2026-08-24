import { User } from "lucide-react";

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-8 w-8",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

const ICON_SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-9 w-9",
};

interface AvatarProps {
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600 ${SIZE_CLASSES[size]} ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar is a client-side data: URL, next/image can't optimize it
        <img src={src} alt="프로필 이미지" className="h-full w-full object-cover" />
      ) : (
        <User className={`${ICON_SIZE_CLASSES[size]} text-white`} strokeWidth={1.75} />
      )}
    </div>
  );
}
