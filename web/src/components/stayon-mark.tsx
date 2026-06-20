type StayOnMarkProps = {
  size?: number;
  className?: string;
};

/** StayOn logomark — pause bars + point dot. See docs/11_branding.md */
export function StayOnMark({ size = 28, className = '' }: StayOnMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="StayOn"
      className={className}
    >
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <rect x="10" y="9" width="3.5" height="14" rx="1.5" className="fill-brand-foreground dark:fill-[#042f2e]" />
      <rect x="18.5" y="9" width="3.5" height="14" rx="1.5" className="fill-brand-foreground dark:fill-[#042f2e]" />
      <circle cx="24" cy="8" r="3" className="fill-points" />
    </svg>
  );
}
