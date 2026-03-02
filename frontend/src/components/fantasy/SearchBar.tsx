interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  className = '',
}: SearchBarProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        w-full bg-f1-surface border border-f1-border rounded-lg
        px-3 py-2 text-sm text-f1-text
        placeholder:text-f1-text-muted
        focus:ring-1 focus:ring-f1-red focus:border-f1-red outline-none
        transition-colors
        ${className}
      `}
    />
  );
}
