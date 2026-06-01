/**
 * Hermes API Client
 * 与Hermes后端服务通信的API客户端
 */

import type {
  AnalysisState,
  AnalysisEvent,
  SequencedSseAnalysisEvent,
  StartAnalysisRequest,
  StartAnalysisResponse,
} from './types'

export type AnalysisEventStreamOptions = {
  onEvent?: (event: AnalysisEvent, sequence?: number) => void
  onError?: (error: Error) => void
  onComplete?: () => void
  maxRetries?: number
  retryDelayMs?: (retryCount: number) => number
}

/**
 * 解析SSE事件数据
 */
export function readSseAnalysisEvent(data: string): SequencedSseAnalysisEvent {
  const payload = JSON.parse(data) as AnalysisEvent | SequencedSseAnalysisEvent
  if (payload && typeof payload === 'object' && 'event' in payload) {
    return payload as SequencedSseAnalysisEvent
  }
  return { event: payload as AnalysisEvent }
}

/**
 * Hermes API客户端
 */
export class HermesClient {
  private baseUrl: string
  private defaultMaxRetries: number = 6

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  /**
   * 启动分析任务
   */
  async startAnalysis(request: StartAnalysisRequest): Promise<StartAnalysisResponse> {
    const response = await fetch(`${this.baseUrl}/api/analysis/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message ?? '分析启动失败')
    }

    return response.json() as Promise<StartAnalysisResponse>
  }

  /**
   * 获取已保存的分析
   */
  async loadAnalysis(analysisId: string): Promise<{ analysis?: AnalysisState | null; eventCount?: number }> {
    const response = await fetch(`${this.baseUrl}/api/analysis/${encodeURIComponent(analysisId)}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message ?? '分析加载失败')
    }

