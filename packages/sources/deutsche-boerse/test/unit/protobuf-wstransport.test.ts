import type { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports'
import { ProtobufWsTransport } from '../../src/transport/protobuf-wstransport'

type Dummy = WebsocketTransportGenerics & { Provider: { WsMessage: Buffer } }

describe('ProtobufWsTransport helpers', () => {
  const t = new ProtobufWsTransport<Dummy>({} as any)

  test('deserializeMessage handles Buffer', () => {
    const src = Buffer.from([1, 2, 3])
    expect(t.deserializeMessage(src)).toBeInstanceOf(Buffer)
  })

  test('deserializeMessage handles ArrayBuffer', () => {
    const ab = new Uint8Array([4, 5, 6]).buffer
    const out = t.deserializeMessage(ab)
    expect(Buffer.isBuffer(out)).toBe(true)
    expect((out as Buffer).equals(Buffer.from([4, 5, 6]))).toBe(true)
  })

  test('deserializeMessage handles ArrayBufferView', () => {
    const u8 = new Uint8Array([7, 8, 9])
    const out = t.deserializeMessage(u8)
    expect((out as Buffer).equals(Buffer.from([7, 8, 9]))).toBe(true)
  })

  test('toRawData private: coerces inputs to Buffer', () => {
    const anyT = t as any
    expect(Buffer.isBuffer(anyT.toRawData(Buffer.from('x')))).toBe(true)
    expect(Buffer.isBuffer(anyT.toRawData(new Uint8Array([1, 2])))).toBe(true)
    expect(Buffer.isBuffer(anyT.toRawData('hi'))).toBe(true)
    expect(Buffer.isBuffer(anyT.toRawData({ a: 1 }))).toBe(true)
  })
})
