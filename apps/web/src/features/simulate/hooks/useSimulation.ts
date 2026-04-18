import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, type Blocker } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  clearResult: () => void;
}

export function useSimulation(): UseSimulation {
  const queryClient = useQueryClient();
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
      // Either a completed or aborted run may have written new runs/validations
      // to the backend. Drop any cached dashboard metrics so the next view fetches fresh.
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function clearResult() {
    setResult(null);
    setError(null);
    setProgress({ done: 0, total: 0 });
  }

  return {
    running,
    progress,
    progressPct,
    result,
    error,
    blocker,
    handleRun,
    handleStop,
    clearResult,
  };
}
