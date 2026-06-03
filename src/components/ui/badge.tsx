import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary/15 text-primary border-primary/30',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive/15 text-destructive border-destructive/30',
  outline: 'text-foreground border-border',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';

export { Badge, type BadgeVariant };
