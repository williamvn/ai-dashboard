import type { ReactNode } from 'react';
import './ChartCard.css';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  empty?: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, empty = false, headerAction, children }: ChartCardProps) {
  return (
    <section className="chart-card">
      <header className="chart-card-header">
        <div className="chart-card-header-text">
          <h3 className="chart-card-title">{title}</h3>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {headerAction && <div className="chart-card-header-action">{headerAction}</div>}
      </header>
      {empty ? (
        <div className="chart-card-empty">No data in selected window.</div>
      ) : (
        <div className="chart-card-body">{children}</div>
      )}
    </section>
  );
}
