import WebSocket from 'ws'

interface WsMessage {
  type: 'sent' | 'received'
  data: unknown
}

export class WsMessageRecorder {
  private static messages: Array<WsMessage> = []

  static add(message: WsMessage): void {
    this.messages.push(message)
  }

  static print(): void {
    console.log(`Recorded WebSocketMessages: ${JSON.stringify(this.messages)}`)
  }
}

type WebSocketClass = new (url: string, protocols?: string | string[] | undefined) => WebSocket

export class WebSocketClassProvider {
  static ctor: WebSocketClass = WebSocket

  static set(ctor: WebSocketClass): void {
    this.ctor = ctor
  }

  static get(): WebSocketClass {
    return this.ctor
  }
}
