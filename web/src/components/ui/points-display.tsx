import { formatPoints } from '@/theme';

type PointsDisplayProps = {
  amount: number;
  compact?: boolean;
  className?: string;
};

/** Branded point balance — always uses "point/points" wording. */
export function PointsDisplay({ amount, compact, className = '' }: PointsDisplayProps) {
  return (
    <span className={`font-semibold text-points ${className}`}>
      {formatPoints(amount, compact)}
    </span>
  );
}
