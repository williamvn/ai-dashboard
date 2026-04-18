import type { CSSProperties } from 'react';
import './Slider.css';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  disabled = false,
  className = '',
}: SliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      className={`sim-slider ${className}`}
      style={{ ['--sim-slider-fill' as string]: `${pct}%` } as CSSProperties}
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
