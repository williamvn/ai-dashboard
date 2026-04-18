import { useCallback } from 'react';
import './RangeSlider.css';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  disabled?: boolean;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  disabled = false,
  className = '',
}: RangeSliderProps) {
  const range = max - min;
  const leftPct = range > 0 ? ((valueMin - min) / range) * 100 : 0;
  const rightPct = range > 0 ? ((valueMax - min) / range) * 100 : 100;
  // When min thumb has crossed past the midpoint, lift it above the max thumb so
  // overlapping handles on the right edge remain draggable.
  const minOnTop = valueMin > (min + max) / 2;

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.min(Number(e.target.value), valueMax);
      onChange(v, valueMax);
    },
    [valueMax, onChange],
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.max(Number(e.target.value), valueMin);
      onChange(valueMin, v);
    },
    [valueMin, onChange],
  );

  return (
    <div className={`range-slider${disabled ? ' disabled' : ''} ${className}`}>
      <div className="range-slider-track" />
      <div
        className="range-slider-fill"
        style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
      />
      <input
        type="range"
        className="range-slider-input range-slider-input-min"
        style={{ zIndex: minOnTop ? 4 : 2 }}
        min={min}
        max={max}
        step={step}
        value={valueMin}
        onChange={handleMinChange}
        disabled={disabled}
        aria-label="Minimum value"
      />
      <input
        type="range"
        className="range-slider-input range-slider-input-max"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        onChange={handleMaxChange}
        disabled={disabled}
        aria-label="Maximum value"
      />
    </div>
  );
}
