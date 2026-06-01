import type { AnalysisRecord, HermesEvent, SequencedHermesEvent } from './store';

type HubDeps = {
  getRecord: (analysisId: string) => AnalysisRecord | null;
  appendEvent: (analysisId: string, event: HermesEvent) => AnalysisRecord | null;
  streamRunEvents: (runId: string, signal: AbortSignal) => AsyncGenerator<HermesEvent>;
  buildFailureEvent: (error: unknown, runId: string) => Promise<HermesEvent>;
};

type Subscriber = (event: SequencedHermesEvent) => void;

export function createAnalysisEventHub(deps: HubDeps) {
  const watchers = new Map<string, { abortController: AbortController; done: Promise<void> }>();
  const subscribers = new Map<string, Set<Subscriber>>();

  function publish(analysisId: string, item: SequencedHermesEvent) {
    subscribers.get(analysisId)?.forEach(subscriber => subscriber(item));
  }

  function persist(analysisId: string, event: HermesEvent) {
    const record = deps.appendEvent(analysisId, event);
    if (!record) return null;
    const item = { sequence: record.events.length, event };
    publish(analysisId, item);
    return item;
  }

  async function watch(analysisId: string, abortController: AbortController) {
    const record = deps.getRecord(analysisId);
    if (!record?.runId || isTerminal(record)) return;
    const runId = record.runId;
    if (!record.events.some(event => event.type === 'hermes.run.started')) {
      persist(analysisId, { type: 'hermes.run.started', runId, status: record.runStatus || 'running', input: 'Hermes Agent 正在执行AMC评估任务' });
    }
    try {
      for await (const event of deps.streamRunEvents(runId, abortController.signal)) {
        if (abortController.signal.aborted) return;
        persist(analysisId, event);
        if (isTerminalEvent(event)) break;
      }
    } catch (error) {
      if (!abortController.signal.aborted) persist(analysisId, await deps.buildFailureEvent(error, runId));
    }
  }

  return {
    ensureWatching(analysisId: string) {
      if (watchers.has(analysisId)) return;
      const abortController = new AbortController();
      const done = watch(analysisId, abortController).finally(() => watchers.delete(analysisId));
      watchers.set(analysisId, { abortController, done });
    },
    subscribe(analysisId: string, afterSequence: number, subscriber: Subscriber) {
      const record = deps.getRecord(analysisId);
      record?.events.forEach((event, index) => {
        const sequence = index + 1;
        if (sequence > afterSequence) subscriber({ sequence, event });
      });
      const set = subscribers.get(analysisId) || new Set<Subscriber>();
      set.add(subscriber);
      subscribers.set(analysisId, set);
      return () => {
        set.delete(subscriber);
        if (set.size === 0) subscribers.delete(analysisId);
      };
    },
    stop(analysisId: string) {
      watchers.get(analysisId)?.abortController.abort();
      watchers.delete(analysisId);
    },
  };
}

function isTerminal(record: AnalysisRecord) {
  return record.events.some(isTerminalEvent);
}

function isTerminalEvent(event: HermesEvent) {
  return ['analysis.completed', 'analysis.failed', 'analysis.requires_action', 'analysis.stream_interrupted', 'hermes.run.completed'].includes(event.type);
}
