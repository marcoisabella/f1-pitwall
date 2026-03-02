import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight text-center font-[var(--font-display)]">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-f1-text-muted max-w-2xl mx-auto text-center mt-4">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
