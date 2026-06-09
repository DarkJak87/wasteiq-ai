import { Link } from "@tanstack/react-router";
import logoColor from "@/assets/wasteiq_logo.png.asset.json";
import logoWhite from "@/assets/wasteiq_logo_white.png.asset.json";

const SIZE_CLASS = {
  sm: "h-9",
  md: "h-12",
  lg: "h-16",
} as const;

type LogoProps = {
  className?: string;
  variant?: "color" | "white";
  size?: keyof typeof SIZE_CLASS;
};

export function Logo({ className = "", variant = "color", size = "md" }: LogoProps) {
  const src = variant === "white" ? logoWhite.url : logoColor.url;
  return (
    <Link to="/" aria-label="WasteIQ AI home" className={`inline-flex items-center ${className}`}>
      <img
        src={src}
        alt="WasteIQ AI"
        className={`${SIZE_CLASS[size]} w-auto select-none`}
        draggable={false}
      />
    </Link>
  );
}