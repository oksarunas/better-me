import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const progressVariants = cva('w-full h-2 bg-gray-200 rounded', {
  variants: {
    variant: {
      default: 'bg-blue-500',
      secondary: 'bg-green-500',
    },
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-4',
    },
    glow: {
      true: 'shadow-md shadow-blue-300',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    glow: false,
  },
});

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  indicatorVariant?: string;
  indicatorClassName?: string;
  animated?: boolean;
}

export const Progress = ({
  className,
  variant,
  size,
  glow,
  value = 0,
  max = 100,
  indicatorVariant,
  indicatorClassName,
  animated,
  ...props
}: ProgressProps) => {
  return (
    <ProgressPrimitive.Root
      className={cn(progressVariants({ variant, size, glow }), className)}
      value={value}
      max={max}
      {...props}
    >
      <ProgressPrimitive.Indicator className={indicatorClassName} />
    </ProgressPrimitive.Root>
  );
};