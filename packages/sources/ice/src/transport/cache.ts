import { InstrumentPartialUpdate } from './netdania'
import { FullPriceUpdate } from './price'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('NetDaniaStreamingTransport')

export class LocalPriceCache {
  private underlying: Map<string, FullPriceUpdate> = new Map()

  /**
   * Filters out undefined values from an object, returning a new object with only defined properties.
   *
   * "exactOptionalPropertyTypes": true should void the need for this.
   *
   * @param obj The object to filter.
   * @returns A new object with only defined properties.
   */
  private filterUndefined(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== undefined)
    )
  }

  coalesceAndGet(update: InstrumentPartialUpdate) {
    const got = this.underlying.get(update.instrument)
    logger.trace(`coalesceAndGet: ${JSON.stringify(got)} against ${JSON.stringify(update)}`)
    if (!got) {
      if (
        !update.data.bid ||
        !update.data.mid ||
        !update.data.ask ||
        !update.data.ts ||
        !update.data.timezone
      ) {
        throw new Error(`Invalid prime image (first update) for ${update.instrument}: ${JSON.stringify(update.data)}`)
      }

      const prime = {
        bid: update.data.bid,
        mid: update.data.mid,
        ask: update.data.ask,
        firstTs: update.data.ts, // first timestamp, remains
        ts: update.data.ts, // current timestamp, will be updated
        timezone: update.data.timezone,
        version: 1, // first version
      } as FullPriceUpdate
      this.underlying.set(update.instrument, prime)
      return prime
    } else {
      const coalesced: FullPriceUpdate = {
        ...got,
        ...this.filterUndefined(update.data),
        ...{
          version: got.version + 1,
        },
      }
      this.underlying.set(update.instrument, coalesced)
      logger.trace(`coalesceAndGet: result: ${JSON.stringify(coalesced)}`)
      return coalesced
    }
  }

  drop(instruments: string[]): void {
    for (const instrument of instruments) {
      this.underlying.delete(instrument)
    }
  }
}