    return response.json()
  }

  /**
   * 获取分析事件流（SSE）
   */
  subscribeToAnalysisEvents(
    analysisId: string,
    options: AnalysisEventStreamOptions & { afterSequence?: number } = {},
  ): () => void {
    const {
      onEvent,
      onError,
      onComplete,
      maxRetries = this.defaultMaxRetries,
      retryDelayMs = (count) => Math.min(8000, 500 * 2 ** Math.max(0, count - 1)),
      afterSequence = 0,
    } = options
    let currentAfterSequence = afterSequence

    let retryCount = 0
    let retryTimer: number | null = null
    let isClosed = false

    const cleanup = () => {
      isClosed = true
      if (retryTimer !== null) window.clearTimeout(retryTimer)
    }

    const connect = () => {
      if (isClosed) return

      const source = new EventSource(
        `${this.baseUrl}/api/analysis/${encodeURIComponent(analysisId)}/events?after=${currentAfterSequence}`,
      )

      source.onmessage = (event) => {
        retryCount = 0
        try {
          const sequencedEvent = readSseAnalysisEvent(event.data)
          if (sequencedEvent.sequence !== undefined) {
            currentAfterSequence = Math.max(currentAfterSequence, sequencedEvent.sequence)
          }
          onEvent?.(sequencedEvent.event, sequencedEvent.sequence)

          // 检查是否应该关闭流
          if (['analysis.completed', 'analysis.failed', 'analysis.requires_action', 'analysis.stream_interrupted', 'hermes.run.completed'].includes(sequencedEvent.event.type)) {
            cleanup()
            source.close()
            onComplete?.()
          }
        } catch (error) {
          onError?.(error instanceof Error ? error : new Error('事件解析失败'))
        }
      }

      source.onerror = () => {
        source.close()
        if (isClosed) return

        retryCount += 1
        if (retryCount < maxRetries) {
          const delay = retryDelayMs(retryCount)
          retryTimer = window.setTimeout(connect, delay)
        } else {
          cleanup()
          onError?.(new Error('事件流连接失败，已达到最大重试次数'))
        }
      }
    }

    connect()
    return cleanup
  }

  /**
   * 获取对话历史
   */
  async loadConversation(analysisId: string): Promise<{
    conversation?: { id: string }
    messages?: Array<{ id: string; role: string; content: string; createdAt: string }>
  }> {
    const response = await fetch(`${this.baseUrl}/api/analysis/${encodeURIComponent(analysisId)}/conversation`)

    if (!response.ok) {
      return { messages: [] }
    }

    return response.json()
  }

  /**
   * 发送对话消息
   */
  async sendMessage(
    conversationId: string | null,
    analysisId: string,
    message: string,
  ): Promise<{ conversation?: { id: string }; reply?: string }> {
    const response = await fetch(`${this.baseUrl}/api/analysis/${encodeURIComponent(analysisId)}/composer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        message,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message ?? '消息发送失败')
    }

    return response.json()
  }

  /**
   * 订阅对话流（SSE）
   */
  subscribeToComposerStream(
    conversationId: string | null,
    analysisId: string,
    message: string,
    options: {
      onDelta?: (text: string) => void
      onComplete?: (reply: string) => void
      onError?: (error: Error) => void
    } = {},
  ): () => void {
    const { onDelta, onComplete, onError } = options

    const source = new EventSource(
      `${this.baseUrl}/api/analysis/${encodeURIComponent(analysisId)}/composer/stream?conversationId=${conversationId ?? ''}&message=${encodeURIComponent(message)}`,
    )

    const cleanup = () => source.close()

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type: string; delta?: string; reply?: string; error?: string }

        if (data.type === 'delta' && data.delta) {
          onDelta?.(data.delta)
        } else if (data.type === 'completed' && data.reply) {
          cleanup()
          onComplete?.(data.reply)
        } else if (data.type === 'error') {
          cleanup()
          onError?.(new Error(data.error ?? '消息处理失败'))
        }
      } catch (error) {
        cleanup()
        onError?.(error instanceof Error ? error : new Error('流数据解析失败'))
      }
    }

    source.onerror = () => {
      cleanup()
      onError?.(new Error('消息流连接失败'))
    }

    return cleanup
  }

  /**
   * 获取最近分析列表
   */
  async loadRecentAnalyses(limit: number = 60): Promise<Array<{
    prompt: { company: string; year: number; reportType: string; request: string }
    analysis: AnalysisState
    eventCount?: number
    updatedAt: string
  }>> {
    const response = await fetch(`${this.baseUrl}/api/analysis/recent?limit=${limit}`)

    if (!response.ok) {
      return []
    }

    const data = await response.json() as { records?: unknown[] }
    return (data.records ?? []) as any
  }

  /**
   * 获取系统健康状态
   */
  async checkHealth(): Promise<{ status: string; hermesAvailable: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
      if (!response.ok) return { status: 'offline', hermesAvailable: false }
      return response.json()
    } catch {
      return { status: 'offline', hermesAvailable: false }
    }
  }

  /**
   * 获取命令快捷方式
   */
  async loadCommandShortcuts(): Promise<Array<{
    id: string
    label: string
    command: string
    source: string
    intent: string
    priority: number
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/command-shortcuts`)
      if (!response.ok) return []
      const data = await response.json() as { shortcuts?: unknown[] }
      return (data.shortcuts ?? []) as any
    } catch {
      return []
    }
  }

  /**
   * 路由Assistant命令
   */
  async routeAssistantCommand(message: string): Promise<{ action?: any }> {
    const response = await fetch(`${this.baseUrl}/api/assistant/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error('Assistant路由失败')
    }

    return response.json()
  }

  /**
   * 上传文件
   */
  async uploadFile(file: File): Promise<{
    upload?: { uploadId: string; fileName: string; mimeType: string; size: number }
  }> {
    const form = new FormData()
    form.append('file', file)

    const response = await fetch(`${this.baseUrl}/api/uploads/report`, {
      method: 'POST',
      body: form,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message ?? '文件上传失败')
    }

    return response.json()
  }
}

/**
 * 全局Hermes客户端单例
 */
export const hermesClient = new HermesClient()
