import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  type WebsocketTransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import WebSocket from 'ws'

const logger = makeLogger('ProtobufWsTransport')

export class ProtobufWsTransport<
  T extends WebsocketTransportGenerics,
> extends WebSocketTransport<T> {
  private heartbeatInterval?: ReturnType<typeof setInterval>

  startHeartbeat(intervalMs: number): void {
    this.stopHeartbeat() // Clear any existing interval

    // Handle pong responses to update lastMessageReceivedAt
    if (this.wsConnection) {
      this.wsConnection.on('pong', () => {
        logger.debug('Received WebSocket pong')
        this.lastMessageReceivedAt = Date.now()
      })
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        logger.debug('Sending WebSocket ping')
        this.wsConnection.ping()
        // Update lastMessageReceivedAt when sending ping, since the server
        // may not respond with pong frames during low-activity periods
        this.lastMessageReceivedAt = Date.now()
      }
    }, intervalMs)
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
    }
  }

  private toRawData(payload: unknown): Buffer | null {
    // Handle undefined/null payloads gracefully
    if (payload === undefined || payload === null) {
      return null
    }
    if (Buffer.isBuffer(payload)) {
      return payload
    }
    if (payload instanceof ArrayBuffer) {
      return Buffer.from(new Uint8Array(payload))
    }
    if (ArrayBuffer.isView(payload)) {
      const v = payload as ArrayBufferView
      return Buffer.from(v.buffer, v.byteOffset, v.byteLength)
    }
    if (typeof payload === 'string') {
      return Buffer.from(payload, 'utf8')
    }
    return Buffer.from(JSON.stringify(payload), 'utf8')
  }

  async sendMessages(
    _context: EndpointContext<T>,
    subscribes: unknown[],
    unsubscribes: unknown[],
  ): Promise<void> {
    ;[...subscribes, ...unsubscribes]
      .map((m) => this.toRawData(m))
      .filter((m): m is Buffer => m !== null)
      .forEach((m) => this.wsConnection?.send(m))
  }

  deserializeMessage(data: WebSocket.Data): T['Provider']['WsMessage'] {
    if (Array.isArray(data) && data.every(Buffer.isBuffer)) {
      return Buffer.concat(data as Buffer[]) as unknown as T['Provider']['WsMessage']
    }
    if (Buffer.isBuffer(data)) {
      return data as unknown as T['Provider']['WsMessage']
    }
    if (data instanceof ArrayBuffer) {
      return Buffer.from(new Uint8Array(data)) as unknown as T['Provider']['WsMessage']
    }
    if (ArrayBuffer.isView(data)) {
      const v = data as ArrayBufferView
      return Buffer.from(
        v.buffer,
        v.byteOffset,
        v.byteLength,
      ) as unknown as T['Provider']['WsMessage']
    }
    return data as unknown as T['Provider']['WsMessage']
  }
}
