import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'tier';
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Champion';
  className?: string;
}

const tierColors = {
  Bronze: 'bg-orange-900/50 text-orange-300 border-orange-700',
  Silver: 'bg-gray-600/50 text-gray-200 border-gray-500',
  Gold: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  Diamond: 'bg-blue-900/50 text-blue-300 border-blue-700',
  Champion: 'bg-purple-900/50 text-purple-300 border-purple-700',
};

const variantColors = {
  default: 'bg-gray-800 text-gray-200 border-gray-700',
  success: 'bg-green-900/50 text-green-300 border-green-700',
  warning: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  danger: 'bg-red-900/50 text-red-300 border-red-700',
  tier: '', // handled by tier prop
};

export function Badge({ children, variant = 'default', tier, className }: BadgeProps) {
  const colorClass = variant === 'tier' && tier
    ? tierColors[tier]
    : variantColors[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
}
