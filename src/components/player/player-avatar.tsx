import Image from "next/image";

import { cn } from "@/lib/utils";

type PlayerAvatarProps = {
  className?: string;
  imageClassName?: string;
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-13 w-13 text-base",
  lg: "h-24 w-24 text-2xl",
};

export function PlayerAvatar({ className, imageClassName, name, photoUrl, size = "md" }: PlayerAvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className={cn("relative inline-flex flex-none items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-800 font-black text-lime-300", sizeClasses[size], className)}>
      {photoUrl ? (
        <Image alt={`Foto de ${name}`} className={cn("object-cover", imageClassName)} fill sizes={size === "lg" ? "96px" : size === "md" ? "52px" : "40px"} src={photoUrl} unoptimized />
      ) : initials}
    </span>
  );
}
