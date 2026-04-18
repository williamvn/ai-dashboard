import type { ReactNode } from 'react';
import './ChartCard.css';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  empty?: boolean;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, empty = false, children }: ChartCardProps) {
  return (
    <section className="chart-card">
      <header className="chart-card-header">
        <h3 className="chart-card-title">{title}</h3>
        {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
      </header>
      {empty ? (
        <div className="chart-card-empty">No data in selected window.</div>
      ) : (
        <div className="chart-card-body">{children}</div>
      )}
    </section>
  );
}
