import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  type WebsocketTransportGenerics,
} from '@chainlink/external-adapter-framework/transports'
import WebSocket from 'ws'

export class ProtobufWsTransport<
  T extends WebsocketTransportGenerics,
> extends WebSocketTransport<T> {
  private toRawData(payload: unknown): Buffer {
    if (Buffer.isBuffer(payload)) return payload
    if (payload instanceof ArrayBuffer) return Buffer.from(new Uint8Array(payload))
    if (ArrayBuffer.isView(payload)) {
      const v = payload as ArrayBufferView
      return Buffer.from(v.buffer, v.byteOffset, v.byteLength)
    }
    if (typeof payload === 'string') return Buffer.from(payload, 'utf8')
    return Buffer.from(JSON.stringify(payload), 'utf8')
  }

  async sendMessages(
    _context: EndpointContext<T>,
    subscribes: unknown[],
    unsubscribes: unknown[],
  ): Promise<void> {
    const messages = [...subscribes, ...unsubscribes].map((m) => this.toRawData(m))
    for (const m of messages) this.wsConnection?.send(m)
  }

  deserializeMessage(data: WebSocket.Data): T['Provider']['WsMessage'] {
    if (Array.isArray(data) && data.every(Buffer.isBuffer)) {
      return Buffer.concat(data as Buffer[]) as unknown as T['Provider']['WsMessage']
    }
    if (Buffer.isBuffer(data)) return data as unknown as T['Provider']['WsMessage']
    if (data instanceof ArrayBuffer)
      return Buffer.from(new Uint8Array(data)) as unknown as T['Provider']['WsMessage']
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
