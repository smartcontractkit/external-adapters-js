import { LocalPriceCache } from '../../src/transport/cache'
import fs from 'fs'
import {
  Instrument,
  InstrumentPartialUpdate,
  MonitorPriceResponse,
  PartialPriceUpdate,
  RequestId,
  Utils,
} from '../../src/transport/netdania'
import { FullPriceUpdate } from '../../src/transport/price'
import { LoggerFactory, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'

const log = console.log
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
}

const loggerFactory: LoggerFactory = {
  child: () => logger,
}

LoggerFactoryProvider.set(loggerFactory)

describe('A LocalPriceCache', () => {
  let rawUpdates: MonitorPriceResponse[]
  const cache = new LocalPriceCache()

  // read from the raw-price-updates.jsonl file in the same directory
  beforeAll(async () => {
    // load the raw updates jsonl file into a rawUpdates
    rawUpdates = (await fs.promises.readFile(__dirname + '/raw-price-updates.jsonl', 'utf-8'))
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        return JSON.parse(line) as MonitorPriceResponse
      })
  })

  afterEach(() => {
    cache['underlying'].clear()
  })

  const dummyRequestIdToInstrument = (reqId: RequestId) => {
    return reqId.toString().padStart(6, '0') as Instrument
  }

  it('must coalesce correctly updates with undefined optional fields', () => {
    const inputs: InstrumentPartialUpdate[] = [
      {
        instrument: '000007',
        data: {
          bid: 1039.662,
          mid: 1041.235,
          ask: 1042.808,
          ts: 1750333481,
          timezone: 'GMT',
        },
      },
      {
        instrument: '000007',
        data: { ts: 1750333484, ask: 1042.798, mid: 1041.23, bid: undefined, timezone: undefined },
      },
    ]

    expect(cache.coalesceAndGet(inputs[0])).toStrictEqual({
      bid: 1039.662,
      mid: 1041.235,
      ask: 1042.808,
      ts: 1750333481,
      timezone: 'GMT',
      firstTs: 1750333481,
      version: 1,
    })
    expect(cache.coalesceAndGet(inputs[1])).toStrictEqual({
      bid: 1039.662,
      mid: 1041.23,
      ask: 1042.798,
      ts: 1750333484,
      timezone: 'GMT',
      firstTs: 1750333481,
      version: 2,
    })
  })

  it('must coalesce correctly updates with absent optional fields', () => {
    const inputs: InstrumentPartialUpdate[] = [
      {
        instrument: '000007',
        data: {
          bid: 1039.662,
          mid: 1041.235,
          ask: 1042.808,
          ts: 1750333481,
          timezone: 'GMT',
        },
      },
      {
        instrument: '000007',
        data: { ts: 1750333484, ask: 1042.798, mid: 1041.23 },
      },
    ]

    expect(cache.coalesceAndGet(inputs[0])).toStrictEqual({
      bid: 1039.662,
      mid: 1041.235,
      ask: 1042.808,
      ts: 1750333481,
      timezone: 'GMT',
      firstTs: 1750333481,
      version: 1,
    })
    expect(cache.coalesceAndGet(inputs[1])).toStrictEqual({
      bid: 1039.662,
      mid: 1041.23,
      ask: 1042.798,
      ts: 1750333484,
      timezone: 'GMT',
      firstTs: 1750333481,
      version: 2,
    })
  })

  it('must coalesce all the updates correctly', () => {
    for (const update of rawUpdates) {
      const ppu: PartialPriceUpdate | null = Utils.mkPartialPriceUpdate(update)
      if (!ppu) {
        continue
      }

      const ipu: InstrumentPartialUpdate = {
        instrument: dummyRequestIdToInstrument(update.id),
        data: ppu,
      }
      console.debug(`Coalescing update: ${JSON.stringify(ipu)}`)
      try {
        const coalesced: FullPriceUpdate = cache.coalesceAndGet(ipu)
        console.debug(`Coalesced update for ${ipu.instrument}: ${JSON.stringify(coalesced)}`)
        expect(coalesced).toBeDefined()
        expect(coalesced.version).toBeDefined()
        expect(coalesced.mid).toBeDefined()
        expect(coalesced.ask).toBeDefined()
        expect(coalesced.bid).toBeDefined()
        expect(coalesced.firstTs).toBeDefined()
        expect(coalesced.ts).toBeDefined()
      } catch (e) {
        // fail the test and log the error
        console.error(`Failed to coalesce update for ${ipu.instrument}:`, e)
        throw e
      }
    }
  })
})
