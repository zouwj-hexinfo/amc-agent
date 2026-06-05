import type { AnalysisRecord, HermesEvent, SequencedHermesEvent } from './store';

type HubDeps = {
  getRecord: (analysisId: string) => AnalysisRecord | null;
  appendEvent: (analysisId: string, event: HermesEvent) => AnalysisRecord | null;
  streamRunEvents: (runId: string, signal: AbortSignal) => AsyncGenerator<HermesEvent>;
  buildFailureEvent: (error: unknown, runId: string) => Promise<HermesEvent>;
  getRunSnapshot?: (runId: string) => Promise<{ status?: string; output?: unknown } | null>;
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
    while (!abortController.signal.aborted) {
      try {
        let sawTerminalEvent = false;
        for await (const event of deps.streamRunEvents(runId, abortController.signal)) {
          if (abortController.signal.aborted) return;
          persist(analysisId, event);
          if (event.type === 'hermes.run.completed') {
            sawTerminalEvent = true;
            persistCompleted(analysisId, event.output);
            break;
          }
          if (isTerminalEvent(event)) {
            sawTerminalEvent = true;
            break;
          }
        }
        if (sawTerminalEvent || abortController.signal.aborted) return;
        const shouldRetry = await reconcileAfterStreamEnd(analysisId, runId);
        if (!shouldRetry) return;
        await delay(2000, abortController.signal);
      } catch (error) {
        if (abortController.signal.aborted) return;
        const failureEvent = await deps.buildFailureEvent(error, runId);
        persist(analysisId, failureEvent);
        if (failureEvent.type !== 'hermes.tool.progress') return;
        await delay(2000, abortController.signal);
      }
    }
  }

  function persistCompleted(analysisId: string, output: string) {
    const content = output?.trim();
    if (content) persist(analysisId, { type: 'amc.report.generated', reportFormat: 'markdown', reportContent: content });
    persist(analysisId, { type: 'analysis.completed' });
  }

  async function reconcileAfterStreamEnd(analysisId: string, runId: string) {
    const snapshot = await deps.getRunSnapshot?.(runId);
    const status = snapshot?.status || '';
    if (/^completed$/i.test(status)) {
      const output = stringifyRunOutput(snapshot?.output) || 'Hermes Agent 运行完成';
      persist(analysisId, { type: 'hermes.run.completed', output });
      persistCompleted(analysisId, output);
      return false;
    }
    if (/^requires_action$/i.test(status)) {
      persist(analysisId, {
        type: 'analysis.requires_action',
        message: 'Hermes Agent 需要人工授权后继续。',
      });
      return false;
    }
    if (/^(queued|running|in_progress)$/i.test(status)) {
      persist(analysisId, {
        type: 'hermes.tool.progress',
        toolName: 'Hermes 事件流',
        label: '事件流连接暂时结束，分析仍在运行，可继续恢复订阅。',
      });
      return true;
    }
    if (/^(failed|cancelled)$/i.test(status)) {
      persist(analysisId, { type: 'analysis.failed', message: 'Hermes Agent 运行已结束但未返回完整报告。' });
      return false;
    }
    return false;
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

function stringifyRunOutput(output: unknown) {
  if (typeof output === 'string') return output.trim();
  if (output === undefined || output === null) return '';
  try {
    return JSON.stringify(output);
  } catch {
    return String(output);
  }
}

function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}
