// test/integration/fixtures.ts
import { create, toBinary } from '@bufbuild/protobuf'
import { MockWebsocketServer } from '@chainlink/external-adapter-framework/util/testing-utils'
// ⬅️ don't rely on Any.pack for tests; just set {typeUrl, value}
import {
  Status as ClientStatus,
  ResponseSchema,
  StreamMessageSchema,
} from '../../src/gen/client_pb'
import { DataSchema, DecimalSchema, MarketDataSchema } from '../../src/gen/md_cef_pb'

export const STREAM = 'md-xetraetfetp'
export const TEST_ISIN = 'IE00B53L3W79'

const dec = (m: bigint, e: number) => create(DecimalSchema, { m, e })

const u8 = (schema: any, value: any): Uint8Array => toBinary(schema, value)
const toAB = (u: Uint8Array): ArrayBuffer =>
  u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength)

const frame = (typeUrl: string, payload: Uint8Array, seq: bigint): Uint8Array =>
  u8(
    StreamMessageSchema,
    create(StreamMessageSchema, {
      subs: STREAM,
      seq,
      messages: [{ typeUrl, value: payload } as any],
    }),
  )

const ack = (requestId: bigint, seq: bigint): Uint8Array =>
  frame(
    'type.googleapis.com/Client.Response',
    u8(ResponseSchema, create(ResponseSchema, { requestId, status: ClientStatus.OK })),
    seq,
  )

const quoteFrame = (seq: bigint): Uint8Array => {
  const dat = create(DataSchema, {
    Bid: { Px: dec(10000n, -2) }, // 100.00
    Offer: { Px: dec(10100n, -2) }, // 101.00
    Tm: 5_000_000n, // 5 ms
  } as any)
  const md = create(MarketDataSchema, { Instrmt: { Sym: TEST_ISIN }, Dat: dat } as any)
  return frame('type.googleapis.com/dbag.cef.MarketData', u8(MarketDataSchema, md), seq)
}

const tradeFrame = (seq: bigint): Uint8Array => {
  const dat = create(DataSchema, { Px: dec(10010n, -2), Tm: 6_000_000n } as any)
  const md = create(MarketDataSchema, { Instrmt: { Sym: TEST_ISIN }, Dat: dat } as any)
  return frame('type.googleapis.com/dbag.cef.MarketData', u8(MarketDataSchema, md), seq)
}

export const mockWebsocketServer = (FULL_URL: string): MockWebsocketServer => {
  const server = new MockWebsocketServer(FULL_URL, { mock: false })
  server.on('connection', (socket) => {
    // Send subscribe ACK as binary
    socket.send(toAB(ack(123456789n, 1n)))

    // After client sends anything, stream quote + trade frames
    socket.on('message', () => {
      socket.send(toAB(quoteFrame(2n)))
      socket.send(toAB(tradeFrame(3n)))
    })
  })
  return server
}
