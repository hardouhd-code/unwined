import React from "react";
import { C } from "../lib/constants";

interface TagProps {
  children: React.ReactNode;
  color?: string;
}

const Tag = ({ children, color }: TagProps) => (
  <span
    className="text-[13px] rounded-full px-3 py-1.5 font-['Cormorant_Garamond',serif] leading-[1.1] whitespace-nowrap inline-flex items-center"
    style={{
      color: color || "var(--color-accent-color)",
      background: color ? `${color}24` : "rgba(139,90,60,.14)",
      border: `1px solid ${color || "var(--color-accent-color)"}44`,
    }}
  >
    {children}
  </span>
);

interface StarRatingProps {
  value: number;
  onChange: (val: number) => void;
  size?: number;
}

const StarRating = ({ value, onChange, size = 32 }: StarRatingProps) => (
  <div className="flex gap-2 justify-center">
    {[0,1,2,3,4,5].map(n=>(
      <button key={n} onClick={()=>onChange(n)} 
              className="rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                width: size + 8, height: size + 8,
                background: n <= value ? "linear-gradient(135deg, var(--color-terra), var(--color-gold))" : "rgba(139,90,60,.1)",
                border: n <= value ? "none" : "1px solid rgba(184,134,42,.3)",
                color: n <= value ? "#fff" : "var(--color-muted-text)",
                fontSize: n === 0 ? 13 : 17,
                fontWeight: 700
              }}>
        {n===0?"✗":"★"}
      </button>
    ))}
  </div>
);

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-[#8b5a3c22] rounded-xl ${className}`} />
);

export const PageSkeleton = () => (
  <div className="flex-1 flex flex-col p-6 gap-6 h-[100dvh] pt-24 bg-[#25160e]">
    <div className="flex gap-4 items-center">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-10 w-24 rounded-full" />
      <Skeleton className="h-10 w-24 rounded-full" />
    </div>
    <Skeleton className="flex-1 rounded-[22px]" />
  </div>
);

export { Tag, StarRating };
