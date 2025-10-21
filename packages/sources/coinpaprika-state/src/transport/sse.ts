/**
 * SSE parser for chunked lines and event emission
 */
export class SSEParser {
  private buffer = ''
  private dataLines: string[] = []
  private currentEvent: string | null = null
  private readonly defaultEvent: string

  constructor(defaultEvent: string) {
    this.defaultEvent = defaultEvent
  }

  /**
   * Push a chunk and emit parsed events via callback.
   * The callback is invoked once per complete event frame.
   */
  push(chunk: string, onEvent: (eventType: string, data: string) => void): void {
    this.buffer += chunk
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() || ''

    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, '')

      if (line.startsWith(':')) continue

      if (line.startsWith('event:')) {
        this.currentEvent = line.slice(6).trim()
        continue
      }
      if (line.startsWith('data:')) {
        this.dataLines.push(line.slice(5).trim())
        continue
      }

      // end of an event
      if (line.trim() === '' && this.dataLines.length > 0) {
        const rawData = this.dataLines.join('\n')
        this.dataLines = []
        const evt = this.currentEvent ?? this.defaultEvent
        this.currentEvent = null
        onEvent(evt, rawData)
      }
    }
  }

  reset(): void {
    this.buffer = ''
    this.dataLines = []
    this.currentEvent = null
  }
}
