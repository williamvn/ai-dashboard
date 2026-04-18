import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, type Blocker } from 'react-router-dom';
import {
  runSimulation,
  type SimulationConfig,
  type SimulationResult,
} from '../services/simulate.service';

export interface UseSimulation {
  running: boolean;
  progress: { done: number; total: number };
  progressPct: number;
  result: SimulationResult | null;
  error: string | null;
  blocker: Blocker;
  handleRun: (config: SimulationConfig) => Promise<void>;
  handleStop: () => void;
}

export function useSimulation(): UseSimulation {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const blocker = useBlocker(running);

  const progressPct = useMemo(
    () => (progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0),
    [progress],
  );

  async function handleRun(config: SimulationConfig) {
    const controller = new AbortController();
    abortRef.current = controller;

    setRunning(true);
    setResult(null);
    setError(null);
    setProgress({ done: 0, total: 0 });

    try {
      const res = await runSimulation(
        config,
        (done, total) => setProgress({ done, total }),
        controller.signal,
      );
      setResult(res);
    } catch (e) {
      if (!controller.signal.aborted) {
        setError('Simulation failed. Make sure the API is running.');
        console.error(e);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return { running, progress, progressPct, result, error, blocker, handleRun, handleStop };
}
