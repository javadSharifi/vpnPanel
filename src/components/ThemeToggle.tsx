import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium',
        'text-muted-foreground hover:text-foreground',
        'hover:bg-accent/50 transition-colors',
        className,
      )}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
