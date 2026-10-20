import { useId } from "react";
import { useUnistyles } from "react-native-unistyles";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import mark from "@/brand/nio-mark.json";

interface PaseoLogoProps {
  size?: number;
  color?: string;
  variant?: "monochrome" | "gradient";
}

// Preserve the shared component API so every app-brand surface uses this mark.
export function PaseoLogo({ size = 64, color, variant = "monochrome" }: PaseoLogoProps) {
  const { theme } = useUnistyles();
  const gradientId = `nio-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const fill = color ?? (variant === "gradient" ? `url(#${gradientId})` : theme.colors.foreground);
  return (
    <Svg
      testID="nio-logo"
      accessibilityLabel="NIO"
      width={size}
      height={size}
      viewBox={mark.viewBox}
      fill="none"
    >
      <Defs>
        <LinearGradient
          id={gradientId}
          x1="31"
          y1="0"
          x2="209"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          {mark.stops.map((stop) => (
            <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </LinearGradient>
      </Defs>
      {mark.paths.map((d) => (
        <Path key={d} d={d} fill={fill} />
      ))}
    </Svg>
  );
}
