import type { ImpactMetrics } from '@repo/types';
import {
  formatCompact,
  formatCurrency,
  formatDecimal,
  formatNumber,
  formatPercent,
} from '../../../lib/format';

/**
 * Below this threshold the acceptance-rate signal is too noisy to trust — we
 * flag the validation rate in red so viewers know impact numbers above are
 * based on a small share of runs.
 */
const VALIDATION_RATE_WARNING = 0.6;

interface ImpactKpisProps {
  impact: ImpactMetrics;
}

export function ImpactKpis({ impact }: ImpactKpisProps) {
  const hasValidation = impact.totalValidated > 0;
  const hasAccepted = impact.totalAccepted > 0;
  const hasRejected = impact.totalRejected > 0;
  const validationIsNoisy = impact.totalCalls > 0 && impact.validationRate < VALIDATION_RATE_WARNING;

  return (
    <div className="impact-kpis">
      <Kpi
        label="Avg Cost / Accepted Output"
        value={hasAccepted ? formatCurrency(impact.costPerAcceptedRun) : '–'}
        hint={
          hasAccepted
            ? `${formatCurrency(impact.totalAcceptedCost)} spent on ${formatNumber(impact.totalAccepted)} accepted`
            : 'no accepted outputs'
        }
      />
      <Kpi
        label="Avg Cost / Rejected Output"
        value={hasRejected ? formatCurrency(impact.costPerRejectedRun) : '–'}
        hint={
          hasRejected
            ? `${formatCurrency(impact.totalRejectedCost)} spent on ${formatNumber(impact.totalRejected)} rejected`
            : 'no rejected outputs'
        }
      />
      <Kpi
        label="Acceptance Rate"
        value={hasValidation ? formatPercent(impact.acceptanceRate) : '–'}
        hint={
          hasValidation
            ? `${formatNumber(impact.totalAccepted)} accepted / ${formatNumber(impact.totalValidated)} reviewed`
            : 'no reviews yet'
        }
      />
      <Kpi
        label="Validation Rate"
        value={impact.totalCalls > 0 ? formatPercent(impact.validationRate) : '–'}
        hint={
          impact.totalCalls > 0
            ? validationIsNoisy
              ? `only ${formatNumber(impact.totalValidated)} of ${formatNumber(impact.totalCalls)} reviewed — impact is noisy`
              : `${formatNumber(impact.totalValidated)} of ${formatNumber(impact.totalCalls)} runs reviewed`
            : 'no runs in window'
        }
        tone={validationIsNoisy ? 'danger' : undefined}
        hintTone={validationIsNoisy ? 'danger' : undefined}
      />
      <Kpi
        label="Accepted Outputs"
        value={hasValidation ? formatNumber(impact.totalAccepted) : '–'}
        hint={hasValidation ? `${formatNumber(impact.totalRejected)} rejected` : undefined}
      />
      <Kpi
        label="Accepted Lines of Code"
        value={hasAccepted ? formatCompact(impact.totalValidatedLines) : '–'}
        hint={
          hasAccepted
            ? `avg ${formatDecimal(impact.avgLinesPerAcceptedRun, 1)} LOC / accepted output`
            : 'no accepted lines'
        }
      />
    </div>
  );
}

type KpiTone = 'danger';

function Kpi({
  label,
  value,
  hint,
  tone,
  hintTone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: KpiTone;
  hintTone?: KpiTone;
}) {
  return (
    <div className="impact-kpi">
      <span className="impact-kpi-label">{label}</span>
      <span className={`impact-kpi-value${tone ? ` impact-kpi-value--${tone}` : ''}`}>
        {value}
      </span>
      {hint && (
        <span className={`impact-kpi-hint${hintTone ? ` impact-kpi-hint--${hintTone}` : ''}`}>
          {hint}
        </span>
      )}
    </div>
  );
}
